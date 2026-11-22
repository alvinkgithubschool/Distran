import artifact from './catalog-model.json';
import { catalog, getWork, canonicalWorkId } from './catalog';
import type { Medium, Work } from './catalog';
import type { Account } from './store';

export type Recommendation = { work: Work; reason: string; score: number };
export const recommendationModelId = artifact.model_id;
const dot = (a: number[], b: number[]) => a.reduce((sum, x, i) => sum + x * b[i], 0);
const normalize = (v: number[]) => {
  const norm = Math.hypot(...v);
  return norm > 0 ? v.map((x) => x / norm) : v;
};

/** Local inference: account history never leaves the device. Unknown live IDs are ignored. */
export function recommend(
  account: Pick<Account, 'favorites' | 'logs'>,
  medium: Medium | 'all' = 'all',
  limit = 4,
): Recommendation[] {
  const dimensions = artifact.vectors[0]?.length ?? 0;
  const compatible =
    artifact.schema === 1 &&
    dimensions > 0 &&
    artifact.items.length === artifact.vectors.length &&
    new Set(artifact.items).size === artifact.items.length &&
    artifact.items.every((id) => catalog.some((w) => w.id === id)) &&
    artifact.vectors.every((v) => v.length === dimensions && v.every(Number.isFinite));
  const excluded = new Set(
    [...account.favorites, ...account.logs.map((l) => l.workId)].map(canonicalWorkId),
  );
  const fallback = () =>
    catalog
      .filter((w) => !excluded.has(w.id) && (medium === 'all' || w.medium === medium))
      .slice(0, Math.max(0, limit))
      .map((work) => ({ work, reason: 'From the curated collection', score: 0 }));
  if (!compatible) return fallback();
  const weights = new Map<string, number>();
  account.favorites.forEach((id, rank) => weights.set(canonicalWorkId(id), 2 / (1 + rank / 4)));
  // One signal per work: repeated logs must not amplify a preference arbitrarily.
  const latest = new Map<string, Account['logs'][number]>();
  for (const original of account.logs) {
    const log = { ...original, workId: canonicalWorkId(original.workId) };
    if (!latest.has(log.workId) || log.date > latest.get(log.workId)!.date)
      latest.set(log.workId, log);
  }
  for (const log of latest.values()) {
    if (log.rating > 0 && log.rating <= 2) weights.set(log.workId, -1);
    else if (log.rating >= 4) weights.set(log.workId, Math.max(weights.get(log.workId) ?? 0, 1));
  }
  const positive = Array<number>(dimensions).fill(0);
  const negative = Array<number>(dimensions).fill(0);
  const seeds: { id: string; vector: number[] }[] = [];
  artifact.items.forEach((id, i) => {
    const weight = weights.get(id) ?? 0;
    if (weight > 0) seeds.push({ id, vector: artifact.vectors[i] });
    const target = weight > 0 ? positive : negative;
    artifact.vectors[i].forEach((v, j) => {
      target[j] += Math.abs(weight) * v;
    });
  });
  if (!seeds.length) return fallback();
  const profile = normalize(positive),
    dislikes = normalize(negative);
  const candidates = artifact.items.flatMap((id, i) => {
    const work = getWork(id);
    if (!work || excluded.has(id) || (medium !== 'all' && work.medium !== medium)) return [];
    const vector = artifact.vectors[i];
    const nearest = [...seeds].sort((a, b) => dot(b.vector, vector) - dot(a.vector, vector))[0];
    return [
      {
        work,
        vector,
        reason: `Similar themes to ${getWork(nearest.id)?.title ?? 'your favourites'}`,
        score: dot(profile, vector) - 0.5 * Math.max(0, dot(dislikes, vector)),
      },
    ];
  });
  const selected: typeof candidates = [];
  while (selected.length < Math.max(0, limit) && candidates.length) {
    // MMR reduces redundant picks without claiming verified graph relationships.
    const utility = (c: (typeof candidates)[number]) =>
      0.85 * c.score - 0.15 * Math.max(0, ...selected.map((s) => dot(c.vector, s.vector)));
    candidates.sort((a, b) => utility(b) - utility(a) || a.work.id.localeCompare(b.work.id));
    selected.push(candidates.shift()!);
  }
  return selected.map(({ work, reason, score }) => ({ work, reason, score }));
}
