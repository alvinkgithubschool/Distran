"""Complete-file Amazon 5-core experiment; run on CPU in Colab.
Raw source IDs are used only in memory; exported factors contain salted hashes.
"""
import csv, gzip, hashlib, json, os, platform, subprocess, sys, time, urllib.request
from collections import Counter, defaultdict
from pathlib import Path
import numpy as np
from distran_ml.baseline import temporal_split, fit

BASE='https://mcauleylab.ucsd.edu/public_datasets/data/amazon_2023/benchmark/5core/rating_only/'
SEED=42

def prepare(root):
    salt=os.urandom(32)
    events=[]; sources=[]; user_sets=[]
    for domain,category in [('game','Video_Games'),('screen','Movies_and_TV')]:
        path=root/(category+'.csv.gz'); url=BASE+path.name
        print('Downloading complete file:',category,flush=True)
        if not path.exists():
            with urllib.request.urlopen(url,timeout=180) as response, path.open('wb') as out:
                while chunk:=response.read(1024*1024):out.write(chunk)
        digest=hashlib.sha256(path.read_bytes()).hexdigest()
        users=set(); count=0; kept=0
        with gzip.open(path,'rt') as stream:
            for row in csv.DictReader(stream):
                count+=1; raw=row['user_id']; users.add(raw)
                # Source-independent fixed hash => same user selected in both domains.
                if int.from_bytes(hashlib.sha256(raw.encode()).digest()[:8],'big')%128:continue
                rating=float(row['rating']); timestamp=int(row['timestamp'])
                if not np.isfinite(rating) or not 1<=rating<=5:raise ValueError('Invalid rating')
                user=hashlib.sha256(salt+raw.encode()).hexdigest()
                events.append(dict(user_id=user,item_id=domain+':'+row['parent_asin'],rating=rating,timestamp=timestamp));kept+=1
        user_sets.append(users)
        sources.append(dict(url=url,sha256=digest,bytes=path.stat().st_size,rows=count,users=len(users),sampled_rows=kept))
        print(category,sources[-1],flush=True)
    overlap=len(user_sets[0]&user_sets[1]); del user_sets
    unique={(e['user_id'],e['item_id'],e['timestamp']):e for e in events}
    return list(unique.values()),dict(sources=sources,full_file_overlap_users=overlap,duplicates_removed=len(events)-len(unique),sample='SHA256(source_user_id) first 8 bytes big endian modulo 128 == 0; complete file scans; no future-based user filtering',pseudonyms='Random per-run salt, not exported; sampled cohort deterministic, pseudonyms differ each run',limitations='Publisher 5-core selection uses complete history; global split is within that preselected corpus, not a prospective population study. screen combines movies and TV; no reliable separation in ratings-only IDs.')

def ranking_metrics(scores, users, items, train, heldout, domain=None, source=None):
    seen=defaultdict(set); relevant=defaultdict(set); positive_domains=defaultdict(set)
    item_index={x:i for i,x in enumerate(items)}
    for e in train:
        seen[e['user_id']].add(e['item_id'])
        if e['rating']>=4:positive_domains[e['user_id']].add(e['item_id'].split(':')[0])
    for e in heldout:
        if e['rating']>=4 and (domain is None or e['item_id'].startswith(domain+':')):relevant[e['user_id']].add(e['item_id'])
    rows=[]; recommended=set(); cold=repeat=0
    for truth in relevant.values():cold+=sum(i not in item_index for i in truth)
    for u,truth in relevant.items():repeat+=len(truth & seen[u])
    for n,u in enumerate(users):
        if source and source not in positive_domains[u]:continue
        truth=(relevant[u]&item_index.keys())-seen[u]
        if not truth:continue
        candidates=np.array([i for i,x in enumerate(items) if x not in seen[u] and (domain is None or x.startswith(domain+':'))],dtype=int)
        ranked=candidates[np.argsort(-scores[n,candidates],kind='stable')[:10]]
        recommended.update(items[i] for i in ranked)
        hits=np.array([items[i] in truth for i in ranked],dtype=float)
        recall=float(hits.sum()/len(truth)); ideal=sum(1/np.log2(r+2) for r in range(min(10,len(truth))))
        ndcg=float(sum(h/np.log2(r+2) for r,h in enumerate(hits))/ideal)
        rows.append((recall,ndcg))
    a=np.array(rows); metrics=dict(evaluated_users=len(rows),positive_heldout_users=len(relevant),cold_item_positives=cold,repeat_positives=repeat,k=10,ranking='full train catalog, exclude all training interactions',catalog_coverage=len(recommended)/max(1,sum(domain is None or i.startswith(domain+':') for i in items)))
    for j,key in enumerate(['recall_at_10','ndcg_at_10']):
        metrics[key]=float(a[:,j].mean()) if len(rows) else None
        if len(rows):
            rng=np.random.default_rng(SEED); boots=[float(a[rng.integers(0,len(a),len(a)),j].mean()) for _ in range(400)]
            metrics[key+'_ci95']=np.quantile(boots,[.025,.975]).tolist()
    return metrics

