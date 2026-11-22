"""Free-only routing and catalog constraints. No live requests or real credentials."""
import json
from pathlib import Path
import tempfile
import unittest
import httpx
from backend.app.buddy import BuddyRequest,BuddyService,CatalogIndex,explicit_medium
from backend.app.config import Settings
from backend.app.main import create_app
from backend.app.model_router import ModelRouter,ModelUnavailable,CHAT_MODEL,RANK_MODEL


def metadata(model, price='0'):
    return {'id':model,'canonical_slug':model.removesuffix(':free')+'-fixture',
            'pricing':{'prompt':price,'completion':'0'}}

class RouterTests(unittest.IsolatedAsyncioTestCase):
    async def test_independent_questions_cannot_borrow_another_candidates_metadata(self):
        async def handler(request):
            if request.method=='GET':return httpx.Response(200,json={'data':[metadata(RANK_MODEL)]})
            body=json.loads(request.content)
            self.assertNotIn('candidates',json.loads(body['state']))
            first=body['questions']['candidate_0']['instructions'];second=body['questions']['candidate_1']['instructions']
            self.assertIn('Neon dystopia',first);self.assertNotIn('Family holiday',first)
            self.assertIn('Family holiday',second);self.assertNotIn('Neon dystopia',second)
            return httpx.Response(200,json={'model':RANK_MODEL,'answers':{'candidate_1':{'type':'score','score':0},'candidate_0':{'type':'score','score':3}}})
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            scores=await ModelRouter(client,'fixture').rank('cyberpunk',[{'id':'neon','title':'Neon dystopia'},{'id':'family','title':'Family holiday'}])
        self.assertEqual(scores,{'neon':1,'family':0})

    async def test_explicit_routes_and_different_api_contracts(self):
        calls=[]
        async def handler(r):
            if r.method=='GET':
                model=RANK_MODEL if r.url.params.get('output_modalities')=='decisions' else CHAT_MODEL
                return httpx.Response(200,json={'data':[metadata(model)]})
            body=json.loads(r.content);calls.append((r.url.path,body))
            self.assertEqual(body['provider']['max_price'],{'prompt':0,'completion':0})
            self.assertFalse(body['provider']['allow_fallbacks'])
            self.assertNotIn('models',body)
            if r.url.path=='/api/alpha/decisions':
                return httpx.Response(200,json={'model':metadata(RANK_MODEL)['canonical_slug'],'answers':{'candidate_0':{'type':'score','score':2.4}},'usage':{'cost':0}})
            return httpx.Response(200,json={'model':CHAT_MODEL,'choices':[{'message':{'content':'Hello'}}],'usage':{'cost':0}})
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            router=ModelRouter(client,'fixture-secret')
            self.assertEqual(await router.converse('Hi'),'Hello')
            self.assertAlmostEqual((await router.rank('space',[{'id':'known'}]))['known'],.8)
            self.assertEqual([p for p,_ in calls],['/api/v1/chat/completions','/api/alpha/decisions'])
            with self.assertRaises(ValueError):router.model_for('paid')

    async def test_nonzero_prices_or_missing_models_prevent_inference(self):
        for entries in [[metadata(CHAT_MODEL,'0.1')],[]]:
            calls=[]
            async def handler(r):
                calls.append(r.method);return httpx.Response(200,json={'data':entries})
            async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
                with self.assertRaises(ModelUnavailable):await ModelRouter(client,'fixture').converse('Hi')
            self.assertNotIn('POST',calls)

    async def test_refusals_unknown_models_and_nonzero_usage_are_not_accepted(self):
        variants=[{'model':RANK_MODEL,'answers':{'candidate_0':{'type':'refusal'}}},
                  {'model':'paid/other','answers':{}},
                  {'model':RANK_MODEL,'answers':{},'usage':{'cost':.01}},
                  {'model':RANK_MODEL,'answers':{'candidate_0':{'type':'score','score':float('inf')}}}]
        for payload in variants:
            async def handler(r):
                if r.method=='GET':return httpx.Response(200,json={'data':[metadata(RANK_MODEL)]})
                # Python JSON accepts Infinity; provider response validation still rejects it.
                return httpx.Response(200,content=json.dumps(payload),headers={'content-type':'application/json'})
            async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
                with self.assertRaises(ModelUnavailable):await ModelRouter(client,'fixture').rank('theme',[{'id':'a'}])

    async def test_errors_do_not_echo_provider_body_and_do_not_retry(self):
        posts=[]
        async def handler(r):
            if r.method=='GET':return httpx.Response(200,json={'data':[metadata(CHAT_MODEL)]})
            posts.append(r);return httpx.Response(429,json={'error':{'message':'fixture-secret'}})
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            with self.assertRaises(ModelUnavailable) as caught:await ModelRouter(client,'fixture-secret').converse('Hi')
            self.assertEqual(str(caught.exception),'provider_rate_limited')
            self.assertEqual(len(posts),1)


