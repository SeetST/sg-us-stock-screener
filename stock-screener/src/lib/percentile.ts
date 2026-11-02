// Shared percentile-rank and sector-peer-group helpers, used by both the
// MVP composite scorer (src/lib/scoring.ts) and the Quality Compounder Score
// (src/lib/quality-score.ts).

/** Percentile rank of `value` within `population` (0-100, ties get the average rank). */
export function percentileRank(value: number | null, population: (number | null)[]): number | null {
  if (value === null) return null;
  const valid = population.filter((v): v is number => v !== null);
  if (valid.length === 0) return null;

  const below = valid.filter((v) => v < value).length;
  const equal = valid.filter((v) => v === value).length;
  return ((below + equal / 2) / valid.length) * 100;
}

/**
 * Groups items by sector, returning a `peerGroupFor` function that returns a
 * company's same-sector peers, falling back to the full universe if the
 * company has no sector or its sector has fewer than 2 members.
 */
export function buildPeerGroups<T extends { sector: string | null }>(items: T[]): {
  peerGroupFor: (item: T) => T[];
} {
  const bySector = new Map<string, T[]>();
  for (const item of items) {
    const key = item.sector ?? "__none__";
    if (!bySector.has(key)) bySector.set(key, []);
    bySector.get(key)!.push(item);
  }

  const peerGroupFor = (item: T): T[] => {
    const peers = bySector.get(item.sector ?? "__none__") ?? [];
    return peers.length > 1 ? peers : items;
  };

  return { peerGroupFor };
}

export function average(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return null;
  return valid.reduce((sum, v) => sum + v, 0) / valid.length;
}
