"""Kaggle metadata training: content retrieval, aggregate-score regression, and app vectors."""
import hashlib,json,re,sys,time,unicodedata,subprocess
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error,mean_squared_error
from sklearn.preprocessing import normalize

HANDLES={
 'movies':'balaka18/tmdb-top-10000-popular-movies-dataset/versions/2',
 'sales':'rush4ratio/video-game-sales-with-ratings',
 'hltb':'zaireali/howlongtobeat-games-scraper-2162025/versions/1'}
FILES={'movies':'movies_tmdb_popular.csv','sales':'Video_Games_Sales_as_at_22_Dec_2016.csv','hltb':'hltb_data.csv'}

def clean(value):
    if pd.isna(value):return ''
    return re.sub(r'\s+',' ',str(value)).strip()

def title_key(value):
    value=unicodedata.normalize('NFKD',clean(value)).encode('ascii','ignore').decode().lower()
    # Apostrophes are omitted; other punctuation becomes spaces. Keep sequel numerals.
    value=value.replace("'",'')
    return re.sub(r'[^a-z0-9]+',' ',value).strip()

def split_label(title):
    bucket=int(hashlib.sha256(title_key(title).encode()).hexdigest()[:8],16)%10
    return 'train' if bucket<6 else 'validation' if bucket<8 else 'test'

def year_value(value):
    match=re.match(r'^(19\d{2}|20\d{2})',clean(value))
    return int(match[0]) if match else None

def weighted_scores(frame,score,count):
    ratings=pd.to_numeric(frame[score],errors='coerce');votes=pd.to_numeric(frame[count],errors='coerce').clip(lower=0)
    valid=ratings.notna() & votes.gt(0)
    prior=float(ratings[valid].mean()) if valid.any() else 0.
    m=float(votes[valid].quantile(.9)) if valid.any() else 1.
    quality=(votes*ratings+m*prior)/(votes+m)
    return quality.where(valid),dict(prior_mean=prior,prior_count=m,formula='v/(v+m)*R + m/(v+m)*C',eligible=int(valid.sum()))

def prepare_frames(raw):
    movies=raw['movies'].copy();movies=movies[movies['title'].notna()].copy()
    movies['key']=movies['title'].map(title_key);movies['year']=movies['rel_date'].map(year_value)
    movies=movies.drop_duplicates(['key','year']).reset_index(drop=True)
    movies['doc']=movies['overview'].map(clean)+' '+movies['original_lang'].map(lambda x:'language_'+clean(x))
    movies['title_doc']=movies['title'].map(clean)+' '+movies['doc']
    sales=raw['sales'].copy();sales=sales[sales['Name'].notna()].copy()
    sales['key']=sales['Name'].map(title_key);sales['year']=sales['Year_of_Release'].map(year_value)
    sales=sales.drop_duplicates(['key','Platform','year']).reset_index(drop=True)
    # Platform, ratings and sales are not included in shared semantic space.
    sales['doc']=sales[['Genre','Publisher','Developer']].fillna('').astype(str).agg(' '.join,axis=1)
    sales['title_doc']=sales['Name'].map(clean)+' '+sales['doc']
    hltb=raw['hltb'].copy();hltb=hltb[hltb['game_game_name'].notna()].copy()
    # Do not sum repeated platform rows of game-level aggregates.
    hltb=hltb.sort_values(['game_game_id','platform_platform'],kind='stable').drop_duplicates('game_game_id').copy()
    hltb['key']=hltb['game_game_name'].map(title_key)
    hltb['year']=hltb['game_release_world'].map(year_value)
    hltb['doc']=hltb[['game_profile_summary','game_profile_genre','game_profile_dev','game_profile_pub']].fillna('').astype(str).agg(' '.join,axis=1)
    hltb['title_doc']=hltb['game_game_name'].map(clean)+' '+hltb['doc']
    # One unambiguous key/year on each side; no title-only or fuzzy joins.
    s_keys=sales[['key','year']].dropna().drop_duplicates()
    h_keys=hltb[['key','year']].dropna()
    unique_h=h_keys[~h_keys.duplicated(['key','year'],keep=False)]
    proposals=s_keys.merge(unique_h,on=['key','year'])
    audits=dict(score_ranges={k:{c:dict(nonmissing=int(pd.to_numeric(v[c],errors='coerce').notna().sum()),minimum=float(pd.to_numeric(v[c],errors='coerce').min()),maximum=float(pd.to_numeric(v[c],errors='coerce').max())) for c in ({'movies':['vote_average','vote_count','popularity'],'sales':['Critic_Score','User_Score','Critic_Count','User_Count'],'hltb':['game_review_score','game_count_review','game_comp_main','game_comp_main_count']}[k])} for k,v in raw.items()},raw_rows={k:len(v) for k,v in raw.items()},processed_rows=dict(movies=len(movies),sales=len(sales),hltb=len(hltb)),missing={k:{c:int(v[c].isna().sum()) for c in v.columns} for k,v in raw.items()},sales_tbd_user_scores=int(raw['sales']['User_Score'].astype(str).str.lower().eq('tbd').sum()),exact_title_year_game_link_proposals=len(proposals),movie_genre_policy='genres(1).csv is a standalone dictionary with no per-movie foreign keys; NOT attached',game_identity_policy='Exact normalized title + exact release year only; proposals are not verified canonical mappings. Platform variants retain rows in regression but stay together in title-group splits.',hltb_policy='Drop repeated game_game_id platform rows; use game-level summary/genres, never review histograms or platform completion fields as predictors of aggregate scores.')
    return movies,sales,hltb,audits