def train_content(catalog, output):
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.decomposition import TruncatedSVD
    docs=[' '.join([w['title'],w['description'],' '.join(w['tags']),w['maker']]) for w in catalog]
    tf=TfidfVectorizer(stop_words='english',ngram_range=(1,2),max_features=4096)
    X=tf.fit_transform(docs)
    svd=TruncatedSVD(n_components=min(8,len(catalog)-1),random_state=SEED)
    vectors=svd.fit_transform(X);vectors/=np.maximum(np.linalg.norm(vectors,axis=1,keepdims=True),1e-12)
    artifact=dict(schema=1,model_id='catalog-tfidf-svd-v1',feature_schema='title-description-tags-maker-v1',catalog_sha256=hashlib.sha256(json.dumps(catalog,sort_keys=True).encode()).hexdigest(),items=[w['id'] for w in catalog],media=[w['medium'] for w in catalog],vectors=vectors.tolist(),fallback=[w['id'] for w in catalog],training=dict(seed=SEED,documents=len(docs),vocabulary=len(tf.vocabulary_),dimensions=vectors.shape[1],explained_variance=float(svd.explained_variance_ratio_.sum())),status='preview-content-only; no relevance-quality claim')
    (output/'catalog-model.json').write_text(json.dumps(artifact,indent=2))
    # Safe JSON transformer export supports reproducing item embeddings without pickle.
    (output/'content-transform.json').write_text(json.dumps(dict(vocabulary=tf.vocabulary_,idf=tf.idf_.tolist(),components=svd.components_.tolist()),default=int))
    probes=[]
    for n,w in enumerate(catalog):
        order=np.argsort(-(vectors@vectors[n])); picks=[catalog[j]['id'] for j in order if j!=n][:4]
        probes.append(dict(seed=w['id'],recommendations=picks))
    return dict(**artifact['training'],examples=probes)

def run(root=Path('/content/distran')):
    started=time.time();output=root/'artifacts';output.mkdir(exist_ok=True,parents=True)
    events,audit=prepare(root)
    train,val,test=temporal_split(events)
    print('Split',len(train),len(val),len(test),flush=True)
    users,items,U,V=fit(train,dim=16,epochs=30,seed=SEED)
    print('BPR fit complete:',len(users),'users,',len(items),'items',flush=True)
    # Ranking by ordinal percentiles gives collaborative and popularity equal scale.
    collab=U@V.T
    counts=Counter(e['item_id'] for e in train if e['rating']>=4)
    pop=np.array([counts[i] for i in items],dtype=float)
    def percentile(a):
        # Tie-preserving empirical CDF; equal counts receive identical score.
        return np.searchsorted(np.sort(a,axis=-1),a,side='right')/len(a)
    pop=percentile(pop)
    cf=np.stack([percentile(row) for row in collab])
    popularity=np.broadcast_to(pop,cf.shape)
    validation={}
    for weight in [0,.25,.5,.75,1]:
        validation[str(weight)]=ranking_metrics(weight*cf+(1-weight)*pop,users,items,train,val)
        print('Validated weight',weight,flush=True)
    best=max(validation,key=lambda key: (validation[key]['ndcg_at_10'] or 0,-float(key)))
    print('Validation selected CF weight',best,flush=True)
    models={'popularity':popularity,'bpr':cf,'hybrid':float(best)*cf+(1-float(best))*pop}
    results={}
    for name,scores in models.items():
        results[name]={}
        for cohort,domain,source in [('all',None,None),('game','game',None),('screen','screen',None),('game_to_screen','screen','game'),('screen_to_game','game','screen')]:
            results[name][cohort]=ranking_metrics(scores,users,items,train,test,domain,source)
        print('Evaluated',name,flush=True)
    # Source-only fold-in probes: no target interactions in the user representation.
    indices={x:i for i,x in enumerate(items)};profiles={}
    for source,target in [('game','screen'),('screen','game')]:
        P=np.zeros_like(U); n=Counter()
        for e in train:
            if e['rating']>=4 and e['item_id'].startswith(source+':'):
                idx=users.index(e['user_id']);P[idx]+=V[indices[e['item_id']]];n[idx]+=1
        for idx,count in n.items():P[idx]/=count
        scores=P@V.T
        profiles[source+'_to_'+target]=ranking_metrics(scores,users,items,train,test,target,source)
    np.savez_compressed(output/'bpr-factors.npz',users=np.array(users),items=np.array(items),U=U,V=V)
    content=train_content(json.loads((root/'catalog.json').read_text()),output)
    report=dict(run_id='amazon-5core-20261116',runtime='Google Colab CPU via colab CLI',seed=SEED,environment=dict(python=sys.version,numpy=np.__version__,platform=platform.platform()),audit=audit,counts=dict(events=len(events),train=len(train),validation=len(val),test=len(test),users=len(users),items=len(items)),cutoffs=dict(train_max=max(e['timestamp'] for e in train),validation_max=max(e['timestamp'] for e in val),unit='Unix milliseconds'),parameters=dict(dim=16,epochs=30,lr=.03,reg=.01,positive='rating >= 4',negative='uniform unobserved-positive complement; unobserved is not known dislike'),validation=validation,selected_cf_weight=float(best),test=results,source_only_fold_in=profiles,content=content,seconds=time.time()-started,promotion='Research only. Amazon IDs have no reviewed app catalog mapping; app uses separate content model. Warm cross-domain cohorts use all training interactions; source-only fold-in is reported separately. Social, graph, TV-only, and cold-item quality not evaluated.')
    (output/'report.json').write_text(json.dumps(report,indent=2))
    (output/'environment.txt').write_text(subprocess.check_output([sys.executable,'-m','pip','freeze'],text=True))
    print(json.dumps(report,indent=2),flush=True)
    import zipfile
    with zipfile.ZipFile(root/'results.zip','w',zipfile.ZIP_DEFLATED) as z:
        for file in output.iterdir():z.write(file,file.name)
    return report

if __name__=='__main__':run()
