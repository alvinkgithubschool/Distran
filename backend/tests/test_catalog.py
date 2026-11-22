import asyncio
from collections import Counter
import json
from pathlib import Path
import tempfile
import unittest
import httpx
from backend.app.cache import CatalogCache
from backend.app.config import Settings
from backend.app.providers import Providers, ProviderError, retry_after
from backend.app.catalog import CatalogService
from backend.app.main import create_app

TMDB_MOVIE={'id':157336,'title':'Interstellar','overview':'A journey beyond Earth.','release_date':'2014-11-05','poster_path':'/poster.jpg','vote_average':8.4,'vote_count':100}
GAME={'id':1877,'name':'Cyberpunk 2077','slug':'cyberpunk-2077','summary':'Night City.','cover':{'image_id':'co123'},'total_rating':85,'total_rating_count':50,'first_release_date':1607558400}

def settings(path=':memory:'):
 return Settings(tmdb_token='test-tmdb-token',twitch_id='test-client-id',twitch_secret='test-client-secret',cache_path=path)

def transport(counter, fail=None):
 async def handler(request):
  path=request.url.path;counter[path]+=1
  if fail and fail(request):return httpx.Response(503,json={'error':'temporary'})
  if path=='/oauth2/token':
   assert 'client_secret' not in str(request.url)
   assert b'test-client-secret' in request.content
   return httpx.Response(200,json={'access_token':'test-access-token','expires_in':3600})
  if path=='/3/configuration':return httpx.Response(200,json={'images':{'secure_base_url':'https://image.tmdb.org/t/p/','poster_sizes':['w185','w500']}})
  if path.startswith('/3/search/') or path.startswith('/3/trending/'):
   return httpx.Response(200,json={'results':[dict(TMDB_MOVIE,media_type='movie'),{'id':9,'media_type':'person','name':'Person'}],'total_pages':2})
  if path=='/3/movie/157336':return httpx.Response(200,json={**TMDB_MOVIE,'runtime':169,'credits':{'crew':[{'job':'Director','name':'Christopher Nolan'}],'cast':[{'name':'Actor','character':'Cooper'}]},'production_companies':[{'name':'Paramount'}],'recommendations':{'results':[dict(TMDB_MOVIE,id=22)]},'belongs_to_collection':{'id':123,'name':'Collection'}})
  if path=='/3/collection/123':return httpx.Response(200,json={'parts':[dict(TMDB_MOVIE,id=99)]})
  if path=='/v4/games':return httpx.Response(200,json=[{**GAME,'involved_companies':[{'developer':True,'company':{'name':'CD PROJEKT RED'}}]}])
  return httpx.Response(404,json={})
 return httpx.MockTransport(handler)

class CacheTests(unittest.IsolatedAsyncioTestCase):
 async def test_single_flight_and_persistent_reuse(self):
  with tempfile.TemporaryDirectory() as folder:
   path=str(Path(folder)/'cache.db');cache=CatalogCache(path);calls=0
   async def load():
    nonlocal calls
    calls+=1;await asyncio.sleep(.01);return {'value':42}
   values=await asyncio.gather(*(cache.remember('same',load,60) for _ in range(12)))
   self.assertEqual(calls,1);self.assertTrue(all(v[0]['value']==42 for v in values));cache.close()
   cache=CatalogCache(path);value,status=await cache.remember('same',load,60)
   self.assertEqual(status,'hit');self.assertEqual(calls,1);cache.close()
 async def test_stale_fallback_and_size_bound(self):
  cache=CatalogCache(':memory:',max_entries=2);cache.put('old',{'ok':True},-1)
  async def fail():raise ProviderError('tmdb')
  value,status=await cache.remember('old',fail,60)
  self.assertEqual(status,'stale');self.assertTrue(value['ok'])
  cache.put('a',{},60);cache.put('b',{},60)
  self.assertEqual(cache.db.execute('SELECT COUNT(*) FROM cache').fetchone()[0],2);cache.close()