def regression(frame,title,target,features,output,name):
    y=pd.to_numeric(frame[target],errors='coerce')
    maximum=10 if name=='movie-votes' else 100
    frame=frame[y.between(0,maximum)].copy();frame['target']=y[y.between(0,maximum)]
    labels=frame[title].map(split_label)
    masks={x:labels.eq(x).to_numpy() for x in ['train','validation','test']}
    assert not (set(frame.loc[masks['train'],title].map(title_key)) & set(frame.loc[masks['test'],title].map(title_key)))
    docs=frame[features].fillna('').astype(str).agg(' '.join,axis=1).tolist()
    tf=TfidfVectorizer(stop_words='english',ngram_range=(1,2),max_features=20000,min_df=2,sublinear_tf=True)
    X=tf.fit_transform(np.array(docs)[masks['train']]);y=frame['target'].to_numpy()
    val=tf.transform(np.array(docs)[masks['validation']]);test=tf.transform(np.array(docs)[masks['test']])
    candidates={};trained={}
    for alpha in [1.,10.,100.]:
        model=Ridge(alpha=alpha,solver='lsqr');model.fit(X,y[masks['train']]);pred=np.clip(model.predict(val),0,maximum)
        candidates[str(alpha)]=float(mean_absolute_error(y[masks['validation']],pred));trained[alpha]=model
    alpha=float(min(candidates,key=candidates.get));model=trained[alpha]
    pred=np.clip(model.predict(test),0,maximum);truth=y[masks['test']]
    mean=float(y[masks['train']].mean());baseline=np.full(len(truth),mean)
    metrics=lambda p:dict(mae=float(mean_absolute_error(truth,p)),rmse=float(np.sqrt(mean_squared_error(truth,p))))
    data=dict(task='aggregate score regression; NOT personal preference or recommendation accuracy',target=target,range=[0,maximum],features=features,split='SHA256(normalized title) modulo 10: 0-5 train, 6-7 validation, 8-9 test; all platform and remake title variants stay together; NOT chronological',counts={x:int(m.sum()) for x,m in masks.items()},vocabulary=len(tf.vocabulary_),alpha=alpha,validation_mae=candidates,test=metrics(pred),train_mean_baseline=metrics(baseline),train_mean=mean,prediction_clip=[0,maximum])
    (output/(name+'-regressor.json')).write_text(json.dumps(dict(vocabulary=tf.vocabulary_,idf=tf.idf_.tolist(),coefficients=model.coef_.tolist(),intercept=float(model.intercept_),parameters=data),default=int))
    print('REGRESSION',name,data,flush=True)
    return data

