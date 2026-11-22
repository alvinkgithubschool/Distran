"""Refresh reviewed canonical seed IDs and reproject local recommendation vectors.
.venv/bin/python scripts/sync_catalog.py
Requires the fitted Kaggle content transform in backend/data/buddy (or prepare it first).
"""
import asyncio,hashlib,json,sys
from datetime import datetime,timezone
from pathlib import Path
import httpx
import numpy as np
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from backend.app.cache import CatalogCache
from backend.app.catalog import CatalogService
from backend.app.config import Settings
from backend.app.providers import Providers
from backend.app.buddy import CatalogIndex


def apply_snapshot(aliases, works, connections):
    index=CatalogIndex(validate_catalog=False)  # Keep the fitted transform before changing metadata.
    if index.vocab is None:raise ValueError('Prepare the measured Buddy transform before syncing catalog')
    app=ROOT/'apps/desktop/src/lib'
    stamped=datetime.now(timezone.utc).isoformat()
    for work in works:
        work['metadataFetchedAt']=stamped
        work['related']=[aliases.get(i,i) for i in work.get('related',[])]
    docs=[' '.join([w['title'],w['description'],' '.join(w['tags']+w.get('themes',[])),w['maker']]) for w in works]
    vectors=np.asarray([index.query_vector(doc) for doc in docs])
    if vectors.ndim!=2 or not np.isfinite(vectors).all():raise ValueError('Invalid projected catalog vectors')
    snapshot=[{**{key:w[key] for key in ('id','title','year','medium','description','tags','maker')},'themes':w.get('themes',[])} for w in works]
    model=json.loads((ROOT/'backend/data/buddy/catalog-model.json').read_text())
    model.update(model_id='provider-catalog-tfidf-svd-v3',feature_schema='provider-title-description-genres-editorial-themes-maker-v3',
                 catalog_sha256=hashlib.sha256(json.dumps(snapshot,sort_keys=True).encode()).hexdigest(),
                 items=[w['id'] for w in works],media=[w['medium'] for w in works],vectors=vectors.tolist(),fallback=[w['id'] for w in works])
    model['catalog_reprojected_at']=stamped
    # Stable semantic features are projected, not a new fit or new quality claim.
    registry={'aliases':aliases,'editorial_connections':connections,'reviewed_at':stamped}
    (ROOT/'backend/models/catalog-registry.json').write_text(json.dumps(registry,indent=2))
    (ROOT/'backend/models/catalog.json').write_text(json.dumps(works,indent=2))
    (app/'catalog-data.json').write_text(json.dumps(works,indent=2))
    (app/'catalog-aliases.json').write_text(json.dumps(aliases,indent=2))
    (app/'catalog-model.json').write_text(json.dumps(model,indent=2))
    directory=ROOT/'backend/data/buddy'
    (directory/'catalog-model.json').write_text(json.dumps(model,indent=2))
    files=['catalog-model.json','content-transform.npz','content-vocabulary.json']
    (directory/'manifest.json').write_text(json.dumps({'model_id':model['model_id'],'sha256':{f:hashlib.sha256((directory/f).read_bytes()).hexdigest() for f in files}},indent=2))
    (ROOT/'docs/research/CATALOG_RECONCILIATION.json').write_text(json.dumps({'refreshed_at':stamped,'work_count':len(works),'aliases':aliases,'policy':'Reviewed provider IDs; no title-only identity merge','works':[{'id':w['id'],'title':w['title'],'sourceUrl':w['sourceUrl'],'creatorRole':w.get('creatorRole'),'creators':w.get('creators',[])} for w in works]},indent=2))


async def refresh():
    registry=json.loads((ROOT/'backend/models/catalog-registry.json').read_text())
    previous=json.loads((ROOT/'backend/models/catalog.json').read_text())
    cache=CatalogCache(str(ROOT/'backend/data/catalog.sqlite3'))
    works=[]
    async with httpx.AsyncClient(timeout=15,follow_redirects=False) as client:
        service=CatalogService(Providers(Settings(),client,cache))
        for old in previous:
            result=await service.detail(old['id']);work=result['work']
            for key in ('fallbackImage','themes','editorialRelated'):
                if key in old:work[key]=old[key]
            works.append(work)
    cache.close()
    apply_snapshot(registry['aliases'],works,registry['editorial_connections'])
    print('Synced',len(works),'canonical works and reprojected app/Buddy vectors.')

if __name__=='__main__':asyncio.run(refresh())
