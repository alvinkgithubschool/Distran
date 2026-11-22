"""Pooled provider clients, bounded retries, shared rate gates and token refresh."""
import asyncio
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
import json
import random
import time
import httpx
from .cache import CatalogCache
from .config import Settings

class ProviderError(Exception):
    def __init__(self, provider: str, code: str = 'unavailable', status: int = 503):
        self.provider, self.code, self.status = provider, code, status
        super().__init__(f'{provider} {code}')

class RateGate:
    def __init__(self, per_second: float, concurrency: int):
        self.interval = 1 / per_second
        self.next_at = 0.0
        self.lock = asyncio.Lock()
        self.slots = asyncio.Semaphore(concurrency)

    async def wait(self):
        async with self.lock:
            await asyncio.sleep(max(0, self.next_at - time.monotonic()))
            self.next_at = time.monotonic() + self.interval

    async def pause(self, seconds: float):
        async with self.lock:
            self.next_at = max(self.next_at, time.monotonic() + seconds)


def retry_after(value: str | None) -> float:
    try:
        return max(0, float(value or 0))
    except ValueError:
        try:
            return max(0, (parsedate_to_datetime(value) - datetime.now(timezone.utc)).total_seconds())
        except (ValueError, TypeError):
            return 1

class Providers:
    def __init__(self, settings: Settings, client: httpx.AsyncClient, cache: CatalogCache):
        self.settings, self.client, self.cache = settings, client, cache
        self.gates = {'tmdb': RateGate(5, 4), 'igdb': RateGate(3, 2), 'twitch': RateGate(1, 1)}
        self.token_lock = asyncio.Lock()
        self.token, self.token_expires = '', 0.0

    def configured(self, provider):
        return bool(self.settings.tmdb_token) if provider == 'tmdb' else bool(self.settings.twitch_id and self.settings.twitch_secret)

    async def request(self, provider, method, url, **kwargs):
        gate = self.gates[provider]
        for attempt in range(3):
            try:
                async with gate.slots:
                    await gate.wait()
                    response = await self.client.request(method, url, **kwargs)
                if response.status_code == 429:
                    delay = max(1, retry_after(response.headers.get('retry-after')))
                    await gate.pause(min(delay, 60))
                    if delay > 4:
                        raise ProviderError(provider, 'rate_limited', 503)
                    if attempt < 2:
                        continue
                    raise ProviderError(provider, 'rate_limited')
                if response.status_code in (401, 403):
                    raise ProviderError(provider, 'credentials_rejected', 502)
                if response.status_code == 404:
                    raise ProviderError(provider, 'not_found', 404)
                if response.status_code >= 500 and attempt < 2:
                    await asyncio.sleep(.3 * 2**attempt + random.uniform(0, .15))
                    continue
                if response.status_code >= 400:
                    raise ProviderError(provider, 'upstream_error', 502)
                return response.json()
            except (httpx.TransportError, ValueError):
                if attempt == 2:
                    raise ProviderError(provider, 'unavailable') from None
                await asyncio.sleep(.3 * 2**attempt)
        raise ProviderError(provider, 'rate_limited')

    async def access_token(self):
        async with self.token_lock:
            if self.token and time.monotonic() < self.token_expires:
                return self.token
            if not self.configured('igdb'):
                raise ProviderError('igdb', 'not_configured')
            # Credentials go in the POST form body, never a query string or log.
            response = await self.request('twitch', 'POST', 'https://id.twitch.tv/oauth2/token', data={
                'client_id': self.settings.twitch_id, 'client_secret': self.settings.twitch_secret,
                'grant_type': 'client_credentials',
            })
            self.token = response['access_token']
            self.token_expires = time.monotonic() + max(0, int(response['expires_in']) - 60)
            return self.token

    async def tmdb(self, path, params=None, ttl=1800):
        if not self.configured('tmdb'):
            raise ProviderError('tmdb', 'not_configured')
        async def load():
            return await self.request('tmdb', 'GET', f'https://api.themoviedb.org/3/{path}',
                params=params or {}, headers={'Authorization': f'Bearer {self.settings.tmdb_token}'})
        key = 'tmdb:' + path + ':' + json.dumps(params or {}, sort_keys=True)
        return await self.cache.remember(key, load, ttl)

    async def igdb(self, body, ttl=1800, endpoint="games"):
        if endpoint not in ("games", "companies", "keywords", "themes", "genres"):
            raise ValueError("Unsupported IGDB endpoint")
        if not self.configured('igdb'):
            raise ProviderError('igdb', 'not_configured')
        async def load():
            token = await self.access_token()
            for attempt in range(2):
                try:
                    return await self.request('igdb', 'POST', f'https://api.igdb.com/v4/{endpoint}',
                        content=body, headers={'Client-ID': self.settings.twitch_id, 'Authorization': f'Bearer {token}', 'Content-Type': 'text/plain'})
                except ProviderError as error:
                    if error.code != 'credentials_rejected' or attempt:
                        raise
                    # Do not invalidate a token already refreshed by a concurrent caller.
                    async with self.token_lock:
                        if self.token == token:
                            self.token_expires = 0
                    token = await self.access_token()
        return await self.cache.remember('igdb:' + ('' if endpoint == 'games' else endpoint + ':') + body, load, ttl)
