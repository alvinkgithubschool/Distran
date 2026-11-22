"""Live-catalog discovery contracts without external requests or model quotas."""
import json
import unittest
import httpx
from backend.app.buddy import BuddyService, BuddyRequest, CatalogIndex
from backend.app.buddy_discovery import BuddyDiscovery, fallback_plan
from backend.app.cache import CatalogCache
from backend.app.canonical import CanonicalCatalog
from backend.app.catalog import CatalogService
from backend.app.config import Settings
from backend.app.model_router import ModelUnavailable, ModelRouter, CHAT_MODEL
from backend.app.providers import Providers


class Router:
    async def plan_search(self, query):raise ModelUnavailable('quota')
    async def rank(self, query, candidates):
        self.query=query;self.candidates=candidates
        return {c['id']:.9 if 'cyberpunk' in (c['description']+' '.join(c['tags'])).lower() else 0 for c in candidates}
    async def converse(self, prompt, *, candidates, history):
        source=candidates[0]
        return dict(reply='These catalog stories explore cyberpunk themes.',referenced_ids=[source['id']],evidence=[dict(id=source['id'],quote=source['description'])])


class DiscoveryTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.cache=CatalogCache(':memory:');self.canonical=CanonicalCatalog(self.cache.db);self.calls=[]
        async def handler(request):
            path=request.url.path;self.calls.append((path,str(request.url),request.content.decode()))
            if path=='/oauth2/token':return httpx.Response(200,json={'access_token':'fixture','expires_in':3600})
            if path=='/3/configuration':return httpx.Response(200,json={})
            if path=='/3/search/keyword':return httpx.Response(200,json={'results':[{'id':77,'name':'cyberpunk'}]})
            if path.startswith('/3/genre/'):return httpx.Response(200,json={'genres':[{'id':878,'name':'Science Fiction'}]})
            if path.startswith('/3/discover/'):
                return httpx.Response(200,json={'results':[{'id':101,'title':'Beyond the Neon','name':'Neon series','overview':'A cyberpunk story about memory and rebellion.','genres':[{'name':'Science Fiction'}]}]})
            if path=='/3/person/9':return httpx.Response(200,json={'id':9,'name':'Director','combined_credits':{'crew':[
                {'id':202,'title':'Director connection','overview':'A cyberpunk story of identity.','media_type':'movie','job':'Director'},
                {'id':203,'title':'Acting role','overview':'Unrelated','media_type':'movie','job':'Actor'}]}})
            if path in ('/3/search/movie','/3/search/tv','/3/search/multi'):
                return httpx.Response(200,json={'results':[{'id':105248,'name':'Cyberpunk: Edgerunners','media_type':'tv','overview':'Cyberpunk mercenaries in a corrupt city.'}] if 'edgerunners' in request.url.params.get('query','').lower() else []})
            if path=='/3/tv/105248':return httpx.Response(200,json={'id':105248,'name':'Cyberpunk: Edgerunners','overview':'Cyberpunk mercenaries in a corrupt city.','genres':[{'name':'Science Fiction'}],'keywords':{'results':[{'id':77,'name':'cyberpunk'}]},'credits':{'crew':[{'id':9,'name':'Director','job':'Director'}]},'recommendations':{'results':[{'id':333,'name':'Outside the starter catalog','overview':'A cyberpunk rebellion against corporations.'}]}})
            if path.startswith('/3/movie/') or path.startswith('/3/tv/'):
                return httpx.Response(200,json={'id':int(path.split('/')[-1]),'title':'Beyond the Neon','name':'Neon series','overview':'A cyberpunk story about memory and rebellion.','runtime':95,'credits':{'crew':[{'id':9,'name':'Director','job':'Director'}]}})
            if path=='/v4/games':return httpx.Response(200,json=[{'id':500,'name':'New neon game','summary':'A cyberpunk detective story.','themes':[{'name':'Cyberpunk'}],'involved_companies':[{'company':{'id':8,'name':'Neon Studio'},'developer':True}]}])
            if path=='/v4/keywords':return httpx.Response(200,json=[{'id':88,'name':'cyberpunk'}])
            if path in ('/v4/themes','/v4/genres'):return httpx.Response(200,json=[])
            return httpx.Response(404,json={})
        self.client=httpx.AsyncClient(transport=httpx.MockTransport(handler))
        settings=Settings(tmdb_token='fixture',twitch_id='fixture',twitch_secret='fixture')
        providers=Providers(settings,self.client,self.cache)
        for gate in providers.gates.values():gate.interval=0
        self.discovery=BuddyDiscovery(CatalogService(providers),self.canonical)

    async def asyncTearDown(self):
        await self.client.aclose();self.cache.close()

    async def test_discovery_searches_keywords_genres_descriptions_and_studios_beyond_builtins(self):
        result=await self.discovery.discover('Cyberpunk stories across formats','all',Router(),self.canonical.known())
        ids={w['id'] for w in result['works']}
        self.assertIn('igdb:game:500',ids);self.assertIn('tmdb:movie:101',ids)
        self.assertEqual(result['providers'],['igdb','tmdb'])
        body=next(body for path,_,body in self.calls if path=='/v4/games' and 'limit 60;' in body)
        keyword_body=next(body for path,_,body in self.calls if path=='/v4/keywords')
        self.assertIn('name ~ *"cyberpunk"*',keyword_body)
        self.assertIn('keywords = (88)',body)
        self.assertIn('themes.name',body);self.assertIn('involved_companies.company.name',body)
        self.assertEqual(len(self.canonical.builtins()['items']),12)
        self.assertIn('igdb:game:500',{w['id'] for w in self.canonical.known()})

    async def test_seen_inspiration_guides_search_but_is_not_recommended_and_dynamic_followups_persist(self):
        router=Router();index=CatalogIndex(directory='/missing')
        service=BuddyService(router,index,canonical=self.canonical,discovery=self.discovery)
        first=await service.query(BuddyRequest(mode='chat',prompt='Recommendations after watching Cyberpunk Edgerunners',exclude_ids=list(self.canonical.ids)))
        ids=[item['work']['id'] for item in first['items']]
        self.assertTrue(ids);self.assertNotIn('tmdb:tv:105248',ids)
        self.assertIn('Inspiration metadata',router.query)
        self.assertIn('corrupt city',router.query)
        self.assertTrue(any('discover/movie' in path for path,_,_ in self.calls))
        self.assertIn('tmdb:movie:202',{w['id'] for w in self.canonical.known()})
        self.assertNotIn('tmdb:movie:203',{w['id'] for w in self.canonical.known()})
        self.assertTrue(all('creator' in c for c in router.candidates))
        before=len(self.calls)
        next_result=await service.query(BuddyRequest(mode='chat',prompt='why does the first one fit?',context=first['context']))
        self.assertEqual([item['work']['id'] for item in next_result['items']],ids)
        self.assertEqual(len(self.calls),before)

    async def test_duration_hydration_and_games_only_remain_hard_constraints(self):
        service=BuddyService(Router(),CatalogIndex(directory='/missing'),canonical=self.canonical,discovery=self.discovery)
        result=await service.query(BuddyRequest(prompt='cyberpunk',medium='movie',max_minutes=100,exclude_ids=self.canonical.ids))
        self.assertTrue(result['items'])
        self.assertTrue(all(item['work']['medium']=='movie' and item['work']['verified_duration_minutes']<=100 for item in result['items']))
        result=await service.query(BuddyRequest(prompt='cyberpunk games only',exclude_ids=self.canonical.ids))
        self.assertEqual([item['work']['id'] for item in result['items']],['igdb:game:500'])

    async def test_query_strings_are_escaped_and_spelling_fallback_keeps_seed(self):
        plan=fallback_plan('Reccomendations aftwe Cyberpunk Edgerunners',self.canonical.known())
        self.assertIn('Cyberpunk: Edgerunners',plan['seed_titles'])
        await self.discovery.discover('cyberpunk " ; fields *;','game',Router(),self.canonical.known())
        body=next(body for path,_,body in self.calls if path=='/v4/games' and 'limit 60;' in body)
        self.assertIn('limit 60;',body)
        self.assertNotIn('search cyberpunk',body)

    async def test_plan_uses_approved_free_conversation_route_and_rejects_invalid_schema(self):
        for output,valid in [(dict(search_terms=['cyberpunk'],seed_titles=[],creator_names=[]),True),
                             (dict(search_terms=['cyberpunk']*20,seed_titles=[],creator_names=[]),False)]:
            async def handler(request):
                if request.method=='GET':return httpx.Response(200,json={'data':[{'id':CHAT_MODEL,'pricing':{'prompt':'0','completion':'0'}}]})
                body=json.loads(request.content);self.assertEqual(body['model'],CHAT_MODEL)
                self.assertEqual(body['provider']['max_price'],{'prompt':0,'completion':0})
                return httpx.Response(200,json={'model':CHAT_MODEL,'choices':[{'message':{'content':json.dumps(output)}}]})
            async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
                router=ModelRouter(client,'fixture')
                if valid:self.assertEqual((await router.plan_search('cyberpunk'))['search_terms'],['cyberpunk'])
                else:
                    with self.assertRaises(ModelUnavailable):await router.plan_search('cyberpunk')

    async def test_partial_provider_outage_retains_other_provider_results(self):
        original=self.discovery.providers.tmdb
        async def fail(*args,**kwargs):
            from backend.app.providers import ProviderError
            raise ProviderError('tmdb','unavailable')
        self.discovery.providers.tmdb=fail
        result=await self.discovery.discover('cyberpunk','all',Router(),self.canonical.known())
        self.assertIn('igdb:game:500',{w['id'] for w in result['works']})
        self.assertIn('igdb',result['providers']);self.assertTrue(result['errors'])
        self.discovery.providers.tmdb=original

    def test_seen_editions_and_format_balance_cannot_starve_other_formats(self):
        index=CatalogIndex(directory='/missing')
        rows=[dict(id=f'igdb:game:{i}',title=f'Neon {i}',medium='game',description='cyberpunk',tags=['Cyberpunk']) for i in range(40)]
        rows += [dict(id='tmdb:movie:700',title='Neon film',medium='movie',description='A cyberpunk city story.',tags=['Cyberpunk']),
                 dict(id='igdb:game:900',parent_work_id='igdb:game:1',title='Neon edition',medium='game',description='cyberpunk',tags=['Cyberpunk'])]
        result=index.retrieve('cyberpunk','all',{'igdb:game:1'},None,rows)
        self.assertIn('tmdb:movie:700',{r['work']['id'] for r in result})
        self.assertNotIn('igdb:game:900',{r['work']['id'] for r in result})

    def test_search_summaries_cannot_erase_resolved_creators_and_durations(self):
        original=next(w for w in self.canonical.builtins()['items'] if w['id']=='tmdb:movie:335984')
        summary={**original,'maker':'See title details','creatorRole':None,'creators':[],'credits':[],'duration':'See title details','themes':['cyberpunk']}
        summary.pop('verified_duration_minutes',None)
        remembered=self.canonical.remember(summary)
        self.assertEqual(remembered['maker'],original['maker'])
        self.assertEqual(remembered['creators'],original['creators'])
        self.assertEqual(remembered['verified_duration_minutes'],original['verified_duration_minutes'])
        self.assertIn('cyberpunk',remembered['themes'])
