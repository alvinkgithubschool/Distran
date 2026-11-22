import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from distran_ml.baseline import temporal_split, demo, evaluate

class BaselineTests(unittest.TestCase):
    def test_global_temporal_boundaries(self):
        rows=[dict(timestamp=t) for t in range(20)]
        a,b,c=temporal_split(rows)
        self.assertLess(max(e['timestamp'] for e in a),min(e['timestamp'] for e in b))
        self.assertLess(max(e['timestamp'] for e in b),min(e['timestamp'] for e in c))
    def test_minimal_split_has_all_partitions(self):
        parts=temporal_split([dict(timestamp=t) for t in range(3)])
        self.assertEqual([len(p) for p in parts],[1,1,1])
    def test_known_ranking(self):
        import numpy as np
        model=(['u'],['a','b','c'],np.array([[1.]]),np.array([[0.],[2.],[1.]]))
        result=evaluate(model,[dict(user_id='u',item_id='a')],[dict(user_id='u',item_id='b',rating=5)],k=1)
        self.assertEqual(result['recall_at_k'],1)
        self.assertEqual(result['ndcg_at_k'],1)
    def test_demo_reproducible(self):
        self.assertEqual(demo()[1],demo()[1])
if __name__=='__main__': unittest.main()
