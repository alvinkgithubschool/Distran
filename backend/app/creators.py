"""Public metadata directory. Provider credits never grant Distran ownership."""
import asyncio
import json
import re
from .catalog import tmdb_work, igdb_work, IGDB_FIELDS
from .providers import ProviderError
from .cache import CacheBusy


def creator(row, provider):
    path = row.get('profile_path', '') if provider == 'tmdb' else row.get('logo', {}).get('image_id', '')
    image = ''
    if provider == 'tmdb' and re.fullmatch(r'/[\w.-]+', path or ''):
        image = f'https://image.tmdb.org/t/p/w185{path}'
    if provider == 'igdb' and re.fullmatch(r'[\w-]+', path or ''):
        image = f'https://images.igdb.com/igdb/image/upload/t_logo_med/{path}.png'
    return dict(id=f"{provider}:{'person' if provider == 'tmdb' else 'company'}:{row['id']}",
                name=row.get('name', 'Unknown creator'), image=image,
                kind=row.get('known_for_department') or ('Game studio / publisher' if provider == 'igdb' else 'Film / TV'),
                bio=(row.get('biography') or row.get('description') or '')[:12000], provider=provider,
                sourceUrl=f"https://www.themoviedb.org/person/{row['id']}" if provider == 'tmdb' else f"https://www.igdb.com/companies/{row.get('slug') or row['id']}")


class CreatorService:
    def __init__(self, providers):
        self.providers = providers

    async def search_provider(self, provider, query, page):
        async with asyncio.timeout(14):
            if provider == 'tmdb':
                data, cache = await self.providers.tmdb('search/person', {'query': query, 'page': page, 'include_adult': 'false'})
                rows = data.get('results', [])
                more = page < data.get('total_pages', 1)
            else:
                body = f'fields id,name,slug,description,logo.image_id; where name ~ *{json.dumps(query)}*; sort name asc; limit 21; offset {(page - 1) * 20};'
                rows, cache = await self.providers.igdb(body, endpoint='companies')
                more = len(rows) > 20
            return {'items': [creator(row, provider) for row in rows[:20]], 'hasMore': more, 'cache': cache}

    async def search(self, query, page):
        results = await asyncio.gather(*(self.search_provider(p, query, page) for p in ('tmdb', 'igdb')), return_exceptions=True)
        items, errors, providers, more = [], [], {}, False
        for provider, value in zip(('tmdb', 'igdb'), results):
            if isinstance(value, (ProviderError, TimeoutError, CacheBusy)):
                errors.append({'provider': provider, 'code': value.code if isinstance(value, ProviderError) else 'unavailable'})
            elif isinstance(value, BaseException):
                raise value
            else:
                items.extend(value['items']); more |= value['hasMore']; providers[provider] = {'cache': value['cache']}
        return dict(items=items, errors=errors, providers=providers, hasMore=more, page=page,
                    status='unavailable' if not providers else 'partial' if errors else 'ok')

    async def detail(self, creator_id):
        match = re.fullmatch(r'(tmdb:person|igdb:company):([1-9]\d{0,9})', creator_id)
        if not match:
            raise ProviderError('catalog', 'not_found', 404)
        kind, number = match.groups()
        if kind == 'tmdb:person':
            row, cache = await self.providers.tmdb(f'person/{number}', {'append_to_response': 'combined_credits'}, ttl=86400)
            credits = row.get('combined_credits', {})
            rows = [r for r in credits.get('crew', []) + credits.get('cast', []) if r.get('media_type') in ('movie', 'tv') and not r.get('adult')]
            rows.sort(key=lambda row: row.get('popularity', 0), reverse=True)
            works = list({f"{r['media_type']}:{r['id']}": tmdb_work(r, r['media_type']) for r in rows[:40]}.values())
            value = creator(row, 'tmdb')
        else:
            fields = ','.join(f'developed.{field}' for field in IGDB_FIELDS.split(','))
            rows, cache = await self.providers.igdb(f'fields id,name,slug,description,logo.image_id,{fields}; where id = {number}; limit 1;', ttl=86400, endpoint='companies')
            if not rows:
                raise ProviderError('igdb', 'not_found', 404)
            value = creator(rows[0], 'igdb')
            works = [igdb_work(row) for row in rows[0].get('developed', [])[:40]]
        return {'creator': value, 'works': works, 'cache': cache}
