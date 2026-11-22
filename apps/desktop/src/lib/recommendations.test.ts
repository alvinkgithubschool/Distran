import { describe, expect, it } from 'vitest';
import { canonicalWorkId } from './catalog';
import { recommend } from './recommendations';
import type { Log } from './store';
const log = (workId: string, rating: number): Log => ({
  id: workId,
  workId,
  rating,
  note: '',
  status: 'completed',
  visibility: 'private',
  date: '2026-11-16',
});
describe('local recommendation routing', () => {
  it('uses a curated fallback for empty and unknown profiles', () => {
    const cold = recommend({ favorites: [], logs: [] });
    expect(cold).toHaveLength(4);
    expect(cold.every((p) => p.reason === 'From the curated collection')).toBe(true);
    expect(recommend({ favorites: ['tmdb:movie:1'], logs: [] })).toEqual(cold);
  });
  it('excludes favourites, dislikes and all logged titles and respects format', () => {
    const account = { favorites: ['cyberpunk'], logs: [log('edgerunners', 1), log('arrival', 5)] };
    const picks = recommend(account, 'movie');
    expect(picks.length).toBeGreaterThan(0);
    expect(
      picks.every(
        (p) =>
          p.work.medium === 'movie' &&
          !['cyberpunk', 'edgerunners', 'arrival'].map(canonicalWorkId).includes(p.work.id),
      ),
    ).toBe(true);
    expect(picks.every((p) => Number.isFinite(p.score))).toBe(true);
  });
  it('does not count repeated logging as repeated positive evidence', () => {
    const a = { favorites: [], logs: [log('cyberpunk', 5)] };
    expect(recommend({ ...a, logs: [...a.logs, ...a.logs] })).toEqual(recommend(a));
  });
  it('returns unique, bounded, deterministic results', () => {
    const a = { favorites: ['outer-wilds'], logs: [] };
    const picks = recommend(a, 'all', 3);
    expect(picks).toHaveLength(3);
    expect(new Set(picks.map((p) => p.work.id)).size).toBe(3);
    expect(recommend(a, 'all', 3)).toEqual(picks);
    expect(recommend(a, 'all', 0)).toEqual([]);
  });
});
