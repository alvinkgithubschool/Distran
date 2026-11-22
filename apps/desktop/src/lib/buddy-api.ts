import { catalogApiUrl } from './catalog-api';
import { registerWorks } from './catalog';
import type { Medium, Work } from './catalog';
export type BuddyContext = {
  theme: string;
  medium: Medium | 'all';
  max_minutes: number | null;
  work_ids: string[];
};
export type BuddyTurn = { role: 'user' | 'assistant'; content: string };
export type BuddyResult = {
  reply: string;
  items: { work: Work; reason: string; evidence: string; score: number }[];
  route: string;
  model: string | null;
  degraded: boolean;
  free_only: boolean;
  medium?: Medium | 'all';
  context?: BuddyContext;
  catalog_size?: number;
  discovery?: {
    scope: 'live_catalog' | 'cached_catalog' | 'conversation';
    providers: string[];
    candidate_count: number;
    errors: { provider: string; code: string }[];
  };
};
export type BuddyInput = {
  mode: 'recommendations' | 'chat';
  prompt: string;
  refinement: string;
  medium: Medium | 'all';
  exclude_ids: string[];
  max_minutes: number | null;
  context?: BuddyContext;
  history?: BuddyTurn[];
};
export async function askBuddy(input: BuddyInput, signal: AbortSignal): Promise<BuddyResult> {
  if (!catalogApiUrl) throw Error('Start the catalog backend to use Buddy.');
  const response = await fetch(catalogApiUrl + '/buddy/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal: AbortSignal.any([signal, AbortSignal.timeout(120000)]),
  });
  if (!response.ok)
    throw Error(
      response.status === 429
        ? 'Buddy is busy. Try again shortly.'
        : 'Buddy is unavailable. Check that the backend is running and enabled.',
    );
  const result = (await response.json()) as BuddyResult;
  registerWorks(result.items.map((pick) => pick.work));
  return result;
}
