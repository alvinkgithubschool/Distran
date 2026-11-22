import { catalog, getWork, registerWorks, canonicalWorkId } from './catalog';
import type { Medium, Work } from './catalog';

export type Role = 'user' | 'creator';
export type Log = {
  id: string;
  workId: string;
  rating: number;
  note: string;
  status: 'completed' | 'active' | 'planned' | 'dropped';
  visibility: 'private' | 'friends' | 'public';
  date: string;
};
export type Shelf = {
  source?: 'buddy';
  id: string;
  title: string;
  description: string;
  visibility: 'private' | 'friends' | 'public';
  workIds: string[];
};
export type Message = { id: string; thread: string; text: string; date: string };
export type Claim = {
  id: string;
  workId: string;
  credit: string;
  evidence: string;
  note: string;
  status: 'pending';
  date: string;
};
export type Account = {
  id: string;
  email: string;
  name: string;
  handle: string;
  bio: string;
  role: Role;
  website?: string;
  avatar?: string;
  banner?: string;
  accent?: string;
  headline?: string;
  featuredWorks?: string[];
  claims?: Claim[];
  complete: boolean;
  interests: Medium[];
  favorites: string[];
  logs: Log[];
  lists: Shelf[];
  messages: Message[];
  followed: string[];
  followedCreatorNames?: Record<string, string>;
  settings: { privateProfile: boolean; notifications: boolean };
  passwordHash?: string;
  salt?: string;
};
export type Database = {
  works?: Record<string, Work>;
  version: 1;
  activeId: string | null;
  accounts: Account[];
};
export const STORE_KEY = 'distran.tauri.preview.v1';
export const DEMO_PASSWORD = 'DistranDemo2026!';
export const demoEnabled = import.meta.env.VITE_DEMO_MODE === 'true';
const seedLists = (): Shelf[] => [
  {
    id: 'night-city',
    title: 'Night City Cycle',
    description: 'Different lives. The same neon heartbeat.',
    visibility: 'private',
    workIds: ['cyberpunk', 'edgerunners', 'blade-runner', 'disco-elysium'],
  },
  {
    id: 'beyond-the-signal',
    title: 'Somewhere beyond the signal',
    description: 'For when you want to feel very small, in the best way.',
    visibility: 'private',
    workIds: ['outer-wilds', 'arrival', 'dune'],
  },
  {
    id: 'co-op',
    title: 'Better with a second player',
    description: 'A little chaos. A lot of company.',
    visibility: 'friends',
    workIds: ['it-takes-two', 'baldurs-gate'],
  },
];
function makeAccount(email: string, name: string, role: Role): Account {
  return {
    id: email,
    email,
    name,
    handle: role === 'creator' ? 'nightroom' : 'alex',
    bio:
      role === 'creator'
        ? 'Independent stories. Unexpected worlds.'
        : 'Cyberpunk lifer, corridor-horror apologist, and keeper of too many lists.',
    role,
    complete: false,
    interests: ['game', 'movie', 'tv'],
    favorites: [
      'cyberpunk',
      'elden-ring',
      'it-takes-two',
      'outer-wilds',
      'blade-runner',
      'dune',
      'arrival',
    ],
    logs: [],
    lists: seedLists(),
    messages: [],
    followed: ['CD PROJEKT RED', 'Studio Trigger', 'Denis Villeneuve'],
    settings: { privateProfile: false, notifications: true },
  };
}
export function freshDatabase(): Database {
  return {
    version: 1,
    activeId: null,
    accounts: [
      normalizeAccountWorks(makeAccount('user@distran.test', 'Alex', 'user')),
      normalizeAccountWorks(makeAccount('creator@distran.test', 'Night Room Studio', 'creator')),
    ],
  };
}
export function normalizeAccountWorks(account: Account): Account {
  const ids = (values: string[]) => [...new Set(values.map(canonicalWorkId))];
  return {
    ...account,
    favorites: ids(account.favorites),
    logs: account.logs.map((log) => ({ ...log, workId: canonicalWorkId(log.workId) })),
    lists: account.lists.map((list) => ({ ...list, workIds: ids(list.workIds) })),
    ...(account.claims
      ? {
          claims: account.claims.map((claim) => ({
            ...claim,
            workId: canonicalWorkId(claim.workId),
          })),
        }
      : {}),
    ...(account.featuredWorks ? { featuredWorks: ids(account.featuredWorks) } : {}),
  };
}
export function loadDatabase(storage: Pick<Storage, 'getItem'> = localStorage): Database {
  try {
    const raw = storage.getItem(STORE_KEY);
    if (!raw) return freshDatabase();
    const data = JSON.parse(raw) as Database;
    if (
      data.version !== 1 ||
      !Array.isArray(data.accounts) ||
      data.accounts.some(
        (a) =>
          typeof a.id !== 'string' ||
          !Array.isArray(a.logs) ||
          !Array.isArray(a.lists) ||
          !Array.isArray(a.favorites) ||
          !a.settings,
      )
    )
      return freshDatabase();
    registerWorks(Object.values(data.works ?? {}), 'saved');
    data.accounts = data.accounts.map(normalizeAccountWorks);
    if (!data.accounts.some((a) => a.id === data.activeId)) data.activeId = null;
    return data;
  } catch {
    return freshDatabase();
  }
}
export function saveDatabase(db: Database, storage: Pick<Storage, 'setItem'> = localStorage) {
  const ids = new Set(
    db.accounts.flatMap((a) => [
      ...a.logs.map((l) => l.workId),
      ...a.favorites,
      ...(a.claims ?? []).map((claim) => claim.workId),
      ...(a.featuredWorks ?? []),
      ...a.lists.flatMap((l) => l.workIds),
    ]),
  );
  const works = Object.fromEntries(
    [...ids]
      .map((id) => [id, getWork(id)])
      .filter(([, work]) => !!(work as Work | undefined)?.provider),
  );
  storage.setItem(STORE_KEY, JSON.stringify({ ...db, works }));
}
export function replaceAccount(db: Database, account: Account): Database {
  if (!account.name.trim() || account.name.length > 60)
    throw Error('Use a name between 1 and 60 characters.');
  if (!/^[a-z0-9_]{3,24}$/.test(account.handle))
    throw Error('Use 3–24 lowercase letters, numbers or underscores for your username.');
  if (
    db.accounts.some(
      (a) => a.id !== account.id && a.handle.toLowerCase() === account.handle.toLowerCase(),
    )
  )
    throw Error('That username is already taken.');
  return {
    ...db,
    accounts: db.accounts.map((a) => (a.id === account.id ? normalizeAccountWorks(account) : a)),
  };
}
export function validateLog(log: Log) {
  if (!getWork(log.workId)) throw Error('Choose a title from the catalog.');
  if (
    !Number.isFinite(log.rating) ||
    log.rating < 0 ||
    log.rating > 5 ||
    (log.rating * 2) % 1 !== 0
  )
    throw Error('Choose a rating in half-star steps.');
  if (!['completed', 'active', 'planned', 'dropped'].includes(log.status))
    throw Error('Choose a valid status.');
  if (!['private', 'friends', 'public'].includes(log.visibility))
    throw Error('Choose a valid visibility.');
  if (!log.date || Number.isNaN(Date.parse(log.date))) throw Error('Choose a valid date.');
  if (log.note.length > 4000) throw Error('Keep notes under 4,000 characters.');
}
export function addLog(account: Account, log: Log): Account {
  log = { ...log, workId: canonicalWorkId(log.workId) };
  validateLog(log);
  return { ...account, logs: [log, ...account.logs] };
}
export function toggleFavorite(account: Account, workId: string): Account {
  workId = canonicalWorkId(workId);
  account = normalizeAccountWorks(account);
  const work = getWork(workId);
  if (!work) return account;
  if (account.favorites.includes(workId))
    return { ...account, favorites: account.favorites.filter((id) => id !== workId) };
  if (account.favorites.filter((id) => getWork(id)?.medium === work.medium).length >= 4)
    throw Error('Your Top 4 is full for this format. Remove one first.');
  return { ...account, favorites: [...account.favorites, workId] };
}
export function validateShelf(shelf: Shelf) {
  if (!shelf.title.trim()) throw Error('Give your list a name.');
  if (shelf.title.length > 100) throw Error('Keep the list name under 100 characters.');
  if (shelf.description.length > 1000) throw Error('Keep the description under 1,000 characters.');
  if (!['private', 'friends', 'public'].includes(shelf.visibility))
    throw Error('Choose a valid visibility.');
  if (
    shelf.workIds.some((id) => !getWork(id)) ||
    new Set(shelf.workIds.map(canonicalWorkId)).size !== shelf.workIds.length
  )
    throw Error('A list must contain unique catalog titles.');
}
async function passwordHash(password: string, salt: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' },
    key,
    256,
  );
  return Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, '0')).join('');
}
export async function authenticate(
  db: Database,
  email: string,
  password: string,
  allowDemo = demoEnabled,
) {
  if (!allowDemo) throw Error('Hosted sign-in is not configured in this build.');
  const account = db.accounts.find((a) => a.email === email.trim().toLowerCase());
  if (!account) throw Error('Email or password is incorrect.');
  const valid =
    account.passwordHash && account.salt
      ? (await passwordHash(password, account.salt)) === account.passwordHash
      : password === DEMO_PASSWORD;
  if (!valid) throw Error('Email or password is incorrect.');
  return { ...db, activeId: account.id };
}
export async function createAccount(
  db: Database,
  email: string,
  password: string,
  name: string,
  role: Role,
  allowDemo = demoEnabled,
) {
  if (!allowDemo) throw Error('Hosted account creation is not configured in this build.');
  email = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw Error('Enter a valid email address.');
  if (!name.trim()) throw Error('Tell us your name.');
  if (password.length < 8) throw Error('Use at least 8 characters for your password.');
  if (db.accounts.some((a) => a.email === email))
    throw Error('That email already has a local account. Try signing in.');
  const salt = crypto.randomUUID();
  const account = normalizeAccountWorks(makeAccount(email, name.trim(), role));
  account.id = crypto.randomUUID();
  account.handle =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20) || 'explorer';
  if (account.handle.length < 3) account.handle += '_room';
  const baseHandle = account.handle;
  let suffix = 1;
  while (db.accounts.some((a) => a.handle === account.handle))
    account.handle = baseHandle + suffix++;
  account.passwordHash = await passwordHash(password, salt);
  account.salt = salt;
  account.lists = [];
  account.favorites = [];
  return { ...db, activeId: account.id, accounts: [...db.accounts, account] };
}
export const uniqueId = () => crypto.randomUUID();
export const catalogSize = catalog.length;

export function requestClaim(
  account: Account,
  input: Pick<Claim, 'workId' | 'credit' | 'evidence' | 'note'>,
): Account {
  input = { ...input, workId: canonicalWorkId(input.workId) };
  if (account.role !== 'creator') throw Error('Use a creator account to request a claim.');
  if (!getWork(input.workId)) throw Error('Choose a title from the catalog.');
  if ((account.claims ?? []).some((c) => c.workId === input.workId))
    throw Error('You already have a request for this title.');
  if (!input.credit.trim() || input.credit.length > 100)
    throw Error('Tell us your credited role (up to 100 characters).');
  let url: URL;
  try {
    url = new URL(input.evidence);
  } catch {
    throw Error('Add a public credit or official website URL.');
  }
  if (!['https:', 'http:'].includes(url.protocol) || input.evidence.length > 1000)
    throw Error('Use a public http or https evidence link.');
  if (input.note.length > 2000) throw Error('Keep your note under 2,000 characters.');
  return {
    ...account,
    claims: [
      ...(account.claims ?? []),
      {
        ...input,
        credit: input.credit.trim(),
        id: uniqueId(),
        status: 'pending',
        date: new Date().toISOString(),
      },
    ],
  };
}
