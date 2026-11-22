"""Normalized catalog reads; search never fetches one detail per result."""
import asyncio
from datetime import datetime, timezone
import json
import re
from .cache import CacheBusy
from .providers import Providers, ProviderError

IGDB_FIELDS = 'id,name,slug,summary,version_parent,first_release_date,cover.image_id,total_rating,total_rating_count,genres.name,themes.name,keywords.name,involved_companies.company.id,involved_companies.company.name,involved_companies.developer,involved_companies.publisher'
IGDB_DETAILS = IGDB_FIELDS + ',storyline,involved_companies.company.id,involved_companies.company.name,involved_companies.developer,involved_companies.publisher,similar_games.id,similar_games.name,similar_games.slug,similar_games.cover.image_id,similar_games.first_release_date,similar_games.summary,similar_games.total_rating,similar_games.total_rating_count,franchises.name,collections.name,platforms.name,url'

def year(value):
    try:
        return datetime.fromtimestamp(value, timezone.utc).year if isinstance(value, (int, float)) else int((value or '')[:4])
    except (ValueError, TypeError, OverflowError, OSError):
        return 0

def person_credit(person, role):
    number = person.get('id')
    return dict(name=person.get('name', ''), role=role,
                **({'id':f'tmdb:person:{number}'} if type(number) is int and number>0 else {}))


def tmdb_work(row, medium, base='https://image.tmdb.org/t/p/', size='w500'):
    credits = row.get('aggregate_credits') or row.get('credits') or {}
    crew = credits.get('crew', [])
    def directed_count(person):
        return sum(job.get('episode_count',0) for job in person.get('jobs',[]) if job.get('job') in ('Director','Series Director','Co-Director')) or (1 if person.get('job') in ('Director','Series Director','Co-Director') else 0)
    series_directors=[c for c in crew if any(j.get('job')=='Series Director' for j in c.get('jobs',[]))]
    directors = sorted(series_directors or [c for c in crew if directed_count(c)], key=lambda c:(-directed_count(c),c.get('name','')))
    primary = directors or (row.get('created_by',[]) if medium=='tv' else [])
    primary_role = 'Director' if directors else 'Series creator' if primary else None
    companies = row.get('production_companies',[])
    runtime, poster = row.get('runtime'), row.get('poster_path') or ''
    all_credits=[]
    for person in crew:
        jobs = [job.get('job','Crew') for job in person.get('jobs',[])] or [person.get('job','Crew')]
        all_credits.extend(person_credit(person,job) for job in dict.fromkeys(jobs))
    for person in credits.get('cast',[])[:40]:
        role = person.get('character') or ', '.join(r.get('character','') for r in person.get('roles',[])[:3]) or 'Cast'
        all_credits.append(person_credit(person,role))
    for person in row.get('created_by',[]):
        all_credits.append(person_credit(person,'Series creator'))
    all_credits=list({(c.get('id',c['name']),c['role']):c for c in all_credits}.values())
    return dict(id=f"tmdb:{medium}:{row['id']}", title=row.get('title') or row.get('name') or 'Untitled', medium=medium,
        year=year(row.get('release_date') or row.get('first_air_date')),
        image=f'{base}{size}{poster}' if re.fullmatch(r'/[\w.-]+',poster) else '',
        color='#dcaa72' if medium=='movie' else '#8cb9bd',
        maker=', '.join(c.get('name','') for c in primary[:3]) or 'See title details', creatorRole=primary_role,
        publisher=', '.join(c.get('name','') for c in companies[:3]) or 'Not listed',
        description=(row.get('overview') or '')[:12000], tags=[g['name'] for g in row.get('genres',[])],
        themes=[k['name'] for k in (row.get('keywords',{}).get('keywords') or row.get('keywords',{}).get('results') or [])],
        rating=f"{row['vote_average']/2:.1f}" if row.get('vote_count',0) and row.get('vote_average') else '—',
        rating_count=row.get('vote_count',0),
        duration=f'{runtime//60}h {runtime%60:02d}m' if runtime else (f"{row['number_of_episodes']} episodes" if row.get('number_of_episodes') else 'See title details'),
        **({'verified_duration_minutes':runtime} if medium=='movie' and type(runtime) is int and runtime>0 else {}),
        related=[], provider='tmdb', sourceUrl=f"https://www.themoviedb.org/{medium}/{row['id']}",
        credits=all_credits[:200],
        creators=[{**person_credit(c,primary_role), 'episodeCount':directed_count(c)} for c in primary if type(c.get('id')) is int and c['id']>0],
        franchises=[], relatedLabel='TMDB recommendations')

