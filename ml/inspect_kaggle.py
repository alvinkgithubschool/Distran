import subprocess,sys,json
subprocess.check_call([sys.executable,'-m','pip','install','--quiet','kagglehub[pandas-datasets]'])
import kagglehub,pandas as pd
from pathlib import Path
handles=['balaka18/tmdb-top-10000-popular-movies-dataset','rush4ratio/video-game-sales-with-ratings','zaireali/howlongtobeat-games-scraper-2162025']
for handle in handles:
 path=Path(kagglehub.dataset_download(handle))
 print('DATASET',handle,'PATH',str(path),flush=True)
 for f in path.rglob('*'):
  if f.is_file():
   print('FILE',f.name,'BYTES',f.stat().st_size,flush=True)
   if f.suffix.lower()=='.csv':
    df=pd.read_csv(f,low_memory=False)
    print('SHAPE',df.shape,'COLUMNS',df.columns.tolist(),flush=True)
    print('SAMPLE',df.head(2).to_json(orient='records'),flush=True)
