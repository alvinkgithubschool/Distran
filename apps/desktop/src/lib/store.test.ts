import { registerWorks, getWork, canonicalWorkId } from './catalog';
import { describe, it, expect } from 'vitest';
import {
  freshDatabase,
  authenticate,
  createAccount,
  DEMO_PASSWORD,
  loadDatabase,
  saveDatabase,
  replaceAccount,
  addLog,
  toggleFavorite,
  validateShelf,
  STORE_KEY,
} from './store';
import { searchCatalog } from './catalog';
import type { Log, Database } from './store';
const log: Log = {
  id: 'one',
  workId: 'dune',
  rating: 4.5,
  note: 'The desert remembers.',
  status: 'completed',
  visibility: 'private',
  date: '2026-11-07',
};
function memoryStorage() {
  const entries = new Map<string, string>();
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => {
      entries.set(key, value);
    },
  };
}
describe('local preview accounts', () => {
  it('rejects incorrect credentials and disables fixtures when demo mode is off', async () => {
    await expect(authenticate(freshDatabase(), 'user@distran.test', 'wrong', true)).rejects.toThrow(
      'incorrect',
    );
    await expect(
      authenticate(freshDatabase(), 'user@distran.test', DEMO_PASSWORD, false),
    ).rejects.toThrow('not configured');
  });
  it('restores the active session and per-account ledger from persisted storage', async () => {
    const storage = memoryStorage();
    let db: Database = await authenticate(
      freshDatabase(),
      ' USER@DISTRAN.TEST ',
      DEMO_PASSWORD,
      true,
    );
    const user = db.accounts[0];
    db = replaceAccount(db, addLog(user, log));
    saveDatabase(db, storage);
    const restored = loadDatabase(storage);
    expect(restored.activeId).toBe(user.id);
    expect(restored.accounts[0].logs[0].rating).toBe(4.5);
    expect(restored.accounts[1].logs).toHaveLength(0);
  });
  it('keeps saved memories through sign-out and switching accounts', async () => {
    let db = freshDatabase();
    db = replaceAccount(db, addLog(db.accounts[0], log));
    db = await authenticate(db, 'creator@distran.test', DEMO_PASSWORD, true);
    expect(db.accounts.find((a) => a.id === db.activeId)?.logs).toHaveLength(0);
    db = { ...db, activeId: null };
    db = await authenticate(db, 'user@distran.test', DEMO_PASSWORD, true);
    expect(db.accounts.find((a) => a.id === db.activeId)?.logs[0].note).toContain('desert');
  });
  it('hashes local signup passwords and authenticates them without plaintext storage', async () => {
    const db = await createAccount(
      freshDatabase(),
      'new@example.test',
      'MyLocalPassword!',
      'New explorer',
      'user',
      true,
    );
    const account = db.accounts.at(-1)!;
    expect(account.passwordHash).toHaveLength(64);
    expect(JSON.stringify(db)).not.toContain('MyLocalPassword!');
    expect(
      (await authenticate({ ...db, activeId: null }, 'new@example.test', 'MyLocalPassword!', true))
        .activeId,
    ).toBe(account.id);
    await expect(
      createAccount(db, 'new@example.test', 'MyLocalPassword!', 'Copy', 'user', true),
    ).rejects.toThrow('already');
  });
  it('recovers corrupt storage and rejects invalid stale active sessions', () => {
    const storage = memoryStorage();
    storage.setItem(STORE_KEY, '{bad');
    expect(loadDatabase(storage).activeId).toBeNull();
    const db = freshDatabase();
    db.activeId = 'missing';
    saveDatabase(db, storage);
    expect(loadDatabase(storage).activeId).toBeNull();
  });
  it('surfaces storage failures instead of pretending a save worked', () => {
    expect(() =>
      saveDatabase(freshDatabase(), {
        setItem: () => {
          throw Error('Storage full');
        },
      }),
    ).toThrow('Storage full');
  });
});
describe('ledger and taste constraints', () => {
  it('accepts half-star ratings and rejects invalid ratings and unknown works', () => {
    const account = freshDatabase().accounts[0];
    expect(addLog(account, log).logs[0].rating).toBe(4.5);
    expect(() => addLog(account, { ...log, rating: 4.2 })).toThrow('half-star');
    expect(() => addLog(account, { ...log, workId: 'missing' })).toThrow('catalog');
  });
  it('enforces a unique ordered Top 4 per medium', () => {
    let account = freshDatabase().accounts[0];
    expect(() => toggleFavorite(account, 'disco-elysium')).toThrow('full');
    account = toggleFavorite(account, 'cyberpunk');
    account = toggleFavorite(account, 'disco-elysium');
    expect(account.favorites.filter((id) => id === canonicalWorkId('disco-elysium'))).toHaveLength(
      1,
    );
    expect(account.favorites.at(-1)).toBe(canonicalWorkId('disco-elysium'));
  });
  it('supports cross-media collections and rejects duplicates', () => {
    expect(() =>
      validateShelf({
        id: 'mixed',
        title: 'Night City',
        description: '',
        visibility: 'private',
        workIds: ['cyberpunk', 'blade-runner', 'edgerunners'],
      }),
    ).not.toThrow();
    expect(() =>
      validateShelf({
        id: 'mixed',
        title: 'Night City',
        description: '',
        visibility: 'private',
        workIds: ['cyberpunk', 'cyberpunk'],
      }),
    ).toThrow('unique');
  });
  it('searches across titles, makers, moods and format filters', () => {
    expect(searchCatalog('cyberpunk').length).toBeGreaterThan(1);
    expect(searchCatalog('Denis Villeneuve', 'movie')).toHaveLength(3);
    expect(searchCatalog('mystery', 'game').map((w) => w.id)).toEqual([
      canonicalWorkId('outer-wilds'),
    ]);
    expect(searchCatalog('no such work')).toHaveLength(0);
  });
});

