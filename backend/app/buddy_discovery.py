"""Bounded live discovery over the provider catalogs, independent of homepage fixtures."""
import asyncio
from difflib import SequenceMatcher
import json
import re
import unicodedata
from .catalog import IGDB_FIELDS, igdb_work, tmdb_work
from .cache import CacheBusy
from .creators import CreatorService
from .model_router import ModelUnavailable
from .providers import ProviderError


def normalized(text):
    return ' '.join(re.findall(r'\w+', unicodedata.normalize('NFKD',text).lower()))


def fallback_plan(text, known):
    plain=normalized(text)
    inspired=bool(re.search(r'\b(?:after|aftwe|like|similar to|inspired by)\b',text,re.I))
    seeds=sorted([w['title'] for w in known if inspired and len(normalized(w['title']))>4 and normalized(w['title']) in plain],key=lambda t:-len(normalized(t)))
    seeds=[s for s in seeds if not any(normalized(s)!=normalized(other) and normalized(s) in normalized(other) for other in seeds)]
    cleaned=re.sub(r'\b(?:recommendations?|reccomendations?|recommend|reccomend|after|aftwe|watching|playing|stories|across|formats|something|similar|like|please|some|more|only|games?|movies?|films?|shows?|series|give|me|want|looking|for)\b',' ',plain)
    terms=[' '.join(cleaned.split())[:80]] if cleaned.strip() else []
    if not seeds and re.search(r'\b(?:after|aftwe|like|similar to)\b',text,re.I) and terms:seeds=terms[:1]
    return dict(search_terms=terms[:3],seed_titles=seeds[:2],creator_names=[])