class FailingRouter:
    async def rank(self,*args):raise ModelUnavailable('provider_unavailable')
    async def converse(self,*args,**kwargs):raise ModelUnavailable('provider_unavailable')


class BuddyTests(unittest.IsolatedAsyncioTestCase):
    async def test_medium_seen_and_verified_duration_constraints_survive_fallback(self):
        index=CatalogIndex(directory='/does-not-exist')
        index.works=[dict(id='g',title='Game',medium='game',description='hopeful space',tags=['Space']),
                     dict(id='m',title='Film',medium='movie',description='space',tags=['Space'],verified_duration_minutes=95),
                     dict(id='u',title='Unknown',medium='movie',description='space',tags=['Space'])]
        service=BuddyService(FailingRouter(),index)
        result=await service.query(BuddyRequest(prompt='space',max_minutes=100))
        self.assertEqual([p['work']['id'] for p in result['items']],['m'])
        self.assertTrue(result['degraded']);self.assertIsNone(result['model'])
        result=await service.query(BuddyRequest(prompt='space',refinement='games only',exclude_ids=['g']))
        self.assertEqual(result['items'],[])
        self.assertEqual(explicit_medium('more hopeful, films only','all'),'movie')
        result=await service.query(BuddyRequest(prompt='space, games only',refinement='more hopeful'))
        self.assertEqual(result['medium'],'game')
        self.assertTrue(all(p['work']['medium']=='game' for p in result['items']))

    async def test_conversation_falls_back_without_inventing_a_list(self):
        result=await BuddyService(FailingRouter()).query(BuddyRequest(mode='chat',prompt='Hi'))
        self.assertEqual(result['items'],[]);self.assertIsNone(result['models']['conversation']);self.assertIn('Tell me',result['reply'])

    async def test_catalog_evidence_and_private_fields_never_sent_to_provider(self):
        calls=[]
        class Router:
            async def rank(self,query,candidates):
                calls.append(candidates);return {c['id']:.8 for c in candidates}
        result=await BuddyService(Router()).query(BuddyRequest(prompt='space',exclude_ids=['cyberpunk'],limit=3))
        self.assertLessEqual(len(result['items']),3)
        self.assertTrue(all(r['work']['id']!='cyberpunk' for r in result['items']))
        self.assertTrue(all(r['evidence']==r['work']['description'] for r in result['items']))
        self.assertEqual(set(calls[0][0]),{'id','title','description','tags','creator'})

    async def test_api_schema_cors_flags_and_no_secret_response(self):
        settings=Settings(openrouter_key='',buddy_enabled=True,cache_path=':memory:')
        app=create_app(settings,httpx.MockTransport(lambda r:httpx.Response(503)))
        async with app.router.lifespan_context(app),httpx.AsyncClient(transport=httpx.ASGITransport(app),base_url='http://test') as client:
            self.assertTrue((await client.get('/v1/features')).json()['buddy'])
            response=await client.post('/v1/buddy/query',json={'prompt':'space','medium':'game'})
            self.assertEqual(response.status_code,200)
            self.assertEqual(response.headers['cache-control'],'no-store')
            self.assertTrue(response.json()['free_only'])
            self.assertEqual((await client.post('/v1/buddy/query',json={'prompt':'hi','model':'paid/model'})).status_code,422)
            self.assertEqual((await client.post('/v1/buddy/query',json={'prompt':'   '})).status_code,422)
            cors=await client.options('/v1/buddy/query',headers={'Origin':'http://127.0.0.1:1420','Access-Control-Request-Method':'POST'})
            self.assertEqual(cors.status_code,200)
        self.assertNotIn('fixture-secret',repr(settings))

