import { knownWorks } from './catalog';
import type { Work } from './catalog';
import type { Account, Database } from './store';
export type Creator = {
  id: string;
  name: string;
  image?: string;
  kind: string;
  bio?: string;
  provider?: string;
  sourceUrl?: string;
  role?: string;
};
export type CreatorResult = {
  items: Creator[];
  hasMore: boolean;
  status: string;
  errors: { provider: string; code: string }[];
};
export type CreatorDetail = { creator: Creator; works: Work[]; cache: string };
export function isProviderCreator(id: string) {
  return /^(tmdb:person|igdb:company):[1-9]\d{0,9}$/.test(id);
}
export function publicCreators(db: Database): Account[] {
  return db.accounts.filter(
    (a) => a.role === 'creator' && (!a.settings.privateProfile || a.id === db.activeId),
  );
}
export function creditedWorks(identity: string) {
  const normalized = identity.toLowerCase().trim();
  return knownWorks().filter((work) =>
    isProviderCreator(identity)
      ? work.creators?.some((c) => c.id === identity) ||
        work.credits?.some((c) => c.id === identity)
      : work.maker.split(',').some((part) => part.trim().toLowerCase() === normalized) ||
        work.credits?.some((c) => c.name.toLowerCase() === normalized),
  );
}
export function localDirectory(): Creator[] {
  const creators = new Map<string, Creator>();
  for (const work of knownWorks()) {
    if (work.creators?.length) {
      for (const creator of work.creators)
        creators.set(creator.id, {
          ...creator,
          kind:
            creator.role || work.creatorRole || (work.medium === 'game' ? 'Studio' : 'Director'),
        });
    } else {
      for (const name of work.maker.split(',')) {
        const value = name.trim();
        if (value && value !== 'See title details')
          creators.set(value, { id: value, name: value, kind: 'Catalog creator' });
      }
    }
  }
  return [...creators.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function catalogCreator(identity: string): Creator | undefined {
  const entries = new Map<string, Creator>();
  for (const work of knownWorks())
    for (const credit of [...(work.creators ?? []), ...(work.credits ?? [])]) {
      if (!credit.id) continue;
      if (credit.id !== identity && credit.name.toLowerCase() !== identity.toLowerCase()) continue;
      if (entries.has(credit.id)) continue;
      const provider = credit.id.startsWith('tmdb:') ? 'tmdb' : 'igdb';
      const number = credit.id.split(':')[2];
      entries.set(credit.id, {
        id: credit.id,
        name: credit.name,
        kind: credit.role || 'Creator',
        provider,
        sourceUrl: provider === 'tmdb' ? `https://www.themoviedb.org/person/${number}` : undefined,
      });
    }
  return entries.get(identity) ?? (entries.size === 1 ? [...entries.values()][0] : undefined);
}