def run(root=Path('/content/distran-metadata')):
    import kagglehub
    import sklearn
    start=time.time();root.mkdir(exist_ok=True,parents=True);output=root/'artifacts';output.mkdir(exist_ok=True)
    raw={};sources={}
    for key,handle in HANDLES.items():
        directory=Path(kagglehub.dataset_download(handle));path=directory/FILES[key]
        raw[key]=pd.read_csv(path,low_memory=False)
        sources[key]=dict(handle=handle,resolved_path=str(directory),file=path.name,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),bytes=path.stat().st_size,rows=len(raw[key]),columns=raw[key].columns.tolist())
        print('LOADED',key,len(raw[key]),flush=True)
    movies,sales,hltb,audit=prepare_frames(raw)
    # Group-safe heldout prediction using metadata only; scores/counts excluded from predictors.
    regressions={
      'movies':regression(movies[pd.to_numeric(movies['vote_count'],errors='coerce').ge(5)],'title','vote_average',['overview','original_lang'],output,'movie-votes'),
      'sales':regression(sales,'Name','Critic_Score',['Genre','Platform','Publisher','Developer','Rating'],output,'game-critics'),
      'hltb':regression(hltb[pd.to_numeric(hltb['game_count_review'],errors='coerce').ge(5)],'game_game_name','game_review_score',['game_profile_summary','game_profile_genre','game_profile_dev','game_profile_pub'],output,'hltb-reviews')}
    print('Fitting catalog semantic model',flush=True)
    # Bound total game dominance and repeated platform copies in the shared content corpus.
    sales_docs=sales.drop_duplicates(['key','doc'])
    hltb_selected=hltb.assign(sample_hash=hltb['key'].map(lambda k:hashlib.sha256(k.encode()).hexdigest())).sort_values(['sample_hash','game_game_id']).head(10000)
    corpus=list(movies['title_doc'])+list(sales_docs['title_doc'])+list(hltb_selected['title_doc'])
    tf=TfidfVectorizer(stop_words='english',ngram_range=(1,2),max_features=30000,min_df=2,sublinear_tf=True)
    X=tf.fit_transform(corpus)
    svd=TruncatedSVD(n_components=64,n_iter=5,random_state=42);svd.fit(X)
    catalog=json.loads((root/'catalog-metadata.json').read_text())
    app_docs=[' '.join([w['title'],w['description'],' '.join(w['tags']),w['maker']]) for w in catalog]
    vectors=normalize(svd.transform(tf.transform(app_docs)))
    # Same ID/schema contract as v1. Only app-owned text projected; no automatic source ID merge.
    artifact=dict(schema=1,model_id='kaggle-catalog-tfidf-svd-v2',feature_schema='title-description-tags-maker-v2',catalog_sha256=hashlib.sha256(json.dumps(catalog,sort_keys=True).encode()).hexdigest(),items=[w['id'] for w in catalog],media=[w['medium'] for w in catalog],vectors=vectors.tolist(),fallback=[w['id'] for w in catalog],training=dict(seed=42,documents=len(corpus),vocabulary=len(tf.vocabulary_),dimensions=64,explained_variance=float(svd.explained_variance_ratio_.sum()),sources={k:v['sha256'] for k,v in sources.items()}),status='preview-content-only; aggregate regressions are not personalization quality')
    (output/'catalog-model.json').write_text(json.dumps(artifact,indent=2))
    np.savez_compressed(output/'content-transform.npz',idf=tf.idf_,components=svd.components_)
    (output/'content-vocabulary.json').write_text(json.dumps(tf.vocabulary_,default=int))
    # Export aggregate ranking tables for research, not to override personal taste in the app.
    movie_quality,mp=weighted_scores(movies,'vote_average','vote_count')
    hltb_quality,hp=weighted_scores(hltb,'game_review_score','game_count_review')
    movies.assign(weighted_score=movie_quality)[['title','year','vote_average','vote_count','weighted_score']].sort_values('weighted_score',ascending=False).to_csv(output/'movie-weighted-ranking.csv',index=False)
    hltb.assign(weighted_score=hltb_quality)[['game_game_id','game_game_name','game_review_score','game_count_review','game_comp_main','game_comp_main_count','weighted_score']].sort_values('weighted_score',ascending=False).to_csv(output/'game-weighted-ranking.csv',index=False)
    proposals=[]
    for w in catalog:
        frame=hltb if w['medium']=='game' else movies if w['medium']=='movie' else None
        matches=frame[frame['key'].eq(title_key(w['title'])) & frame['year'].eq(w['year'])] if frame is not None else pd.DataFrame()
        proposals.append(dict(app_id=w['id'],title=w['title'],year=w['year'],candidate_count=len(matches),policy='title/year candidate only; not canonical approval'))
    semantic=dict(**artifact['training'],matrix_shape=list(X.shape),source_documents=dict(movies=len(movies),sales=len(sales_docs),hltb=len(hltb_selected)),app_projection_nonzero=int(np.count_nonzero(np.linalg.norm(vectors,axis=1))),examples=[])
    for i,w in enumerate(catalog):
        order=np.argsort(-(vectors@vectors[i]),kind='stable')
        semantic['examples'].append(dict(seed=w['id'],recommendations=[dict(id=catalog[j]['id'],cosine=float(vectors[i]@vectors[j])) for j in order if j!=i][:4]))
    report=dict(run_id='kaggle-metadata-20261116',runtime='Google Colab CPU via colab CLI',sources=sources,audit=audit,regressions=regressions,semantic=semantic,weighted_score_parameters=dict(movies=mp,hltb=hp),app_identity_proposals=proposals,environment=dict(python=sys.version,numpy=np.__version__,pandas=pd.__version__,sklearn=sklearn.__version__,kagglehub=kagglehub.__version__),seconds=time.time()-start,limitations=['No per-user events: collaborative training or Recall/NDCG taste claims unsupported.','Aggregate-regression targets are contemporaneous snapshots; hash-group splits are not future forecasting.','Content corpus fitting is unsupervised/transductive; probe cosine is not accuracy.','Year/title proposals can still conflate editions; no source IDs promoted to canonical app works.','HLTB zero values and repeated platform profiles need filtering; durations exported as source raw values, not silently assumed hours.','Movie genre dictionary has no per-film links; credits and genres from reference notebook are unavailable.'])
    (output/'report.json').write_text(json.dumps(report,indent=2))
    (output/'environment.txt').write_text(subprocess.check_output([sys.executable,'-m','pip','freeze'],text=True))
    import zipfile
    with zipfile.ZipFile(root/'results.zip','w',zipfile.ZIP_DEFLATED) as z:
        for f in output.iterdir():z.write(f,f.name)
    print(json.dumps(report,indent=2),flush=True)
    return report

if __name__=='__main__':run()
