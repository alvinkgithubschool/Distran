import catalogData from './catalog-data.json' with { type: 'json' };
import catalogAliases from './catalog-aliases.json' with { type: 'json' };
export type Medium = 'game' | 'movie' | 'tv';
export type Work = {
  id: string;
  title: string;
  medium: Medium;
  year: number;
  image: string;
  color: string;
  maker: string;
  publisher: string;
  description: string;
  tags: string[];
  rating: string;
  duration: string;
  related: string[];
  provider?: 'tmdb' | 'igdb';
  sourceUrl?: string;
  credits?: { id?: string; name: string; role: string }[];
  creators?: { id: string; name: string; role?: string; episodeCount?: number }[];
  creatorRole?: string | null;
  themes?: string[];
  fallbackImage?: string;
  metadataFetchedAt?: string;
  editorialRelated?: string[];
  verified_duration_minutes?: number;
  platforms?: string[];
  franchises?: string[];
  relatedLabel?: string;
};
export const mediumNames: Record<Medium, string> = { game: 'Game', movie: 'Film', tv: 'Series' };
export const catalog: Work[] = catalogData as Work[];
const aliases: Record<string, string> = catalogAliases;
export const canonicalWorkId = (id: string) => aliases[id] ?? id;
const remoteWorks = new Map<string, Work>();
export const isRemoteId = (id: string) => /^(tmdb:(movie|tv)|igdb:game):[1-9]\d{0,9}$/.test(id);
export function registerWorks(works: Work[], source: 'live' | 'saved' = 'live') {
  for (const work of works) {
    if (
      isRemoteId(work.id) &&
      ['game', 'movie', 'tv'].includes(work.medium) &&
      typeof work.title === 'string'
    ) {
      const seed = catalog.find((w) => w.id === work.id);
      if (source === 'saved' && seed) continue;
      remoteWorks.set(work.id, { ...seed, ...work });
    }
  }
}
export const getWork = (id: string) =>
  remoteWorks.get(canonicalWorkId(id)) ?? catalog.find((work) => work.id === canonicalWorkId(id));
export const knownWorks = () => [
  ...new Map([...catalog, ...remoteWorks.values()].map((work) => [work.id, work])).values(),
];
export const cover = (work: Work) =>
  work.image.startsWith('https://') ? work.image : work.image ? `/artwork/${work.image}` : '';
export function searchCatalog(query: string, medium: Medium | 'all' = 'all') {
  const term = query.trim().toLowerCase();
  return catalog
    .map((work) => getWork(work.id) ?? work)
    .filter(
      (work) =>
        (medium === 'all' || work.medium === medium) &&
        `${work.title} ${work.maker} ${work.tags.join(' ')} ${(work.themes ?? []).join(' ')} ${work.description}`
          .toLowerCase()
          .includes(term),
    );
}
