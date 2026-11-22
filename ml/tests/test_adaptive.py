import sys
import unittest
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from adaptive_experiment import (FEATURES, Tokenizer, cold_i_vec, event_features, pointwise,
                                 rank_eval, replay, train_shared_theta)


def tiny_stats():
    stats = dict(
        users=['u1', 'u2'], items=['game:a', 'screen:b'],
        ui={'u1': 0, 'u2': 1}, ii={'game:a': 0, 'screen:b': 1},
        i_vec=np.array([[0.9, 0.8, 1.0, 0.0, 0.5], [0.1, 0.2, 0.0, 1.0, 0.1]], np.float32),
        u_vec=np.array([[0.5, 0.6, 0.7, 0.3, 0.9], [0.4, 0.5, 0.2, 0.8, 0.8]], np.float32),
        aff=np.array([[0.7, 0.3], [0.2, 0.8]], np.float32),
        collab_pct=np.array([[0.9, 0.1], [0.2, 0.8]], np.float32),
        u_cnt={'u1': 12, 'u2': 3}, cold_quality=0.6)
    return stats


class AdaptiveTests(unittest.TestCase):
    def test_event_features_cold_item_and_known_item(self):
        stats = tiny_stats()
        known = event_features(stats, 'u1', 'game:a')
        cold = event_features(stats, 'u1', 'screen:NEW')
        self.assertEqual(known.shape, (len(FEATURES),))
        self.assertEqual(cold.shape, (len(FEATURES),))
        np.testing.assert_allclose(cold[:5], cold_i_vec('screen:NEW', 0.6))
        self.assertEqual(float(cold[12]), 0.5)  # median collaborative percentile for cold items
        self.assertAlmostEqual(float(known[10]), 0.7 * 1.0)  # aff_game * dom_game

    def test_replay_is_predict_before_learn_and_bounded(self):
        stats = tiny_stats()
        train = [dict(user_id='u1', item_id='game:a', rating=5, timestamp=1),
                 dict(user_id='u1', item_id='screen:b', rating=1, timestamp=2),
                 dict(user_id='u2', item_id='screen:b', rating=5, timestamp=3)]
        theta = np.zeros(len(FEATURES), np.float32)
        preds, state = replay(train, stats, theta, 0.0, lr_u=0.5, reg_u=0.0)
        # first prediction for u1 happens before any update: p == sigmoid(0)
        self.assertAlmostEqual(preds[0]['p'], 0.5)
        self.assertIn('u1', state)
        delta, bu = state['u1']
        self.assertTrue(np.all(np.abs(delta) <= 10) and abs(bu) <= 10)
        # positive then negative event moves the intercept back down
        self.assertLess(bu, 0.0)

    def test_pointwise_calibration_bins_cover_all_predictions(self):
        preds = [dict(rating=5, p=0.05), dict(rating=1, p=0.95), dict(rating=4, p=0.5)]
        pw = pointwise(preds)
        self.assertEqual(pw['n'], 3)
        self.assertEqual(sum(b['n'] for b in pw['calibration']), 3)
        self.assertGreater(pw['logloss'], 0)

    def test_rank_eval_cold_items_are_counted_not_retrievable(self):
        stats = tiny_stats()
        train = [dict(user_id='u1', item_id='game:a', rating=5, timestamp=1)]
        held = [dict(user_id='u1', item_id='screen:b', rating=5, timestamp=2),
                dict(user_id='u1', item_id='screen:NEW', rating=5, timestamp=2),
                dict(user_id='uX', item_id='screen:b', rating=5, timestamp=2)]
        rows = {'u1': np.array([0.1, 0.9], np.float32)}
        result = rank_eval(lambda u: rows[u], stats, train, held)
        self.assertEqual(result['evaluated_users'], 1)
        self.assertEqual(result['cold_item_positives'], 1)
        self.assertEqual(result['cold_heldout_users'], 1)
        self.assertEqual(result['recall_at_10'], 1.0)  # screen:b retrieved at rank 1
        self.assertEqual(result['ndcg_at_10'], 1.0)

    def test_train_shared_theta_learns_separable_signal(self):
        rng = np.random.default_rng(0)
        stats = tiny_stats()
        events = []
        for t in range(40):
            u = 'u1' if t % 2 else 'u2'
            it = 'game:a' if t % 4 < 2 else 'screen:b'
            # u1 likes game:a, u2 likes screen:b
            rating = 5 if (u == 'u1') == (it == 'game:a') else 2
            events.append(dict(user_id=u, item_id=it, rating=float(rating), timestamp=t))
        theta, b = train_shared_theta(events, stats, epochs=200, neg_per_user=2, lr=0.05, seed=1)
        p_u1_game = 1 / (1 + np.exp(-(b + event_features(stats, 'u1', 'game:a') @ theta)))
        p_u2_game = 1 / (1 + np.exp(-(b + event_features(stats, 'u2', 'game:a') @ theta)))
        self.assertGreater(float(p_u1_game), float(p_u2_game) + 0.3)

    def test_tokenizer_specials_and_truncation(self):
        tok = Tokenizer().fit(['alpha beta gamma', 'alpha beta'], min_df=1, cap=10)
        ids = tok.encode('alpha unknownword', L=8)
        self.assertEqual(len(ids), 8)
        self.assertEqual(ids[0], tok.vocab['alpha'])
        self.assertEqual(ids[1], 1)  # <unk>
        self.assertEqual(ids[-1], 0)  # <pad>


if __name__ == '__main__':
    unittest.main()