it('persists provider metadata snapshots with saved user works', () => {
  const work = {
    id: 'tmdb:movie:999999',
    title: 'A saved live title',
    medium: 'movie' as const,
    year: 2024,
    image: '',
    color: '#abc',
    maker: 'Maker',
    publisher: 'Studio',
    description: 'Description',
    tags: [],
    rating: '4.0',
    duration: '2h',
    related: [],
    provider: 'tmdb' as const,
    sourceUrl: 'https://www.themoviedb.org/movie/999999',
  };
  registerWorks([work]);
  const db = freshDatabase();
  db.accounts[0] = addLog(db.accounts[0], { ...log, workId: work.id });
  const storage = memoryStorage();
  saveDatabase(db, storage);
  const restored = loadDatabase(storage);
  expect(restored.works?.[work.id].title).toBe('A saved live title');
  expect(getWork(restored.accounts[0].logs[0].workId)?.maker).toBe('Maker');
});

describe('creator claims and profile identity', () => {
  it('keeps claims pending, validates evidence and prevents duplicate or user claims', async () => {
    const { requestClaim } = await import('./store');
    const creator = freshDatabase().accounts[1];
    const input = {
      workId: 'dune',
      credit: 'Producer',
      evidence: 'https://example.com/credits',
      note: 'A production credit.',
    };
    const result = requestClaim(creator, input);
    expect(result.claims?.[0].status).toBe('pending');
    expect(() => requestClaim(result, input)).toThrow(/already/);
    expect(() => requestClaim(freshDatabase().accounts[0], input)).toThrow(/creator account/);
    expect(() => requestClaim(creator, { ...input, evidence: 'javascript:alert(1)' })).toThrow(
      /http/,
    );
    expect(() => requestClaim(creator, { ...input, credit: '' })).toThrow(/credited role/);
    const injected = requestClaim(creator, { ...input, status: 'verified' } as typeof input);
    expect(injected.claims?.[0].status).toBe('pending');
  });
  it('enforces unique usernames and preserves creator fields and claimed live metadata', async () => {
    const { requestClaim } = await import('./store');
    const db = freshDatabase();
    expect(() => replaceAccount(db, { ...db.accounts[1], handle: 'alex' })).toThrow(/taken/);
    expect(() => replaceAccount(db, { ...db.accounts[1], handle: 'A bad name' })).toThrow(
      /username/,
    );
    registerWorks([{ ...getWork('dune')!, id: 'tmdb:movie:888', provider: 'tmdb' }]);
    const creator = requestClaim(
      {
        ...db.accounts[1],
        avatar: 'data:image/jpeg;base64,preview',
        banner: 'data:image/jpeg;base64,banner',
        accent: '#c4a1dd',
        headline: 'New worlds',
        featuredWorks: ['dune'],
      },
      {
        workId: 'tmdb:movie:888',
        credit: 'Director',
        evidence: 'https://example.com/credits',
        note: '',
      },
    );
    const storage = memoryStorage();
    saveDatabase(replaceAccount(db, creator), storage);
    const loaded = loadDatabase(storage);
    expect(loaded.accounts[1].headline).toBe('New worlds');
    expect(loaded.accounts[1].claims?.[0].workId).toBe('tmdb:movie:888');
    expect(loaded.works?.['tmdb:movie:888']?.title).toContain('Dune');
  });
  it('does not expose private creator profiles or treat claims as provider credits', async () => {
    const { publicCreators, creditedWorks } = await import('./creators');
    const db = freshDatabase();
    db.accounts[1].settings.privateProfile = true;
    expect(publicCreators(db)).toHaveLength(0);
    db.activeId = db.accounts[1].id;
    expect(publicCreators(db)).toHaveLength(1);
    expect(creditedWorks('Night Room Studio')).toHaveLength(0);
    expect(creditedWorks('Denis Villeneuve').length).toBeGreaterThan(0);
  });
});

