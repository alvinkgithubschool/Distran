"""Copy the measured content transformer into ignored backend serving storage."""
import hashlib,json,shutil,sys
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'ml/artifacts/kaggle-remote'
output=ROOT/'backend/data/buddy';output.mkdir(parents=True,exist_ok=True)
model=json.loads((source/'catalog-model.json').read_text())
with np.load(source/'content-transform.npz',allow_pickle=False) as data:
    assert data['components'].shape==(64,len(data['idf']))
    assert np.isfinite(data['components']).all() and np.isfinite(data['idf']).all()
assert model['model_id']=='kaggle-catalog-tfidf-svd-v2'
files=['catalog-model.json','content-transform.npz','content-vocabulary.json']
for file in files:shutil.copyfile(source/file,output/file)
(output/'manifest.json').write_text(json.dumps({'model_id':model['model_id'],'sha256':{file:hashlib.sha256((output/file).read_bytes()).hexdigest() for file in files}},indent=2))
print('Prepared local Buddy query index:',output)
