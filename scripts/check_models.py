"""Safe OpenRouter check: .venv/bin/python scripts/check_models.py [--live]."""
import argparse,asyncio,json,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import httpx
from backend.app.config import Settings
from backend.app.model_router import ModelRouter,ModelUnavailable,ROUTES

async def main(live=False):
    settings=Settings(); report={'provider':'openrouter','free_only':True,'key_configured':bool(settings.openrouter_key),'models':{}}
    async with httpx.AsyncClient(follow_redirects=False) as client:
        router=ModelRouter(client,settings.openrouter_key)
        for task,model in ROUTES.items():
            row={'model':model}
            try:
                await router.require_free(task)
                row['catalog']='available_zero_price'
                if live:
                    if task=='conversation':row['live']='ok' if await router.converse('Reply with a short hello. No personal information is provided.') else 'empty'
                    else:
                        scores=await router.rank('science fiction about isolation',[{'id':'fixture','title':'Research station','description':'A scientist lives alone on a distant planet.','tags':['Science fiction','Isolation']}])
                        row['live']='ok' if 'fixture' in scores else 'empty'
            except ModelUnavailable as error:row['error']=str(error)
            report['models'][task]=row
    print(json.dumps(report,indent=2))
    return 1 if any('error' in row for row in report['models'].values()) else 0

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--live',action='store_true');args=parser.parse_args()
    sys.exit(asyncio.run(main(args.live)))