class GroundedConversationTests(unittest.IsolatedAsyncioTestCase):
    def index(self):
        index=CatalogIndex(directory='/does-not-exist')
        index.works=[dict(id='g',title='Neon city',medium='game',description='A hopeful cyberpunk mystery about memory.',tags=['Cyberpunk']),
                     dict(id='m',title='Neon film',medium='movie',description='A cyberpunk film about identity.',tags=['Cyberpunk'],verified_duration_minutes=95),
                     dict(id='unrelated',title='Garden',medium='game',description='Flowers and peaceful gardening.',tags=['Gardening'])]
        return index

    async def test_chat_retrieves_ranks_supplies_catalog_and_preserves_followup(self):
        calls=[]
        class Router:
            async def rank(self,query,candidates):
                calls.append(('rank',query,candidates));return {c['id']:(0 if c['id']=='unrelated' else .9) for c in candidates}
            async def converse(self,prompt,*,candidates,history):
                calls.append(('chat',prompt,candidates,history))
                first=candidates[0]
                return {'reply':'Here are real catalog picks.','referenced_ids':[first['id']],'evidence':[{'id':first['id'],'quote':first['description']}]}
        service=BuddyService(Router(),self.index())
        first=await service.query(BuddyRequest(mode='chat',prompt='recommend cyberpunk stories'))
        self.assertEqual({p['work']['id'] for p in first['items']},{'g','m'})
        self.assertEqual(first['models'],{'ranking':RANK_MODEL,'conversation':CHAT_MODEL})
        self.assertEqual(len(calls[-1][2]),2)
        second=await service.query(BuddyRequest(mode='chat',prompt='games only',context=first['context'],history=[{'role':'user','content':'recommend cyberpunk stories'}]))
        self.assertEqual([p['work']['id'] for p in second['items']],['g'])
        self.assertIn('cyberpunk',second['context']['theme'])
        self.assertEqual(second['medium'],'game')
        self.assertEqual(calls[-1][3][0]['content'],'recommend cyberpunk stories')
        rank_count=sum(call[0]=='rank' for call in calls)
        third=await service.query(BuddyRequest(mode='chat',prompt='why does the first one fit?',context=second['context']))
        self.assertEqual([p['work']['id'] for p in third['items']],['g'])
        self.assertEqual(sum(call[0]=='rank' for call in calls),rank_count)

    async def test_writer_failure_keeps_real_cards_and_save_context(self):
        class Router:
            async def rank(self,query,candidates):return {c['id']:.9 for c in candidates}
            async def converse(self,*args,**kwargs):raise ModelUnavailable('invalid_grounded_conversation')
        result=await BuddyService(Router(),self.index()).query(BuddyRequest(mode='chat',prompt='cyberpunk games',exclude_ids=['unrelated']))
        self.assertEqual([p['work']['id'] for p in result['items']],['g'])
        self.assertTrue(result['degraded']);self.assertIn('catalog pick',result['reply'])
        self.assertNotIn('switch',result['reply'].lower())

    async def test_duration_language_is_enforced_and_remembered(self):
        result=await BuddyService(FailingRouter(),self.index()).query(BuddyRequest(mode='chat',prompt='cyberpunk movies under 2 hours'))
        self.assertEqual(result['context']['max_minutes'],120)
        self.assertEqual([p['work']['id'] for p in result['items']],['m'])
        next_result=await BuddyService(FailingRouter(),self.index()).query(BuddyRequest(mode='chat',prompt='more hopeful',context=result['context']))
        self.assertEqual(next_result['context']['max_minutes'],120)
        self.assertEqual(next_result['medium'],'movie')

    async def test_model_reply_requires_known_references_and_verbatim_evidence(self):
        source={'id':'real','title':'Neon','description':'A hopeful cyberpunk mystery about memory.'}
        replies=[{'reply':'Try an invented title','referenced_ids':['invented'],'evidence':[]},
                 {'reply':'A real pick','referenced_ids':['real'],'evidence':[{'id':'real','quote':'Fabricated evidence'}]},
                 {'reply':'I cannot access a catalog','referenced_ids':['real'],'evidence':[{'id':'real','quote':source['description']}]},
                 {'reply':'This explores memory.','referenced_ids':['real'],'evidence':[{'id':'real','quote':'cyberpunk mystery about memory.'}]},
                 {'reply':'This explores memory.','referenced_ids':['real']}]
        for i,answer in enumerate(replies):
            async def handler(request):
                if request.method=='GET':return httpx.Response(200,json={'data':[metadata(CHAT_MODEL)]})
                payload=json.loads(request.content)
                self.assertIn(source['description'],payload['messages'][1]['content'])
                self.assertNotIn('suggest using Make a list',payload['messages'][0]['content'])
                return httpx.Response(200,json={'model':CHAT_MODEL,'choices':[{'message':{'content':json.dumps(answer)}}],'usage':{'cost':0}})
            async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
                router=ModelRouter(client,'fixture')
                if i<3:
                    with self.assertRaises(ModelUnavailable):await router.converse('cyberpunk',candidates=[source],history=[])
                else:
                    result=await router.converse('cyberpunk',candidates=[source],history=[])
                    self.assertEqual(result['referenced_ids'],['real'])
                    self.assertIn(result['evidence'][0]['quote'],source['description'])

    async def test_empty_catalog_result_cannot_be_replaced_by_a_generic_model_list(self):
        class Router:
            async def rank(self,query,candidates):return {c['id']:0 for c in candidates}
            async def converse(self,*args,**kwargs):raise AssertionError('No sources: do not ask a model to invent an answer')
        result=await BuddyService(Router(),self.index()).query(BuddyRequest(mode='chat',prompt='cyberpunk recommendations'))
        self.assertEqual(result['items'],[])
        self.assertIn('No verified matches',result['reply'])
        self.assertIsNone(result['models']['conversation'])
