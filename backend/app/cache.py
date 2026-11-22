"""Bounded persistent JSON cache with single-flight refresh and stale-on-error."""
import asyncio
import json
from pathlib import Path
import sqlite3
import time

class CacheBusy(Exception):
    pass

class CatalogCache:
    def __init__(self, path: str, max_entries: int = 5000):
        if path != ':memory:':
            Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(path, check_same_thread=False)
        self.db.execute('PRAGMA journal_mode=WAL')
        self.db.execute('CREATE TABLE IF NOT EXISTS cache(key TEXT PRIMARY KEY, value TEXT NOT NULL, expires REAL NOT NULL, touched REAL NOT NULL)')
        self.db.execute('CREATE INDEX IF NOT EXISTS cache_touched ON cache(touched)')
        self.db.commit()
        self.max_entries = max_entries
        self.flights: dict[str, asyncio.Task] = {}
        self.hits = self.misses = self.stale_hits = 0

    def get(self, key: str, allow_stale: bool = False):
        row = self.db.execute('SELECT value, expires FROM cache WHERE key=?', (key,)).fetchone()
        now = time.time()
        if row and (row[1] > now or (allow_stale and row[1] > now - 86400)):
            return json.loads(row[0])
        return None

    def put(self, key: str, value, ttl: float):
        now = time.time()
        self.db.execute('INSERT OR REPLACE INTO cache VALUES(?,?,?,?)', (key, json.dumps(value, separators=(',', ':')), now + ttl, now))
        self.db.execute('DELETE FROM cache WHERE expires < ?', (now - 86400,))
        self.db.execute('DELETE FROM cache WHERE key IN (SELECT key FROM cache ORDER BY touched DESC LIMIT -1 OFFSET ?)', (self.max_entries,))
        self.db.commit()

    async def _load(self, key, loader, ttl):
        try:
            value = await loader()
            self.put(key, value, ttl)
            return value, 'miss'
        except Exception:
            stale = self.get(key, allow_stale=True)
            if stale is not None:
                self.stale_hits += 1
                return stale, 'stale'
            raise

    async def remember(self, key, loader, ttl):
        cached = self.get(key)
        if cached is not None:
            self.hits += 1
            return cached, 'hit'
        task = self.flights.get(key)
        if task is None:
            if len(self.flights) >= 100:
                raise CacheBusy("Too many pending provider lookups")
            self.misses += 1
            task = asyncio.create_task(self._load(key, loader, ttl))
            self.flights[key] = task
            def finished(done):
                self.flights.pop(key, None)
                if not done.cancelled():
                    done.exception()  # Retrieve errors even if every waiter disconnected.
            task.add_done_callback(finished)
        return await asyncio.shield(task)

    def close(self):
        self.db.close()
