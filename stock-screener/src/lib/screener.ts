import { prisma } from "@/lib/db";

export type ScreenerRow = {
  id: string;
  ticker: string;
  name: string;
  sector: string | null;
  country: string;
  marketCap: number | null;
  currency: string;
  overallScore: number | null;
  profitabilityScore: number | null;
  growthScore: number | null;
  financialHealthScore: number | null;
  dividendScore: number | null;
};

export type ScreenerSortKey = "name" | "ticker" | "sector" | "marketCap" | "overallScore";

export type ScreenerFilters = {
  country?: string;
  sector?: string;
  sort?: ScreenerSortKey;
  dir?: "asc" | "desc";
};

export async function getScreenerRows(filters: ScreenerFilters): Promise<ScreenerRow[]> {
  const companies = await prisma.company.findMany({
    where: {
      ...(filters.country ? { country: filters.country as "SG" | "US" } : {}),
      ...(filters.sector ? { sector: filters.sector } : {}),
    },
    include: {
      scores: {
        orderBy: { asOfDate: "desc" },
        take: 1,
      },
    },
  });

  const rows: ScreenerRow[] = companies.map((c) => {
    const score = c.scores[0];
    return {
      id: c.id,
      ticker: c.ticker,
      name: c.name,
      sector: c.sector,
      country: c.country,
      marketCap: c.marketCap?.toNumber() ?? null,
      currency: c.currency,
      overallScore: score?.overallScore?.toNumber() ?? null,
      profitabilityScore: score?.profitabilityScore?.toNumber() ?? null,
      growthScore: score?.growthScore?.toNumber() ?? null,
      financialHealthScore: score?.financialHealthScore?.toNumber() ?? null,
      dividendScore: score?.dividendScore?.toNumber() ?? null,
    };
  });

  const sortKey = filters.sort ?? "overallScore";
  const dir = filters.dir === "asc" ? 1 : -1;

  rows.sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;
    if (typeof av === "string" || typeof bv === "string") {
      return dir * String(av).localeCompare(String(bv));
    }
    return dir * ((av as number) - (bv as number));
  });

  return rows;
}

export async function getDistinctSectors(): Promise<string[]> {
  const companies = await prisma.company.findMany({
    where: { sector: { not: null } },
    select: { sector: true },
    distinct: ["sector"],
  });
  return companies.map((c) => c.sector!).sort();
}