class BuddyDiscovery:
    def __init__(self, catalog, canonical):
        self.catalog=catalog
        self.providers=catalog.providers
        self.creators=CreatorService(self.providers)
        self.canonical=canonical

    async def discover(self, text, medium, router, known):
        plan=fallback_plan(text,known)
        try:
            extracted=await router.plan_search(text)
            plan={key:list(dict.fromkeys(extracted[key]+plan[key]))[:limit]
                  for key,limit in [('search_terms',3),('seed_titles',2),('creator_names',2)]}
        except ModelUnavailable:
            pass  # Public-provider search does not depend on a free model being available.
        # Drop format boilerplate and duplicate spelling/punctuation variants before provider calls.
        plan['search_terms']=[t for t in plan['search_terms'] if normalized(t) not in ('across formats','all formats','games only','movies only','stories')]
        plan['seed_titles']=list({normalized(t):t for t in plan['seed_titles']}.values())
        works={};seeds={};errors=[];successful=set()

        def add(rows):
            for work in rows:
                if work.get('description','').strip():
                    previous=works.get(work['id'],{})
                    works[work['id']]={**previous,**work}

        async def guarded(provider, operation):
            try:
                value=await operation
                successful.add(provider)
                return value
            except (ProviderError,CacheBusy,TimeoutError) as error:
                errors.append({'provider':provider,'code':error.code if isinstance(error,ProviderError) else 'unavailable'})
                return None

        async def resolve_seed(title):
            local=sorted(known,key=lambda w:SequenceMatcher(None,normalized(title),normalized(w['title'])).ratio(),reverse=True)
            best=local[0] if local and SequenceMatcher(None,normalized(title),normalized(local[0]['title'])).ratio()>=.88 else None
            if best is None:
                result=await self.catalog.search(title,'all',1)
                options=result['items']
                options.sort(key=lambda w:SequenceMatcher(None,normalized(title),normalized(w['title'])).ratio(),reverse=True)
                best=options[0] if options and SequenceMatcher(None,normalized(title),normalized(options[0]['title'])).ratio()>=.6 else None
            if best:
                detail=await guarded(best['provider'],self.catalog.detail(best['id']))
                if detail:
                    best=detail['work'];add(detail['related'])
                seeds[best['id']]=best;add([best])

        async def keyword_discovery(term):
            data,_=await self.providers.tmdb('search/keyword',{'query':term[:100],'page':1})
            rows=data.get('results',[])
            exact=[row for row in rows if normalized(row['name'])==normalized(term)]
            ids=[str(row['id']) for row in (exact or rows[:2])]
            if not ids:return
            await asyncio.gather(*(tmdb_discover(m,{'with_keywords':'|'.join(ids)},[exact[0]['name']] if len(ids)==1 and exact else []) for m in media))

        async def tmdb_discover(kind, filters, themes=None):
            data,_=await self.providers.tmdb('discover/'+kind,{'include_adult':'false','language':'en-US','sort_by':'popularity.desc','page':1,**filters})
            add([{**tmdb_work(row,kind),'themes':themes or []} for row in data.get('results',[]) if not row.get('adult')])

        async def genre_discovery(kind):
            data,_=await self.providers.tmdb('genre/'+kind+'/list',{'language':'en-US'},ttl=86400)
            terms=normalized(' '.join(plan['search_terms']+[tag for seed in seeds.values() for tag in seed.get('tags',[])]))
            ids=[str(g['id']) for g in data.get('genres',[]) if normalized(g['name']) in terms]
            if ids:await tmdb_discover(kind,{'with_genres':'|'.join(ids[:3])})

        async def games_discovery(terms):
            # Resolve taxonomy IDs first. Nested string ORs across expanded game fields
            # time out on IGDB and can silently leave us with title-search-only matches.
            clauses=[]
            async def taxonomy(endpoint, term=None):
                body='fields id,name; '+(f'where name ~ *{json.dumps(term[:80])}*; limit 8;' if term else 'limit 100;')
                return await self.providers.igdb(body,ttl=86400,endpoint=endpoint)
            requests=[taxonomy('themes'),taxonomy('genres')]+[taxonomy('keywords',term) for term in terms[:2]]
            results=await asyncio.gather(*requests,return_exceptions=True)
            adult_ids=[]
            for i,result in enumerate(results):
                if isinstance(result,(ProviderError,CacheBusy,TimeoutError)):continue
                if isinstance(result,BaseException):raise result
                rows,_=result
                if i==0:adult_ids=[str(row['id']) for row in rows if row.get('name','').lower()=='erotic']
                if i>=2:
                    exact=[row for row in rows if normalized(row['name'])==normalized(terms[i-2])]
                    matches=exact or rows[:3]
                else:matches=[row for row in rows if any(normalized(row['name']) in normalized(term) for term in terms)]
                ids=[str(row['id']) for row in matches]
                if ids:clauses.append(('themes' if i==0 else 'genres' if i==1 else 'keywords')+' = ('+','.join(ids)+')')
            company_ids=[c['id'].split(':')[-1] for seed in seeds.values() for c in seed.get('creators',[]) if re.fullmatch(r'igdb:company:[1-9]\d*',c.get('id',''))]
            if company_ids:clauses.append('involved_companies.company = ('+','.join(dict.fromkeys(company_ids))+')')
            if not clauses and terms:clauses=[f'summary ~ *{json.dumps(terms[0][:80])}*']
            if not clauses:return
            adult_filter=' & themes != ('+','.join(adult_ids)+')' if adult_ids else ''
            body=f'fields {IGDB_FIELDS}; where cover != null & version_parent = null{adult_filter} & ({" | ".join(clauses)}); sort total_rating_count desc; limit 60;'
            rows,_=await self.providers.igdb(body)
            add([igdb_work(row) for row in rows])

        async def creator_discovery(name=None, creator_id=None):
            ids=[creator_id] if creator_id else []
            if name:
                result=await self.creators.search(name,1)
                ids=[c['id'] for c in result['items'] if SequenceMatcher(None,normalized(c['name']),normalized(name)).ratio()>=.65][:2]
            for cid in ids:
                detail=await self.creators.detail(cid)
                # Only directors/studio development credits guide recommendations.
                if cid.startswith('tmdb:'):
                    number=cid.split(':')[-1]
                    row,_=await self.providers.tmdb('person/'+number,{'append_to_response':'combined_credits'},ttl=86400)
                    add([tmdb_work({**r,'credits':{'crew':[{'id':int(number),'name':row.get('name',''),'job':'Director'}]}},r['media_type']) for r in row.get('combined_credits',{}).get('crew',[]) if r.get('job') in ('Director','Series Director','Co-Director') and r.get('media_type') in media and not r.get('adult')])
                elif medium in ('all','game'):add(detail['works'])

        media=['movie','tv'] if medium=='all' else [medium] if medium!='game' else []
        async def search_titles(term):
            result=await self.catalog.search(term,medium,1)
            add(result['items'])
            successful.update(result['providers'])
            errors.extend(result['errors'])

        # Retain completed branches when a provider is slow; never erase all results on timeout.
        tasks=[]
        try:
            async with asyncio.timeout(20):
                await asyncio.gather(*(resolve_seed(title) for title in plan['seed_titles']))
                terms=list(dict.fromkeys(plan['search_terms']+[t for seed in seeds.values() for t in seed.get('themes',[])[:3]]))[:5]
                tasks=[asyncio.create_task(guarded('catalog',search_titles(term))) for term in plan['search_terms'][:2]]
                if self.providers.configured('tmdb'):
                    tasks.extend(asyncio.create_task(guarded('tmdb',keyword_discovery(term))) for term in terms[:3] if media)
                    tasks.extend(asyncio.create_task(guarded('tmdb',genre_discovery(kind))) for kind in media)
                if medium in ('all','game') and self.providers.configured('igdb'):
                    tasks.append(asyncio.create_task(guarded('igdb',games_discovery(terms))))
                creators=list(dict.fromkeys(c['id'] for s in seeds.values() for c in s.get('creators',[]) if c.get('id')))[:2]
                tasks.extend(asyncio.create_task(guarded(cid.split(':')[0],creator_discovery(creator_id=cid))) for cid in creators)
                tasks.extend(asyncio.create_task(guarded('catalog',creator_discovery(name=name))) for name in plan['creator_names'])
                await asyncio.gather(*tasks)
        except TimeoutError:
            errors.append({'provider':'catalog','code':'discovery_timeout'})
        finally:
            for task in tasks:
                if not task.done():task.cancel()
            if tasks:await asyncio.gather(*tasks,return_exceptions=True)
        # Cache real IDs/metadata so the next conversational turn can discuss the same cards.
        for key,work in works.items():works[key]=self.canonical.remember(work)
        evidence='\n'.join(seed['title']+': '+seed['description'][:900]+'; tags/themes: '+', '.join(seed['tags']+seed.get('themes',[]))+'; creators: '+seed.get('maker','') for seed in seeds.values())
        return dict(works=list(works.values()),seed_ids=list(seeds),seed_evidence=evidence,
                    search_terms=plan['search_terms'],providers=sorted(p for p in successful if p in ('tmdb','igdb')),
                    errors=list({(e['provider'],e['code']):e for e in errors}.values()))

    async def hydrate(self, rows, max_minutes):
        """Bound detail requests; unknown runtimes stay excluded even if hydration fails."""
        async def one(work):
            if max_minutes is not None and work['medium']!='movie':return work
            try:
                async with asyncio.timeout(8):result=await self.catalog.detail(work['id'])
                resolved=result['work']
                if not resolved.get('description'):resolved={**resolved,'description':work['description']}
                resolved['themes']=list(dict.fromkeys(work.get('themes',[])+resolved.get('themes',[])))
                return self.canonical.update(resolved)
            except (ProviderError,CacheBusy,TimeoutError):return work
        return await asyncio.gather(*(one(row) for row in rows))
