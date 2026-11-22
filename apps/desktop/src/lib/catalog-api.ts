import { registerWorks } from './catalog';
import type { Medium, Work } from './catalog';
export const catalogApiUrl = (import.meta.env.VITE_CATALOG_API_URL ?? '').replace(/\/$/, '');
export type SearchResult = {
  items: Work[];
  page: number;
  hasMore: boolean;
  status: 'ok' | 'partial' | 'unavailable';
  providers: Record<string, { cache: string }>;
  errors: { provider: string; code: string }[];
};
export type WorkDetail = { work: Work; related: Work[]; cache: string };
const responses = new Map<string, { expires: number; value: unknown }>();
export function invalidateCatalogResponses() {
  responses.clear();
}
async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  if (!catalogApiUrl) throw Error('Live catalog is not configured.');
  const cached = responses.get(path);
  if (cached && cached.expires > Date.now()) return cached.value as T;
  const response = await fetch(catalogApiUrl + path, {
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(20000)])
      : AbortSignal.timeout(20000),
    headers: { Accept: 'application/json' },
  });
  if (!response.ok)
    throw Error(
      response.status === 404
        ? 'This title is no longer available from the provider.'
        : 'Live catalog is temporarily unavailable.',
    );
  const value = (await response.json()) as T;
  if (responses.size >= 100) responses.delete(responses.keys().next().value!);
  responses.set(path, { value, expires: Date.now() + 60000 });
  return value;
}
export async function searchLiveCatalog(
  query: string,
  medium: Medium | 'all',
  page: number,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({ q: query.trim(), medium, page: String(page) });
  const result = await request<SearchResult>('/catalog/search?' + params, signal);
  registerWorks(result.items);
  return result;
}
export async function fetchWork(id: string, signal?: AbortSignal) {
  const result = await request<WorkDetail>('/works/' + encodeURIComponent(id), signal);
  registerWorks([result.work, ...result.related]);
  return result;
}

export async function searchCreators(query: string, page: number, signal?: AbortSignal) {
  return request<import('./creators').CreatorResult>(
    '/creators/search?' + new URLSearchParams({ q: query.trim(), page: String(page) }),
    signal,
  );
}
export async function fetchCreator(id: string, signal?: AbortSignal) {
  const value = await request<import('./creators').CreatorDetail>(
    '/creators/' + encodeURIComponent(id),
    signal,
  );
  registerWorks(value.works);
  return value;
}

export async function fetchBuiltinCatalog(signal?: AbortSignal) {
  const result = await request<{ items: Work[]; source: string }>('/catalog/builtins', signal);
  registerWorks(result.items);
  return result;
}
