/**
 * Deterministic verse of the day: the same date always gives the same verse,
 * and consecutive days walk through the whole list before repeating.
 * `dateKey` is the user's local day (`YYYY-MM-DD`).
 */
export function pickVerseIndex(dateKey: string, count: number): number {
  if (count <= 0) return 0;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return 0;
  const day = Math.floor(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / 86_400_000);
  return ((day % count) + count) % count;
}
