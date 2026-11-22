"""Catalog-backed thematic retrieval; model outputs never create works or writes."""
from collections import Counter
import hashlib
import json
import math
from pathlib import Path
import re
from typing import Literal
import numpy as np
from pydantic import BaseModel, ConfigDict, Field
from .config import BACKEND_ROOT
from .model_router import ModelRouter, ModelUnavailable, CHAT_MODEL, RANK_MODEL


class BuddyContext(BaseModel):
    model_config = ConfigDict(extra='forbid')
    theme: str = Field(default='',max_length=2500)
    medium: Literal['all','game','movie','tv'] = 'all'
    max_minutes: int | None = Field(default=None,ge=1,le=100000)
    work_ids: list[str] = Field(default_factory=list,max_length=12)


class BuddyTurn(BaseModel):
    model_config = ConfigDict(extra='forbid')
    role: Literal['user','assistant']
    content: str = Field(min_length=1,max_length=2000)


class BuddyRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    mode: Literal['recommendations', 'chat'] = 'recommendations'
    context: BuddyContext | None = None
    history: list[BuddyTurn] = Field(default_factory=list,max_length=6)
    prompt: str = Field(min_length=1, max_length=2000)
    refinement: str = Field(default='', max_length=500)
    medium: Literal['all', 'game', 'movie', 'tv'] = 'all'
    exclude_ids: list[str] = Field(default_factory=list, max_length=500)
    max_minutes: int | None = Field(default=None, ge=1, le=100000)
    limit: int = Field(default=6, ge=1, le=12)


def explicit_medium(text, fallback):
    patterns=[('game',r'\bgames?\b'),('movie',r'\b(?:films?|movies?)\b'),('tv',r'\b(?:tv|series|shows?)\b')]
    if re.search(r'\b(?:all formats|every format|any format|across formats)\b',text,re.I):return 'all'
    explicit=[m for m,p in patterns if re.search(p+r'\s+only|\bonly\s+'+p,text,re.I)]
    if len(explicit)==1:return explicit[0]
    found=[m for m,p in patterns if re.search(p,text,re.I)]
    return found[0] if len(found)==1 else 'all' if len(found)>1 else fallback


def duration_limit(text, fallback):
    if re.search(r'\b(?:no time limit|any length|remove the (?:duration|time) limit)\b',text,re.I):return None
    found=re.search(r'\b(?:under|less than|at most|up to|within)\s+(\d+(?:\.\d+)?)\s*(hours?|hrs?|minutes?|mins?)\b',text,re.I)
    if found:
        minutes=float(found[1])*(60 if found[2].lower().startswith(('h','hr')) else 1)
        if 1<=minutes<=100000:return int(minutes)
    return fallback


def conversation_theme(request):
    previous=request.context.theme if request.context else ''
    reset=bool(re.search(r'^(?:new topic|start over|forget that|instead|actually|switch to)\b',request.prompt,re.I))
    small_talk=bool(re.fullmatch(r"(?:hi|hello|hey|thanks|thank you|hey buddy|hi buddy|hello buddy)[.! ]*",request.prompt.strip(),re.I))
    if small_talk:return previous,True
    if previous and not reset and request.prompt.strip()!=previous:
        theme=previous[:1800]+'; '+request.prompt.strip()
    else:theme=request.prompt.strip()
    if request.refinement.strip():theme+='; '+request.refinement.strip()
    return theme[-2500:],False