class ProviderTests(unittest.IsolatedAsyncioTestCase):
 async def test_token_reused_and_query_escaped(self):
  calls=Counter();bodies=[]
  underlying=transport(calls)
  async def capture(request):
   if request.url.path=='/v4/games':bodies.append(request.content.decode())
   return await underlying.handle_async_request(request)
  cache=CatalogCache(':memory:')
  async with httpx.AsyncClient(transport=httpx.MockTransport(capture)) as client:
   p=Providers(settings(),client,cache);s=CatalogService(p)
   dangerous='game"; fields *; search "'
   await s.search_igdb(dangerous,1);await s.search_igdb('another query',1)
   self.assertEqual(calls['/oauth2/token'],1)
   self.assertIn('search '+json.dumps(dangerous)+';',bodies[0])
   self.assertIn('limit 21; offset 0;',bodies[0]);cache.close()
 async def test_401_refreshes_token_once(self):
  calls=Counter()
  async def handler(request):
   calls[request.url.path]+=1
   if request.url.path=='/oauth2/token':return httpx.Response(200,json={'access_token':f'token-{calls[request.url.path]}','expires_in':3600})
   if request.headers['authorization']=='Bearer token-1':return httpx.Response(401)
   return httpx.Response(200,json=[GAME])
  cache=CatalogCache(':memory:')
  async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
   p=Providers(settings(),client,cache);await p.igdb('fields id; limit 1;')
   self.assertEqual(calls['/oauth2/token'],2);self.assertEqual(calls['/v4/games'],2)
  cache.close()
 async def test_partial_results_and_detail_normalization(self):
  calls=Counter();cache=CatalogCache(':memory:')
  async with httpx.AsyncClient(transport=transport(calls,lambda r:r.url.path=='/v4/games')) as client:
   service=CatalogService(Providers(settings(),client,cache));result=await service.search('Interstellar','all',1)
   self.assertEqual(result['status'],'partial');self.assertEqual(len(result['items']),1);self.assertEqual(result['errors'][0]['provider'],'igdb')
   details=await service.detail('tmdb:movie:157336')
   self.assertEqual(details['work']['maker'],'Christopher Nolan');self.assertEqual(details['work']['rating'],'4.2');self.assertEqual(details['work']['related'],['tmdb:movie:99','tmdb:movie:22'])
   self.assertEqual(calls['/3/configuration'],1)
  cache.close()
 async def test_long_retry_after_fails_fast_without_retry_storm(self):
  calls=0
  async def handler(request):
   nonlocal calls
   calls+=1;return httpx.Response(429,headers={'retry-after':'45'})
  cache=CatalogCache(':memory:')
  async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
   with self.assertRaises(ProviderError):await Providers(settings(),client,cache).tmdb('configuration')
   self.assertEqual(calls,1)
  self.assertEqual(retry_after('45'),45);cache.close()
 async def test_request_spacing(self):
  times=[]
  async def handler(request):times.append(asyncio.get_running_loop().time());return httpx.Response(200,json={})
  cache=CatalogCache(':memory:')
  async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
   p=Providers(settings(),client,cache)
   await asyncio.gather(*(p.request('igdb','POST','https://api.igdb.com/v4/games') for _ in range(3)))
  self.assertGreaterEqual(times[1]-times[0],.32);self.assertGreaterEqual(times[2]-times[1],.32);cache.close()

class APITests(unittest.IsolatedAsyncioTestCase):
 async def test_routes_validate_ids_pagination_cors_and_hide_credentials(self):
  calls=Counter();app=create_app(settings(),transport(calls))
  async with app.router.lifespan_context(app):
   async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app),base_url='http://test') as client:
    result=await client.get('/v1/catalog/search',params={'q':'Interstellar','medium':'movie'},headers={'Origin':'http://127.0.0.1:1420'})
    self.assertEqual(result.status_code,200);self.assertEqual(result.headers['access-control-allow-origin'],'http://127.0.0.1:1420')
    result2=await client.get('/v1/catalog/search',params={'q':'Interstellar','medium':'movie'})
    self.assertIn('hit',result2.headers['x-catalog-cache']);self.assertEqual(calls['/3/search/movie'],1)
    for params in ({'page':0},{'page':51},{'q':'x'*101},{'medium':'invalid'}):self.assertEqual((await client.get('/v1/catalog/search',params=params)).status_code,422)
    self.assertEqual((await client.get('/v1/works/tmdb:movie:1;DROP')).status_code,422)
    serialized=result.text+(await client.get('/v1/features')).text
    for secret in ['test-tmdb-token','test-client-secret','test-access-token']:self.assertNotIn(secret,serialized)
    evil=await client.get('/health',headers={'Origin':'https://evil.example'})
    self.assertNotIn('access-control-allow-origin',evil.headers)

