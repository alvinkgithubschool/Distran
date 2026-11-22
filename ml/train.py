"""Train bounded normalized JSONL events: python ml/train.py events.jsonl output_dir."""
import argparse
import hashlib
import json
from pathlib import Path
import numpy as np
from distran_ml.baseline import temporal_split, fit, evaluate


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('events',type=Path)
    parser.add_argument('output',type=Path)
    parser.add_argument('--max-events',type=int,default=100000)
    args=parser.parse_args()
    events=[]; seen=set(); digest=hashlib.sha256()
    with args.events.open('rb') as f:
        for n,line in enumerate(f):
            if n>=args.max_events: raise ValueError('Input exceeds bounded experiment size; create a documented sample')
            digest.update(line); e=json.loads(line)
            if not all(k in e for k in ('user_id','item_id','rating','timestamp')): raise ValueError('Missing event fields')
            e['timestamp']=int(e['timestamp']); e['rating']=float(e['rating'])
            if not np.isfinite(e['rating']) or not 1<=e['rating']<=5: raise ValueError('Invalid Amazon rating')
            key=(e['user_id'],e['item_id'],e['timestamp'])
            if key not in seen: events.append(e); seen.add(key)
    train,val,test=temporal_split(events)
    model=fit(train)
    metrics={'validation':evaluate(model,train,val),'test':evaluate(model,train,test)}
    args.output.mkdir(parents=True,exist_ok=False)
    users,items,U,V=model
    np.savez(args.output/'factors.npz',users=users,items=items,U=U,V=V)
    manifest={'model_id':'research-bpr-v1','input_sha256':digest.hexdigest(),'seed':42,'numpy':np.__version__,
              'train_max_timestamp':max(e['timestamp'] for e in train),'validation_max_timestamp':max(e['timestamp'] for e in val),
              'counts':dict(train=len(train),validation=len(val),test=len(test)), 'metrics':metrics,
              'warning':'Research artifact; complete licensing, cohort and baseline report before promotion'}
    (args.output/'manifest.json').write_text(json.dumps(manifest,indent=2))
    print(json.dumps(metrics,indent=2))
if __name__=='__main__': main()