def igdb_work(row):
    companies = row.get('involved_companies',[])
    developers = [c.get('company',{}).get('name','') for c in companies if c.get('developer')]
    publishers = [c.get('company',{}).get('name','') for c in companies if c.get('publisher')]
    image_id = row.get('cover',{}).get('image_id','')
    return dict(id=f"igdb:game:{row['id']}", title=row.get('name') or 'Untitled', medium='game',year=year(row.get('first_release_date')),
        image=f'https://images.igdb.com/igdb/image/upload/t_cover_big/{image_id}.jpg' if re.fullmatch(r'[\w-]+',image_id) else '',
        color='#b7c96c',creatorRole='Studio',maker=', '.join(developers[:3]) or 'See title details',publisher=', '.join(publishers[:3]) or 'Not listed',
        description=(row.get('summary') or row.get('storyline') or '')[:12000],tags=[g['name'] for g in row.get('genres',[])],
        themes=list(dict.fromkeys(k['name'] for k in row.get('themes',[])+row.get('keywords',[]))),
        rating=f"{row['total_rating']/20:.1f}" if row.get('total_rating_count',0) and row.get('total_rating') else '—',
        rating_count=row.get('total_rating_count',0),
        **({'parent_work_id':f"igdb:game:{row['version_parent']}"} if type(row.get('version_parent')) is int else {}),
        duration='Playtime not verified',platforms=[p['name'] for p in row.get('platforms',[])],related=[],provider='igdb',
        sourceUrl=f"https://www.igdb.com/games/{row.get('slug') or row['id']}",
        credits=[{'name':c.get('company',{}).get('name',''),'role':'Developer' if c.get('developer') else 'Publisher' if c.get('publisher') else 'Company', **({'id':f"igdb:company:{c['company']['id']}"} if type(c.get('company',{}).get('id')) is int else {})} for c in companies],
        creators=[{'id':f"igdb:company:{c['company']['id']}",'name':c['company'].get('name',''),'role':'Studio'} for c in companies if c.get('developer') and isinstance(c.get('company',{}).get('id'),int)],
        franchises=list(dict.fromkeys(c['name'] for c in row.get('franchises',[])+row.get('collections',[]))), relatedLabel='IGDB similar games')

