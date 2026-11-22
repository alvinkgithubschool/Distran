import sys,unittest
from pathlib import Path
import pandas as pd
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from metadata_experiment import title_key,split_label,year_value,weighted_scores,prepare_frames

class MetadataTests(unittest.TestCase):
    def test_title_groups_preserve_sequel_numbers_and_share_platform_split(self):
        self.assertEqual(title_key('Baldur’s Gate 3'),title_key("Baldur's Gate 3"))
        self.assertNotEqual(title_key('Dune 2'),title_key('Dune'))
        self.assertEqual(split_label('SUPER MARIO!'),split_label('Super Mario'))
        self.assertIsNone(year_value('0000-00-00'))
        self.assertEqual(year_value(2016.0),2016)

    def test_weighted_scores_shrink_low_count_and_leave_unrated_missing(self):
        frame=pd.DataFrame({'rating':[10,8,0],'votes':[1,1000,0]})
        scores,params=weighted_scores(frame,'rating','votes')
        self.assertGreater(scores[0],8)
        self.assertLess(scores[0],10)
        self.assertTrue(pd.isna(scores[2]))
        self.assertEqual(params['eligible'],2)

    def test_platform_dedup_and_ambiguous_title_links(self):
        raw={
         'movies':pd.DataFrame(dict(title=['A','A'],rel_date=['2000-01-01']*2,overview=['story']*2,original_lang=['en']*2,vote_average=[8]*2,vote_count=[10]*2,popularity=[1]*2)),
         'sales':pd.DataFrame(dict(Name=['Game','Game'],Platform=['PC','PS4'],Year_of_Release=[2016,2016],Genre=['Action']*2,Publisher=['Studio']*2,Developer=['Dev']*2,User_Score=['tbd','8'],Critic_Score=[80,80],Critic_Count=[5,5],User_Count=[0,5])),
         'hltb':pd.DataFrame(dict(game_game_id=[1,1,2],game_game_name=['Game']*3,platform_platform=['PC','PS4','PC'],game_release_world=['2016-01-01']*3,game_profile_summary=['story']*3,game_profile_genre=['Action']*3,game_profile_dev=['Dev']*3,game_profile_pub=['Studio']*3,game_review_score=[90]*3,game_count_review=[5]*3,game_comp_main=[3600]*3,game_comp_main_count=[3]*3))}
        movies,sales,hltb,audit=prepare_frames(raw)
        self.assertEqual(len(movies),1)
        self.assertEqual(len(sales),2)
        self.assertEqual(len(hltb),2)
        self.assertEqual(audit['exact_title_year_game_link_proposals'],0)
        self.assertEqual(audit['sales_tbd_user_scores'],1)
