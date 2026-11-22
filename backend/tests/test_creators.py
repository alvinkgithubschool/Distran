"""Creator directory contracts use provider fixtures and never call live APIs."""
import json
from collections import Counter
from pathlib import Path
import tempfile
import unittest
import httpx
from backend.app.config import Settings
from backend.app.main import create_app

PERSON = {'id': 525, 'name': 'Christopher Nolan', 'known_for_department': 'Directing', 'profile_path': '/nolan.jpg', 'biography': 'Filmmaker.'}
COMPANY = {'id': 908, 'name': 'CD PROJEKT RED', 'slug': 'cd-projekt-red', 'logo': {'image_id': 'cltest'}, 'description': 'Game studio.'}


class CreatorAPITests(unittest.IsolatedAsyncioTestCase):
    async def test_search_detail_cache_and_provider_endpoint_isolation(self):
        calls = Counter()
        bodies = []
        async def handler(request):
            path = request.url.path
            calls[path] += 1
            if path == '/oauth2/token':
                return httpx.Response(200, json={'access_token': 'fixture', 'expires_in': 3600})
            if path == '/3/search/person':
                return httpx.Response(200, json={'results': [PERSON], 'total_pages': 2})
            if path == '/3/person/525':
                return httpx.Response(200, json={**PERSON, 'combined_credits': {'crew': [{'id': 157336, 'title': 'Interstellar', 'media_type': 'movie', 'release_date': '2014-11-05', 'poster_path': '/film.jpg'}]}})
            if path == '/v4/companies':
                body = request.content.decode()
                bodies.append(body)
                return httpx.Response(200, json=[{**COMPANY, 'developed': [{'id': 1877, 'name': 'Cyberpunk 2077', 'slug': 'cyberpunk-2077', 'cover': {'image_id': 'co1'}}]}])
            return httpx.Response(404)
        with tempfile.TemporaryDirectory() as directory:
            settings = Settings(tmdb_token='test', twitch_id='test', twitch_secret='test-secret', cache_path=str(Path(directory) / 'cache.db'))
            app = create_app(settings, httpx.MockTransport(handler))
            async with app.router.lifespan_context(app), httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://test') as client:
                query = 'Nolan"; fields *; search "'
                response = await client.get('/v1/creators/search', params={'q': query})
                self.assertEqual(response.status_code, 200)
                data = response.json()
                self.assertEqual(data['status'], 'ok')
                self.assertEqual([row['id'] for row in data['items']], ['tmdb:person:525', 'igdb:company:908'])
                self.assertNotIn('claimed', data['items'][0])
                self.assertIn('where name ~ *' + json.dumps(query) + '*;', bodies[0])
                await client.get('/v1/creators/search', params={'q': query})
                self.assertEqual(calls['/3/search/person'], 1)
                self.assertEqual(calls['/v4/companies'], 1)
                self.assertEqual(calls['/v4/games'], 0)
                person = (await client.get('/v1/creators/tmdb:person:525')).json()
                self.assertEqual(person['works'][0]['id'], 'tmdb:movie:157336')
                company = (await client.get('/v1/creators/igdb:company:908')).json()
                self.assertEqual(company['works'][0]['id'], 'igdb:game:1877')
                self.assertEqual(calls['/oauth2/token'], 1)
                self.assertEqual((await client.get('/v1/creators/tmdb:person:evil')).status_code, 404)
                self.assertEqual((await client.get('/v1/creators/search?q=x')).status_code, 422)
                self.assertEqual((await client.get('/v1/creators/search?q=%20%20')).status_code, 422)
                self.assertEqual((await client.get('/v1/creators/search?q=name&page=51')).status_code, 422)

    async def test_partial_directory_retains_available_creators(self):
        async def handler(request):
            return httpx.Response(200, json={'results': [PERSON], 'total_pages': 1})
        app = create_app(Settings(tmdb_token='test', twitch_id='', twitch_secret='', cache_path=':memory:'), httpx.MockTransport(handler))
        async with app.router.lifespan_context(app), httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://test') as client:
            response = await client.get('/v1/creators/search?q=Nolan')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()['status'], 'partial')
            self.assertEqual(response.json()['errors'][0]['provider'], 'igdb')
