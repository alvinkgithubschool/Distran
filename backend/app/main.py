"""Catalog and Buddy gateway. Provider credentials remain exclusively server-side."""
from contextlib import asynccontextmanager
from typing import Literal
import asyncio
import httpx
from fastapi import FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from .cache import CatalogCache, CacheBusy
from .catalog import CatalogService
from .canonical import CanonicalCatalog
from .creators import CreatorService
from .config import Settings
from .providers import Providers, ProviderError
from .buddy import BuddyRequest, BuddyService
from .buddy_discovery import BuddyDiscovery
from .model_router import ModelRouter

def create_app(settings: Settings | None=None,transport=None):
    settings=settings or Settings()
    @asynccontextmanager
    async def lifespan(app):
        cache=CatalogCache(settings.cache_path)
        async with httpx.AsyncClient(transport=transport,timeout=httpx.Timeout(6,connect=3,pool=3),limits=httpx.Limits(max_connections=12,max_keepalive_connections=8),follow_redirects=False) as client:
            app.state.canonical=CanonicalCatalog(cache.db)
            app.state.catalog=CatalogService(Providers(settings,client,cache))
            app.state.creators=CreatorService(app.state.catalog.providers)
            app.state.buddy=BuddyService(ModelRouter(client,settings.openrouter_key),canonical=app.state.canonical,
                                        discovery=BuddyDiscovery(app.state.catalog,app.state.canonical))
            app.state.buddy_slots=asyncio.Semaphore(2)
            app.state.cache=cache;app.state.slots=asyncio.Semaphore(24)
            yield
            tasks=list(cache.flights.values())
            for task in tasks:task.cancel()
            if tasks:await asyncio.gather(*tasks,return_exceptions=True)
            cache.close()
    app=FastAPI(title='Distran Catalog API',version='0.3.0',lifespan=lifespan)
    app.add_middleware(CORSMiddleware,allow_origins=list(settings.origins),allow_methods=['GET','POST'],allow_headers=['Content-Type'],expose_headers=['X-Catalog-Cache'],max_age=600)
    @app.get('/health')
    def health():return {'status':'ok'}
    @app.get('/v1/features')
    def features():return dict(buddy=bool(settings.buddy_enabled),connections=False,live_catalog=bool(settings.tmdb_token or (settings.twitch_id and settings.twitch_secret)),catalog_providers={'tmdb':bool(settings.tmdb_token),'igdb':bool(settings.twitch_id and settings.twitch_secret)})
    @app.get('/v1/catalog/builtins')
    def builtins(request:Request,response:Response):
        response.headers['Cache-Control']='public, max-age=60'
        return request.app.state.canonical.builtins()
    @app.get('/v1/catalog/search')
    async def search(request:Request,response:Response,q:str=Query('',max_length=100),medium:Literal['all','game','movie','tv']='all',page:int=Query(1,ge=1,le=50)):
        if any(ord(c)<32 for c in q):raise HTTPException(422,'Unsupported search characters.')
        q=' '.join(q.split())
        if request.app.state.slots.locked():raise HTTPException(503,'Catalog is busy; try again shortly.',headers={'Retry-After':'2'})
        async with request.app.state.slots:value=await request.app.state.catalog.search(q,medium,page)
        response.headers['Cache-Control']='private, max-age=60'
        response.headers['X-Catalog-Cache']=','.join(f"{p}:{v['cache']}" for p,v in value['providers'].items()) or 'none'
        if value['status']=='unavailable':response.status_code=503;response.headers['Cache-Control']='no-store'
        return value
    @app.get('/v1/works/{work_id}')
    async def detail(work_id:str,request:Request,response:Response):
        if request.app.state.slots.locked():raise HTTPException(503,'Catalog is busy; try again shortly.')
        try:
            async with request.app.state.slots,asyncio.timeout(18):value=await request.app.state.catalog.detail(work_id)
        except ProviderError as error:raise HTTPException(error.status,{'provider':error.provider,'code':error.code}) from None
        except TimeoutError:raise HTTPException(504,'Catalog provider timed out.') from None
        except CacheBusy:raise HTTPException(503,'Catalog is busy; try again shortly.') from None
        value['work']=request.app.state.canonical.update(value['work'])
        response.headers['Cache-Control']='private, max-age=300';response.headers['X-Catalog-Cache']=value['cache']
        return value
    @app.get('/v1/creators/search')
    async def search_creators(request:Request,response:Response,q:str=Query(...,min_length=2,max_length=100),page:int=Query(1,ge=1,le=50)):
        if any(ord(c)<32 for c in q):raise HTTPException(422,'Unsupported search characters.')
        q=' '.join(q.split())
        if len(q)<2:raise HTTPException(422,'Use at least two characters.')
        if request.app.state.slots.locked():raise HTTPException(503,'Directory is busy; try again shortly.')
        async with request.app.state.slots:value=await request.app.state.creators.search(q,page)
        response.headers['Cache-Control']='private, max-age=60'
        if value['status']=='unavailable':response.status_code=503;response.headers['Cache-Control']='no-store'
        return value
    @app.get('/v1/creators/{creator_id}')
    async def creator_detail(creator_id:str,request:Request,response:Response):
        if request.app.state.slots.locked():raise HTTPException(503,'Directory is busy; try again shortly.')
        try:
            async with request.app.state.slots,asyncio.timeout(18):value=await request.app.state.creators.detail(creator_id)
        except ProviderError as error:raise HTTPException(error.status,{'provider':error.provider,'code':error.code}) from None
        except TimeoutError:raise HTTPException(504,'Directory provider timed out.') from None
        except CacheBusy:raise HTTPException(503,'Directory is busy; try again shortly.') from None
        response.headers['Cache-Control']='private, max-age=300'
        return value
    @app.post('/v1/buddy/query')
    async def buddy(payload:BuddyRequest,request:Request,response:Response):
        if not settings.buddy_enabled:raise HTTPException(503,'Buddy is not enabled')
        if request.app.state.buddy_slots.locked():raise HTTPException(429,'Buddy is busy; try again shortly.',headers={'Retry-After':'5'})
        response.headers['Cache-Control']='no-store'
        try:
            async with request.app.state.buddy_slots:
                return await request.app.state.buddy.query(payload)
        except ValueError:raise HTTPException(422,'Enter a supported Buddy request.') from None
    return app
app=create_app()