class CatalogIndex:
    def __init__(self, directory=None, *, validate_catalog=True):
        registry=BACKEND_ROOT/'models/catalog-registry.json'
        self.aliases=json.loads(registry.read_text())['aliases'] if registry.exists() else {}
        self.works = json.loads((BACKEND_ROOT/'models/catalog.json').read_text())
        self.model_id = 'keyword-fallback'
        self.vocab = self.components = self.idf = None
        self.stopwords = set(json.loads((BACKEND_ROOT/'models/stopwords.json').read_text()))
        self.vectors = {}
        directory = Path(directory) if directory else BACKEND_ROOT/'data/buddy'
        try:
            manifest = json.loads((directory/'manifest.json').read_text())
            for name in ['catalog-model.json','content-transform.npz','content-vocabulary.json']:
                if hashlib.sha256((directory/name).read_bytes()).hexdigest() != manifest['sha256'][name]:
                    raise ValueError()
            model = json.loads((directory/'catalog-model.json').read_text())
            vocab = json.loads((directory/'content-vocabulary.json').read_text())
            with np.load(directory/'content-transform.npz', allow_pickle=False) as data:
                idf = data['idf'].copy(); components = data['components'].copy()
            vectors = np.asarray(model['vectors'],dtype=float)
            if model['schema'] != 1 or components.shape != (vectors.shape[1],len(idf)) or len(vocab) != len(idf) or len(model['items']) != len(vectors):
                raise ValueError()
            if not all(np.isfinite(a).all() for a in [vectors,idf,components]):
                raise ValueError()
            if set(vocab.values()) != set(range(len(idf))):raise ValueError()
            snapshot = [{key: work[key] for key in ('id','title','year','medium','description','tags','maker')} for work in self.works]
            if model.get('feature_schema','').endswith('v3'):
                for row,work in zip(snapshot,self.works):row['themes']=work.get('themes',[])
            if validate_catalog and model['catalog_sha256'] != hashlib.sha256(json.dumps(snapshot,sort_keys=True).encode()).hexdigest():raise ValueError()
            if len(set(model['items'])) != len(model['items']) or (validate_catalog and set(model['items']) != {w['id'] for w in self.works}):raise ValueError()
            if not np.allclose(np.linalg.norm(vectors,axis=1),1):raise ValueError()
            self.vocab,self.idf,self.components = vocab,idf,components
            self.vectors = dict(zip(model['items'],vectors))
            self.model_id = model['model_id']
        except (OSError, ValueError, KeyError, TypeError, IndexError):
            pass

    def query_vector(self, text):
        if self.vocab is None:return None
        tokens = [t for t in re.findall(r'(?u)\b\w\w+\b',text.lower()) if t not in self.stopwords]
        counts = Counter(tokens + [' '.join(pair) for pair in zip(tokens,tokens[1:])])
        vector = np.zeros(len(self.idf))
        for token,count in counts.items():
            if token in self.vocab:
                i = self.vocab[token];vector[i] = (1 + math.log(count)) * self.idf[i]
        norm = np.linalg.norm(vector)
        if not norm:return None
        result = self.components @ (vector/norm)
        norm = np.linalg.norm(result)
        return result/norm if norm else None

    def retrieve(self, text, medium, excluded, max_minutes, works=None, limit=30):
        query = self.query_vector(text)
        terms = set(re.findall(r'\w+',text.lower())) - self.stopwords
        rows = []
        for work in self.works if works is None else works:
            if work['id'] in excluded or work.get('parent_work_id') in excluded or (medium != 'all' and work['medium'] != medium):continue
            if 'Erotic' in work.get('themes',[]):continue
            if max_minutes is not None:
                duration = work.get('verified_duration_minutes')
                if not isinstance(duration,(int,float)) or duration <= 0 or duration > max_minutes:continue
            content = ' '.join([work['title'],work['description'],' '.join(work['tags']+work.get('themes',[])),work.get('maker',''), ' '.join(c.get('name','') for c in work.get('creators',[]))])
            matched = sorted(terms & set(re.findall(r'\w+',content.lower())))
            vector = self.vectors.get(work['id'])
            if vector is None:vector=self.query_vector(content)
            score = float(query@vector) if query is not None and vector is not None else len(matched)/max(1,len(terms))
            # Always supply factual source evidence; thematic confidence is a separate score.
            reason = 'Catalog tags: ' + ', '.join(work['tags'][:3])
            rows.append(dict(work=work, score=score, reason=reason, evidence=work['description'],vector=vector))
        rows.sort(key=lambda r:(-(.8*r['score']+.2*min(1,math.log1p(max(0,r['work'].get('rating_count',0)))/8)),r['work']['id']))
        if medium=='all' and limit==30:
            # Give each requested format representation before the expensive thematic judge.
            buckets=[[r for r in rows if r['work']['medium']==m] for m in ('movie','tv','game')]
            balanced=[row for i in range(10) for bucket in buckets if i<len(bucket) for row in [bucket[i]]]
            picked={r['work']['id'] for r in balanced}
            return (balanced+[r for r in rows if r['work']['id'] not in picked])[:limit]
        return rows[:limit]


