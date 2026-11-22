"""Reviewed built-in works in the preview's existing SQLite database."""
from datetime import datetime,timezone
import json
from .config import BACKEND_ROOT

class CanonicalCatalog:
    def __init__(self, database):
        self.db=database
        self.db.execute('CREATE TABLE IF NOT EXISTS canonical_works(id TEXT PRIMARY KEY, metadata TEXT NOT NULL, updated_at TEXT NOT NULL)')
        self.db.execute('CREATE TABLE IF NOT EXISTS work_aliases(alias TEXT PRIMARY KEY, work_id TEXT NOT NULL)')
        registry=json.loads((BACKEND_ROOT/'models/catalog-registry.json').read_text())
        self.aliases=registry['aliases']
        self.ids=list(self.aliases.values())
        for work in json.loads((BACKEND_ROOT/'models/catalog.json').read_text()):
            stamp=work.get('metadataFetchedAt','')
            self.db.execute('INSERT INTO canonical_works VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET metadata=excluded.metadata,updated_at=excluded.updated_at WHERE excluded.updated_at>canonical_works.updated_at',
                            (work['id'],json.dumps(work),stamp))
        self.db.executemany('INSERT OR REPLACE INTO work_aliases VALUES(?,?)',self.aliases.items())
        self.db.commit()

    def builtins(self):
        rows=dict(self.db.execute('SELECT id,metadata FROM canonical_works').fetchall())
        return {'items':[json.loads(rows[i]) for i in self.ids if i in rows], 'aliases':self.aliases,'source':'canonical_sqlite'}

    def update(self, work):
        row=self.db.execute('SELECT metadata FROM canonical_works WHERE id=?',(work['id'],)).fetchone()
        previous=json.loads(row[0]) if row else {}
        local={k:previous[k] for k in ('fallbackImage','themes','editorialRelated') if k in previous}
        merged={**local,**work,'metadataFetchedAt':datetime.now(timezone.utc).isoformat()}
        self.db.execute('INSERT OR REPLACE INTO canonical_works VALUES(?,?,?)',(work['id'],json.dumps(merged),merged['metadataFetchedAt']))
        self.db.commit()
        return merged

    def known(self, limit=1000):
        """Previously resolved public works, including live discoveries; not the homepage selection."""
        return [json.loads(row[0]) for row in self.db.execute('SELECT metadata FROM canonical_works ORDER BY updated_at DESC LIMIT ?', (limit,))]

    def remember(self, work):
        """Search summaries must not erase resolved directors, studios or verified runtimes."""
        row=self.db.execute('SELECT metadata FROM canonical_works WHERE id=?',(work['id'],)).fetchone()
        if not row:return self.update(work)
        previous=json.loads(row[0])
        merged={**work,**previous}
        merged['themes']=list(dict.fromkeys(previous.get('themes',[])+work.get('themes',[])))
        if work.get('rating_count',0)>0:merged['rating_count']=work['rating_count']
        return self.update(merged)
