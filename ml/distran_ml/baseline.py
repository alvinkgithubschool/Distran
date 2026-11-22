"""Small, inspectable BPR experiment. CPU/Colab; not production serving."""
import json
from collections import defaultdict
from pathlib import Path
import numpy as np


def temporal_split(events):
    """Global time cutoffs prevent one user's future leaking into another's past."""
    times = sorted({int(e['timestamp']) for e in events})
    if len(times) < 3:
        raise ValueError('Need at least three distinct timestamps')
    ai = min(len(times)-3, max(0, int(len(times)*.6)-1))
    bi = min(len(times)-2, max(ai+1, int(len(times)*.8)-1))
    a, b = times[ai], times[bi]
    return ([e for e in events if e['timestamp'] <= a],
            [e for e in events if a < e['timestamp'] <= b],
            [e for e in events if e['timestamp'] > b])


def fit(events, dim=16, epochs=30, seed=42, lr=.03, reg=.01):
    users = sorted({e['user_id'] for e in events})
    items = sorted({e['item_id'] for e in events})
    ui, ii = {x:i for i,x in enumerate(users)}, {x:i for i,x in enumerate(items)}
    positives = defaultdict(set)
    for e in events:
        if e['rating'] >= 4:
            positives[ui[e['user_id']]].add(ii[e['item_id']])
    rng = np.random.default_rng(seed)
    U = rng.normal(0,.1,(len(users),dim)); V = rng.normal(0,.1,(len(items),dim))
    # Complement precomputed for small experiments only. Replace at large scale.
    # Keep complements as arrays: rng.choice(list) converts the entire list
    # on every SGD step, making even bounded real-data runs unnecessarily slow.
    negatives = {u: np.array(sorted(set(range(len(items)))-seen), dtype=np.int64)
                 for u,seen in positives.items()}
    pairs = [(u,i) for u,seen in positives.items() for i in sorted(seen) if len(negatives[u])]
    if not pairs:
        raise ValueError('No trainable positive/negative pairs')
    for _ in range(epochs):
        for idx in rng.permutation(len(pairs)):
            u,i = pairs[idx]; j = int(rng.choice(negatives[u]))
            old = U[u].copy(); vi=V[i].copy(); vj=V[j].copy()
            g = 1/(1+np.exp(np.clip(old @ (vi-vj), -30, 30)))
            U[u] += lr*(g*(vi-vj)-reg*old)
            V[i] += lr*(g*old-reg*vi); V[j] += lr*(-g*old-reg*vj)
    return users, items, U, V


def evaluate(model, train, heldout, k=10):
    users,items,U,V=model; ui={u:i for i,u in enumerate(users)}
    seen=defaultdict(set); relevant=defaultdict(set)
    for e in train: seen[e['user_id']].add(e['item_id'])
    for e in heldout:
        if e['rating']>=4: relevant[e['user_id']].add(e['item_id'])
    recalls=[]; ndcgs=[]; eligible=0
    for u,truth in relevant.items():
        if u not in ui: continue
        truth=truth.intersection(items)-seen[u]
        if not truth: continue
        eligible+=1
        ranked=sorted((i for i in range(len(items)) if items[i] not in seen[u]), key=lambda i: (-float(U[ui[u]]@V[i]),items[i]))[:k]
        hits=[int(items[i] in truth) for i in ranked]
        recalls.append(sum(hits)/len(truth))
        dcg=sum(h/np.log2(r+2) for r,h in enumerate(hits))
        ideal=sum(1/np.log2(r+2) for r in range(min(k,len(truth))))
        ndcgs.append(dcg/ideal)
    return {'recall_at_k': float(np.mean(recalls)) if recalls else None,
            'ndcg_at_k': float(np.mean(ndcgs)) if ndcgs else None,
            'evaluated_users':eligible,'positive_heldout_users':len(relevant), 'k':k}


def demo():
    events=[]
    for t in range(1,31):
        for u in range(12):
            item=(u*3+t//2)%36
            events.append(dict(user_id=f'demo:{u}',item_id=f'{"game" if item%2 else "movie"}:{item}',rating=5 if item%3==u%3 else 3,timestamp=t))
    train,val,test=temporal_split(events)
    model=fit(train)
    return model, {'validation':evaluate(model,train,val),'test':evaluate(model,train,test),'synthetic':True}

if __name__=='__main__':
    model,metrics=demo(); print(json.dumps(metrics,indent=2))