class BuddyService:
    def __init__(self, router: ModelRouter, index=None, canonical=None, discovery=None):
        self.router=router
        self.index=index or CatalogIndex()
        self.canonical=canonical
        self.discovery=discovery

    async def query(self, request: BuddyRequest):
        if not request.prompt.strip():raise ValueError('Enter a request.')
        theme,small_talk=conversation_theme(request)
        discussing=bool(request.context and re.search(r'\b(?:why|tell me|explain|how long|who|about (?:that|this|the|those))\b',request.prompt,re.I))
        inherited=request.context.medium if request.context else 'all'
        base=request.medium if 'medium' in request.model_fields_set else inherited
        medium=explicit_medium(request.refinement,explicit_medium(request.prompt,base))
        prior_duration=request.context.max_minutes if request.context else None
        minutes=request.max_minutes if 'max_minutes' in request.model_fields_set else prior_duration
        minutes=duration_limit(request.refinement,duration_limit(request.prompt,minutes))
        known=self.canonical.known() if self.canonical is not None else self.index.works
        excluded={self.index.aliases.get(i,i) for i in request.exclude_ids}
        if request.context and re.search(r'\b(?:(?:something|anything) else|different (?:picks|options|suggestions)|more options|another (?:pick|option))\b',request.prompt,re.I):
            excluded.update(request.context.work_ids)
        pinned=bool(discussing and request.context.work_ids and medium==request.context.medium and minutes==request.context.max_minutes)
        discovery=None
        if self.discovery is not None and not small_talk and not pinned:
            discovery=await self.discovery.discover(theme,medium,self.router,known)
        pool={work['id']:work for work in known}
        if discovery:
            pool.update({w['id']:w for w in discovery['works']})
            # A work named as inspiration is not itself a next recommendation.
            excluded.update(discovery['seed_ids'])
        retrieval_text=theme
        if discovery and discovery['seed_evidence']:retrieval_text+='\nInspiration metadata:\n'+discovery['seed_evidence']
        # Hydrate a bounded preliminary shortlist before applying verified-duration constraints.
        if self.discovery is not None and minutes is not None and not small_talk and not pinned:
            preliminary=self.index.retrieve(retrieval_text,medium,excluded,None,list(pool.values()))
            hydrated=await self.discovery.hydrate([r['work'] for r in preliminary[:30]],minutes)
            pool.update({w['id']:w for w in hydrated})
        retrieval_pool=[w for w in pool.values() if not pinned or w['id'] in request.context.work_ids]
        candidates=[] if small_talk else self.index.retrieve(retrieval_text,medium,excluded,minutes,retrieval_pool)
        if pinned:
            order={i:n for n,i in enumerate(request.context.work_ids)}
            candidates=sorted([c for c in candidates if c['work']['id'] in order],key=lambda c:order[c['work']['id']])
            theme=request.context.theme
        ranking_model=None;conversation_model=None;failures=[]
        if candidates and not pinned:
            try:
                scores=await self.router.rank(retrieval_text,[dict(id=c['work']['id'],title=c['work']['title'],description=c['work']['description'],tags=c['work']['tags']+c['work'].get('themes',[]),creator=c['work'].get('maker','')) for c in candidates])
                # Do not fill a themed list with candidates the classifier calls unrelated.
                candidates=[c for c in candidates if scores[c['work']['id']]>=.5]
                for c in candidates:
                    quality=min(1,math.log1p(max(0,c['work'].get('rating_count',0)))/8)
                    c['score']=.75*scores[c['work']['id']]+.15*max(0,c['score'])+.1*quality
                ranking_model=RANK_MODEL
            except ModelUnavailable as error:
                failures.append(str(error))
                # An outage does not justify an arbitrary list of zero-match works.
                candidates=[c for c in candidates if c['score']>0]
        selected=candidates[:request.limit] if pinned else []
        if pinned:candidates=[]
        while candidates and len(selected)<request.limit:
            def utility(row):
                similarity=max([0.]+[float(row['vector']@s['vector']) for s in selected if row['vector'] is not None and s['vector'] is not None])
                return .85*row['score']-.15*similarity
            candidates.sort(key=lambda c:(-utility(c),c['work']['id']))
            selected.append(candidates.pop(0))
        items=[{k:v for k,v in row.items() if k!='vector'} for row in selected]
        if self.discovery is not None and items and not pinned:
            hydrated=await self.discovery.hydrate([r['work'] for r in items],minutes)
            for item,work in zip(items,hydrated):
                item['work']=work;item['evidence']=work['description']
        reply=(f"I found {len(items)} catalog {'pick' if len(items)==1 else 'picks'} for your request. Open a card to explore it, or save these as a private list."
               if items else 'No verified matches from this catalog search meet your filters. Try another theme, include previously logged titles, or loosen the format or duration filter.')
        if small_talk:reply='Hi, I’m Buddy. Tell me a theme, a mood, or a work you love and I’ll find real catalog picks you can save.'
        references=[];evidence=[]
        if request.mode=='chat':
            sources=[dict(id=row['work']['id'],title=row['work']['title'],medium=row['work']['medium'],description=row['work']['description'],tags=row['work']['tags']+row['work'].get('themes',[]),maker=row['work'].get('maker','Not listed'),verified_duration_minutes=row['work'].get('verified_duration_minutes')) for row in items]
            # Previous pick metadata can ground a follow-up even if the new shortlist is empty.
            if not sources and request.context and discussing:
                sources=[dict(id=w['id'],title=w['title'],medium=w['medium'],description=w['description'],tags=w['tags'],maker=w.get('maker','Not listed')) for w in pool.values() if w['id'] in request.context.work_ids][:12]
            if sources:
                try:
                    answer=await self.router.converse(
                        'Original theme: '+theme+'\nLatest request: '+request.prompt+'\nEffective format: '+medium+
                        '\nCurrent picks: '+str(len(items))+'\n'+('This is a greeting.' if small_talk else 'Use these real catalog records to help; if current picks are empty, do not recommend a previous filtered-out work.'),
                        candidates=sources,history=[turn.model_dump() for turn in request.history])
                    reply=answer['reply'];references=answer['referenced_ids'];evidence=answer['evidence'];conversation_model=CHAT_MODEL
                    quotations={entry['id']:entry['quote'] for entry in evidence}
                    for item in items:
                        if item['work']['id'] in quotations:item['reason']='From the catalog: '+quotations[item['work']['id']][:300]
                except ModelUnavailable as error:failures.append(str(error))
        context=BuddyContext(theme=theme,medium=medium,max_minutes=minutes,work_ids=[row['work']['id'] for row in selected] or (request.context.work_ids if request.context and request.mode=='chat' and discussing else []))
        return dict(reply=reply,items=items,route='conversation' if request.mode=='chat' else 'thematic_ranking',
                    model=conversation_model or ranking_model,models={'ranking':ranking_model,'conversation':conversation_model},
                    retrieval_model=self.index.model_id,degraded=bool(failures) or self.index.model_id=='keyword-fallback',
                    fallback=failures[0] if failures else None,free_only=True,medium=medium,context=context.model_dump(),
                    referenced_ids=references,evidence=evidence,catalog_size=len(pool),
                    discovery={'scope':'conversation' if pinned or small_talk else 'live_catalog' if discovery and discovery['providers'] else 'cached_catalog',
                               'providers':discovery['providers'] if discovery else [],
                               'candidate_count':len(pool),'search_terms':discovery['search_terms'] if discovery else [],
                               'errors':discovery['errors'] if discovery else []})
