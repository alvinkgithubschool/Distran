import sys
import unittest
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from experiment import ranking_metrics

class ExperimentMetricsTests(unittest.TestCase):
    def test_exclusions_cold_items_and_cross_domain_eligibility(self):
        train = [dict(user_id='u', item_id='game:a', rating=5)]
        held = [dict(user_id='u', item_id='screen:b', rating=5),
                dict(user_id='u', item_id='screen:new', rating=5)]
        result = ranking_metrics(np.array([[99., 1.]]), ['u'],
                                 ['game:a', 'screen:b'], train, held, 'screen', 'game')
        self.assertEqual(result['recall_at_10'], 1)
        self.assertEqual(result['ndcg_at_10'], 1)
        self.assertEqual(result['cold_item_positives'], 1)
        self.assertEqual(result['evaluated_users'], 1)
        self.assertEqual(result['catalog_coverage'], 1)

    def test_empty_direction_has_null_metrics(self):
        result = ranking_metrics(np.array([[1.]]), ['u'], ['screen:b'], [],
                                 [dict(user_id='u', item_id='screen:b', rating=5)],
                                 'screen', 'game')
        self.assertEqual(result['evaluated_users'], 0)
        self.assertIsNone(result['recall_at_10'])

    def test_repeats_are_not_relevant_and_bootstrap_is_deterministic(self):
        train = [dict(user_id='u', item_id='game:a', rating=5)]
        held = train + [dict(user_id='u', item_id='game:b', rating=5)]
        args = (np.array([[99., 1.]]), ['u'], ['game:a', 'game:b'], train, held)
        result = ranking_metrics(*args)
        self.assertEqual(result['repeat_positives'], 1)
        self.assertEqual(result['recall_at_10'], 1)
        self.assertEqual(result, ranking_metrics(*args))