describe('provider identity migration', () => {
  it('migrates legacy IDs without losing logs, list provenance or pending claims', () => {
    const db = freshDatabase();
    db.accounts[0].favorites = ['cyberpunk', canonicalWorkId('cyberpunk'), 'dune'];
    db.accounts[0].logs = [
      { ...log, workId: 'dune' },
      { ...log, id: 'repeat', workId: 'dune' },
    ];
    db.accounts[0].lists = [
      {
        id: 'buddy-list',
        title: 'Night city',
        description: 'Kept intact',
        visibility: 'private',
        source: 'buddy',
        workIds: ['cyberpunk', canonicalWorkId('cyberpunk'), 'edgerunners'],
      },
    ];
    db.accounts[1].claims = [
      {
        id: 'pending',
        workId: 'dune',
        credit: 'Producer',
        evidence: 'https://example.com',
        note: 'Preserve evidence',
        status: 'pending',
        date: '2026-11-16',
      },
    ];
    const storage = memoryStorage();
    storage.setItem(STORE_KEY, JSON.stringify(db));
    const loaded = loadDatabase(storage);
    expect(loaded.accounts[0].favorites).toEqual([
      canonicalWorkId('cyberpunk'),
      canonicalWorkId('dune'),
    ]);
    expect(loaded.accounts[0].logs.map((l) => l.id)).toEqual(['one', 'repeat']);
    expect(loaded.accounts[0].logs.every((l) => l.workId === canonicalWorkId('dune'))).toBe(true);
    expect(loaded.accounts[0].lists[0]).toMatchObject({
      source: 'buddy',
      description: 'Kept intact',
      workIds: [canonicalWorkId('cyberpunk'), canonicalWorkId('edgerunners')],
    });
    expect(loaded.accounts[1].claims?.[0]).toMatchObject({
      workId: canonicalWorkId('dune'),
      status: 'pending',
      note: 'Preserve evidence',
    });
    saveDatabase(loaded, storage);
    expect(loadDatabase(storage).accounts).toEqual(loaded.accounts);
  });
  it('resolves old links to canonical works and rejects alias/canonical duplicates in lists', () => {
    expect(getWork('dune')?.id).toBe(canonicalWorkId('dune'));
    expect(getWork(canonicalWorkId('cyberpunk'))?.id).toBe(canonicalWorkId('cyberpunk'));
    expect(() =>
      validateShelf({
        id: 'duplicate',
        title: 'Duplicate',
        description: '',
        visibility: 'private',
        workIds: ['dune', canonicalWorkId('dune')],
      }),
    ).toThrow('unique');
  });
});
