export function formatMarketCap(value: number | null, currency: string): string {
  if (value === null) return "—";
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${currency} ${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${currency} ${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${currency} ${(value / 1e6).toFixed(2)}M`;
  return `${currency} ${value.toFixed(0)}`;
}

export function formatPercent(value: number | null, digits = 1): string {
  if (value === null) return "—";
  return `${value.toFixed(digits)}%`;
}

export function formatScore(value: number | null): string {
  if (value === null) return "—";
  return value.toFixed(0);
}

/** Tailwind classes for a score badge: green/amber/red by tier. */
export function scoreBadgeClass(value: number | null): string {
  if (value === null) return "bg-muted text-muted-foreground";
  if (value >= 70) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
  if (value >= 40) return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
  return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
}
