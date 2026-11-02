// Phase 3 (MVP) scoring engine.
//
// The full plan allocates 25% to Valuation and 5% to Momentum, but those
// categories require indicators that aren't populated yet (see plan, Phase
// 1C). For the MVP, those weights are redistributed across the four
// categories backed by the 15 case-study indicators:
//
//   Profitability 35%, Growth 25%, Financial Health 20%, Dividend 20%
//
// All sub-scores are 0-100, computed as the indicator's percentile rank
// within its sector (companies with no sector are ranked against the full
// universe). For "lower is better" indicators, the percentile is inverted.

import { growthPct, pct } from "./indicators";
import { average, buildPeerGroups, percentileRank } from "./percentile";

export { percentileRank };

export const CATEGORY_WEIGHTS = {
  profitability: 0.35,
  growth: 0.25,
  financialHealth: 0.2,
  dividend: 0.2,
} as const;

export type CompanyMetrics = {
  companyId: string;
  sector: string | null;
  // Profitability
  grossMarginPct: number | null;
  operatingMarginPct: number | null;
  netMarginPct: number | null;
  returnOnEquityPct: number | null;
  // Growth
  revenueGrowthPct: number | null;
  netIncomeGrowthPct: number | null;
  epsGrowthPct: number | null;
  // Financial Health (lower is better)
  debtRepaymentRatio: number | null;
  interestBurdenPct: number | null;
  // Dividend
  dpsGrowthPct: number | null;
  payoutSustainability: number | null; // closeness to a healthy ~45% payout ratio
};

export type LatestTwoStatements = {
  companyId: string;
  sector: string | null;
  latest: {
    revenue: number | null;
    operatingIncome: number | null;
    interestExpense: number | null;
    netIncome: number | null;
    netMarginPct: number | null;
    epsGrowthPct: number | null;
    netIncomeGrowthPct: number | null;
    grossMarginPct: number | null;
    returnOnEquityPct: number | null;
    debtRepaymentRatio: number | null;
    dividendsPerShare: number | null;
    payoutRatioPct: number | null;
  };
  previous: {
    revenue: number | null;
    dividendsPerShare: number | null;
  } | null;
};

const HEALTHY_PAYOUT_RATIO_PCT = 45;

export function deriveCompanyMetrics(input: LatestTwoStatements): CompanyMetrics {
  const { latest, previous } = input;

  const operatingMarginPct = pct(latest.operatingIncome, latest.revenue);
  const interestBurdenPct = pct(
    latest.interestExpense !== null ? Math.abs(latest.interestExpense) : null,
    latest.operatingIncome
  );
  const revenueGrowthPct = growthPct(latest.revenue, previous?.revenue ?? null);
  const dpsGrowthPct = growthPct(latest.dividendsPerShare, previous?.dividendsPerShare ?? null);
  const payoutSustainability =
    latest.payoutRatioPct === null ? null : -Math.abs(latest.payoutRatioPct - HEALTHY_PAYOUT_RATIO_PCT);

  return {
    companyId: input.companyId,
    sector: input.sector,
    grossMarginPct: latest.grossMarginPct,
    operatingMarginPct,
    netMarginPct: latest.netMarginPct,
    returnOnEquityPct: latest.returnOnEquityPct,
    revenueGrowthPct,
    netIncomeGrowthPct: latest.netIncomeGrowthPct,
    epsGrowthPct: latest.epsGrowthPct,
    debtRepaymentRatio: latest.debtRepaymentRatio,
    interestBurdenPct,
    dpsGrowthPct,
    payoutSustainability,
  };
}

export type CategoryScores = {
  profitability: number | null;
  growth: number | null;
  financialHealth: number | null;
  dividend: number | null;
};

export type CompanyScore = CategoryScores & {
  companyId: string;
  overall: number;
  sectorPercentileRank: number | null;
};

/**
 * Computes 0-100 category scores and an overall score for every company,
 * ranking each indicator against same-sector peers (or the full universe
 * if the company has no sector or its sector has no other peers).
 */
export function scoreCompanies(companies: CompanyMetrics[]): CompanyScore[] {
  const { peerGroupFor } = buildPeerGroups(companies);

  const withCategoryScores = companies.map((c) => {
    const peers = peerGroupFor(c);

    const higherIsBetter = (selector: (m: CompanyMetrics) => number | null) =>
      percentileRank(selector(c), peers.map(selector));

    const lowerIsBetter = (selector: (m: CompanyMetrics) => number | null) => {
      const rank = percentileRank(selector(c), peers.map(selector));
      return rank === null ? null : 100 - rank;
    };

    const profitability = average([
      higherIsBetter((m) => m.grossMarginPct),
      higherIsBetter((m) => m.operatingMarginPct),
      higherIsBetter((m) => m.netMarginPct),
      higherIsBetter((m) => m.returnOnEquityPct),
    ]);

    const growth = average([
      higherIsBetter((m) => m.revenueGrowthPct),
      higherIsBetter((m) => m.netIncomeGrowthPct),
      higherIsBetter((m) => m.epsGrowthPct),
    ]);

    const financialHealth = average([
      lowerIsBetter((m) => m.debtRepaymentRatio),
      lowerIsBetter((m) => m.interestBurdenPct),
    ]);

    const dividend = average([
      higherIsBetter((m) => m.dpsGrowthPct),
      higherIsBetter((m) => m.payoutSustainability),
    ]);

    const categories: CategoryScores = { profitability, growth, financialHealth, dividend };

    // Re-normalize weights over categories that have data, so a company
    // missing one category (e.g. no dividend history) isn't unfairly
    // penalized to zero for that slice.
    let weightedSum = 0;
    let weightTotal = 0;
    for (const [key, weight] of Object.entries(CATEGORY_WEIGHTS) as [keyof CategoryScores, number][]) {
      const score = categories[key];
      if (score === null) continue;
      weightedSum += score * weight;
      weightTotal += weight;
    }
    const overall = weightTotal > 0 ? weightedSum / weightTotal : 0;

    return { source: c, peers, categories, overall };
  });

  const overallByCompanyId = new Map(withCategoryScores.map((w) => [w.source.companyId, w.overall]));

  return withCategoryScores.map(({ source, peers, categories, overall }) => ({
    companyId: source.companyId,
    ...categories,
    overall,
    sectorPercentileRank: percentileRank(
      overall,
      peers.map((p) => overallByCompanyId.get(p.companyId) ?? null)
    ),
  }));
}