class CatalogService:
    def __init__(self, providers: Providers):
        self.providers=providers

    async def images(self):
        data,status=await self.providers.tmdb('configuration',ttl=604800)
        images=data.get('images',{})
        base=images.get('secure_base_url','https://image.tmdb.org/t/p/')
        if base!='https://image.tmdb.org/t/p/':base='https://image.tmdb.org/t/p/'
        sizes=images.get('poster_sizes',[])
        size='w500' if not sizes or 'w500' in sizes else next((s for s in sizes if re.fullmatch(r'w\d+',s)),'w500')
        return base,size,status

    async def search_tmdb(self,query,medium,page):
        params={'language':'en-US','page':page,'include_adult':'false'}
        if query:
            path=f'search/{medium if medium!="all" else "multi"}';params['query']=query
        else:path=f'{medium}/popular' if medium!='all' else 'trending/all/week'
        (data,status),(base,size,config_status)=await asyncio.gather(self.providers.tmdb(path,params),self.images())
        works=[tmdb_work(row,row.get('media_type',medium),base,size) for row in data.get('results',[]) if row.get('media_type',medium) in ('movie','tv') and not row.get('adult',False)]
        return dict(items=works,hasMore=page<min(50,data.get('total_pages',1)),cache='stale' if 'stale' in (status,config_status) else status)

    async def search_igdb(self,query,page):
        search=f'search {json.dumps(query,ensure_ascii=False)};' if query else 'where cover != null & total_rating_count >= 25; sort total_rating_count desc;'
        rows,status=await self.providers.igdb(f'fields {IGDB_FIELDS}; {search} limit 21; offset {(page-1)*20};')
        return dict(items=[igdb_work(row) for row in rows[:20]],hasMore=len(rows)>20,cache=status)

    async def search(self,query,medium,page):
        providers=['igdb'] if medium=='game' else ['tmdb'] if medium in ('movie','tv') else ['tmdb','igdb']
        async def one(provider):
            try:
                async with asyncio.timeout(14):
                    value=await (self.search_igdb(query,page) if provider=='igdb' else self.search_tmdb(query,medium,page))
                return provider,value,None
            except (ProviderError,TimeoutError,CacheBusy) as error:
                return provider,None,{'provider':provider,'code':error.code if isinstance(error,ProviderError) else 'timeout'}
        responses=await asyncio.gather(*(one(p) for p in providers))
        successful=[(p,v) for p,v,_ in responses if v is not None];errors=[e for _,_,e in responses if e]
        if not successful:return dict(items=[],page=page,hasMore=False,status='unavailable',providers={},errors=errors)
        buckets=[v['items'] for _,v in successful]
        items=[b[i] for i in range(max(map(len,buckets),default=0)) for b in buckets if i<len(b)]
        return dict(items=items,page=page,hasMore=any(v['hasMore'] for _,v in successful),status='partial' if errors else 'ok',providers={p:{'cache':v['cache']} for p,v in successful},errors=errors)

    async def detail(self,work_id):
        if not re.fullmatch(r'(tmdb:(movie|tv)|igdb:game):[1-9]\d{0,9}',work_id):raise ProviderError('catalog','invalid_id',422)
        provider,medium,numeric_id=work_id.split(':')
        if provider=='igdb':
            rows,cache=await self.providers.igdb(f'fields {IGDB_DETAILS}; where id = {numeric_id}; limit 1;',ttl=86400)
            if not rows:raise ProviderError('igdb','not_found',404)
            work=igdb_work(rows[0]);related=[igdb_work(r) for r in rows[0].get('similar_games',[])[:8]]
        else:
            (row,cache),(base,size,config_cache)=await asyncio.gather(self.providers.tmdb(f'{medium}/{numeric_id}',{'language':'en-US','append_to_response':'credits,recommendations,external_ids,keywords'+(',aggregate_credits' if medium=='tv' else '')},ttl=86400),self.images())
            if config_cache=='stale':cache='stale'
            work=tmdb_work(row,medium,base,size)
            related=[tmdb_work(r,medium,base,size) for r in row.get('recommendations',{}).get('results',[])[:8] if not r.get('adult',False)]
            collection=row.get('belongs_to_collection')
            if collection:
                work['franchises']=[collection['name']]
                try:
                    group,group_cache=await self.providers.tmdb(f"collection/{int(collection['id'])}",{'language':'en-US'},ttl=86400)
                    parts=[tmdb_work(r,'movie',base,size) for r in sorted(group.get('parts',[]),key=lambda r:r.get('release_date') or '9999') if r['id']!=int(numeric_id) and not r.get('adult',False)]
                    related=list({r['id']:r for r in parts+related}.values())[:12]
                    work['relatedLabel']='Same film collection and TMDB recommendations'
                    if group_cache=='stale':cache='stale'
                except (ProviderError,CacheBusy,KeyError):
                    pass  # Collection enrichment must not hide a usable title.
        work['related']=[w['id'] for w in related]
        return dict(work=work,related=related,cache=cache)