if __name__=='__main__':unittest.main()

class CreatorNormalizationTests(unittest.TestCase):
 def test_tv_series_directors_outrank_episode_directors_and_creators(self):
  from backend.app.catalog import tmdb_work
  row={'id':1,'name':'Series','created_by':[{'id':9,'name':'Writer'}],
       'aggregate_credits':{'crew':[
        {'id':1,'name':'Episode Director','jobs':[{'job':'Director','episode_count':2}]},
        {'id':2,'name':'Series Director','jobs':[{'job':'Series Director','episode_count':10}]},
        {'id':3,'name':'Creative Director','jobs':[{'job':'Creative Director','episode_count':10}]},
        {'id':4,'name':'Assistant','jobs':[{'job':'Assistant Director','episode_count':10}]}],
       'cast':[{'id':5,'name':'Actor','roles':[{'character':'Lead'}]}]}}
  work=tmdb_work(row,'tv')
  self.assertEqual(work['maker'],'Series Director')
  self.assertEqual([c['id'] for c in work['creators']],['tmdb:person:2'])
  self.assertEqual(work['creatorRole'],'Director')
  self.assertTrue(any(c['id']=='tmdb:person:5' for c in work['credits']))
  self.assertTrue(any(c['role']=='Creative Director' for c in work['credits']))
  self.assertNotIn('verified_duration_minutes',work)
 def test_movies_have_director_ids_and_only_runtime_is_a_verified_duration(self):
  from backend.app.catalog import tmdb_work
  row={'id':2,'title':'Film','runtime':116,'credits':{'crew':[{'id':7,'name':'Director','job':'Director'},{'id':8,'name':'Writer','job':'Writer'}]}}
  work=tmdb_work(row,'movie')
  self.assertEqual(work['creators'][0]['id'],'tmdb:person:7')
  self.assertEqual(work['verified_duration_minutes'],116)
  self.assertEqual(work['credits'][1]['id'],'tmdb:person:8')
 def test_game_studios_are_developers_and_publishers_stay_in_credits(self):
  from backend.app.catalog import igdb_work
  row={'id':3,'name':'Game','involved_companies':[
       {'company':{'id':11,'name':'Publisher'},'publisher':True},
       {'company':{'id':12,'name':'Studio'},'developer':True}], 'platforms':[{'name':'PC'}]}
  work=igdb_work(row)
  self.assertEqual(work['maker'],'Studio')
  self.assertEqual(work['creators'][0]['id'],'igdb:company:12')
  self.assertTrue(any(c.get('id')=='igdb:company:11' for c in work['credits']))
  self.assertEqual(work['duration'],'Playtime not verified')
  self.assertEqual(work['platforms'],['PC'])

class CanonicalCatalogTests(unittest.IsolatedAsyncioTestCase):
 async def test_builtin_api_uses_canonical_records_and_retains_offline_provenance(self):
  app=create_app(settings(),transport(Counter()))
  async with app.router.lifespan_context(app),httpx.AsyncClient(transport=httpx.ASGITransport(app=app),base_url='http://test') as client:
   response=await client.get('/v1/catalog/builtins');self.assertEqual(response.status_code,200)
   data=response.json();self.assertEqual(data['source'],'canonical_sqlite');self.assertEqual(len(data['items']),12)
   self.assertEqual(data['aliases']['dune'],'tmdb:movie:693134')
   self.assertTrue(all(w.get('provider') in ('tmdb','igdb') and w.get('sourceUrl') for w in data['items']))
   work=next(w for w in data['items'] if w['id']==data['aliases']['dune'])
   updated=app.state.canonical.update({**work,'maker':'Updated director'})
   self.assertEqual(updated['maker'],'Updated director');self.assertIn('themes',updated)
   latest=(await client.get('/v1/catalog/builtins')).json()
   self.assertEqual(next(w for w in latest['items'] if w['id']==work['id'])['maker'],'Updated director')
