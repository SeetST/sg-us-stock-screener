// Quality Compounder Score (plan addendum): ranks companies on 9
// equal-weighted (~11.1% each) factors, sector-relative percentile ranked,
// with null-aware re-normalization. Insider ownership (the 10th factor in
// the original request) is dropped — no free-tier data source covers it for
// either SGX or US.

import { average, buildPeerGroups, percentileRank } from "./percentile";

const ROE_THRESHOLD = 15;
const ROIC_THRESHOLD = 12;
const MIN_TAX_RATE = 0;
const MAX_TAX_RATE = 0.6;

// One fiscal year of inputs, ordered ascending by fiscalYear (oldest first).
export type QualityYear = {
  fiscalYear: number;
  grossMarginPct: number | null;
  revenue: number | null;
  freeCashFlow: number | null;
  eps: number | null;
  sharesOutstanding: number | null;
  totalDebt: number | null;
  stockholdersEquity: number | null;
  operatingIncome: number | null;
  interestExpense: number | null;
  ebit: number | null;
  pretaxIncome: number | null;
  taxProvision: number | null;
  investedCapital: number | null;
  returnOnEquityPct: number | null;
};

export type QualityMetrics = {
  companyId: string;
  sector: string | null;
  roe: number | null;
  roic: number | null;
  grossMarginStabilityCV: number | null; // lower is better
  fcfMarginPct: number | null;
  revenueCagrPct: number | null;
  epsCagrPct: number | null;
  debtToEquity: number | null; // lower is better
  interestCoverage: number | null;
  shareDilutionCagrPct: number | null; // lower is better
  meetsRoeThreshold: boolean;
  meetsRoicThreshold: boolean;
};

function stdDev(values: number[]): number {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/** CAGR as a percentage; null if `start` is non-positive or there's only one period. */
function cagrPct(start: number | null, end: number | null, years: number): number | null {
  if (start === null || end === null || start <= 0 || years <= 0) return null;
  return (Math.pow(end / start, 1 / years) - 1) * 100;
}

/**
 * Derives the 9 Quality Compounder factors for a company from its fiscal
 * years (ascending order, oldest first; up to 5 years used).
 */
export function computeQualityMetrics(companyId: string, sector: string | null, years: QualityYear[]): QualityMetrics {
  const latest = years[years.length - 1];
  const earliest = years[0];
  const span = years.length >= 3 ? latest.fiscalYear - earliest.fiscalYear : 0;

  const roe = latest?.returnOnEquityPct ?? null;

  let roic: number | null = null;
  if (latest?.ebit !== null && latest?.ebit !== undefined && latest?.investedCapital) {
    let taxRate = 0;
    if (latest.pretaxIncome !== null && latest.pretaxIncome > 0 && latest.taxProvision !== null) {
      taxRate = Math.min(MAX_TAX_RATE, Math.max(MIN_TAX_RATE, latest.taxProvision / latest.pretaxIncome));
    }
    roic = (latest.ebit * (1 - taxRate) / latest.investedCapital) * 100;
  }

  const grossMargins = years.map((y) => y.grossMarginPct).filter((v): v is number => v !== null);
  let grossMarginStabilityCV: number | null = null;
  if (grossMargins.length >= 2) {
    const mean = grossMargins.reduce((sum, v) => sum + v, 0) / grossMargins.length;
    grossMarginStabilityCV = mean !== 0 ? stdDev(grossMargins) / Math.abs(mean) : null;
  }

  const fcfMarginPct =
    latest?.freeCashFlow !== null && latest?.freeCashFlow !== undefined && latest?.revenue
      ? (latest.freeCashFlow / latest.revenue) * 100
      : null;

  const revenueCagrPct = span >= 2 ? cagrPct(earliest.revenue, latest.revenue, span) : null;
  const epsCagrPct = span >= 2 ? cagrPct(earliest.eps, latest.eps, span) : null;
  const shareDilutionCagrPct = span >= 2 ? cagrPct(earliest.sharesOutstanding, latest.sharesOutstanding, span) : null;

  const debtToEquity =
    latest?.totalDebt !== null && latest?.totalDebt !== undefined && latest?.stockholdersEquity && latest.stockholdersEquity > 0
      ? latest.totalDebt / latest.stockholdersEquity
      : null;

  const interestCoverage =
    latest?.operatingIncome !== null &&
    latest?.operatingIncome !== undefined &&
    latest?.interestExpense !== null &&
    latest?.interestExpense !== undefined &&
    latest.interestExpense !== 0
      ? latest.operatingIncome / Math.abs(latest.interestExpense)
      : null;

  return {
    companyId,
    sector,
    roe,
    roic,
    grossMarginStabilityCV,
    fcfMarginPct,
    revenueCagrPct,
    epsCagrPct,
    debtToEquity,
    interestCoverage,
    shareDilutionCagrPct,
    meetsRoeThreshold: roe !== null && roe > ROE_THRESHOLD,
    meetsRoicThreshold: roic !== null && roic > ROIC_THRESHOLD,
  };
}

export type QualityComponentScores = {
  roe: number | null;
  roic: number | null;
  grossMarginStability: number | null;
  fcfMargin: number | null;
  revenueCagr: number | null;
  epsCagr: number | null;
  debtToEquity: number | null;
  interestCoverage: number | null;
  shareDilution: number | null;
};

export type QualityCompounderResult = {
  companyId: string;
  overallScore: number;
  componentScores: QualityComponentScores;
  meetsRoeThreshold: boolean;
  meetsRoicThreshold: boolean;
  rank: number;
};

/**
 * Sector-relative percentile-ranks each of the 9 factors, inverts the
 * "lower is better" ones, averages the available sub-scores (re-normalized
 * for nulls), and assigns a 1-based rank by descending overall score.
 */
export function scoreQualityCompounders(companies: QualityMetrics[]): QualityCompounderResult[] {
  const { peerGroupFor } = buildPeerGroups(companies);

  const scored = companies.map((c) => {
    const peers = peerGroupFor(c);

    const higherIsBetter = (selector: (m: QualityMetrics) => number | null) =>
      percentileRank(selector(c), peers.map(selector));

    const lowerIsBetter = (selector: (m: QualityMetrics) => number | null) => {
      const rank = percentileRank(selector(c), peers.map(selector));
      return rank === null ? null : 100 - rank;
    };

    const componentScores: QualityComponentScores = {
      roe: higherIsBetter((m) => m.roe),
      roic: higherIsBetter((m) => m.roic),
      grossMarginStability: lowerIsBetter((m) => m.grossMarginStabilityCV),
      fcfMargin: higherIsBetter((m) => m.fcfMarginPct),
      revenueCagr: higherIsBetter((m) => m.revenueCagrPct),
      epsCagr: higherIsBetter((m) => m.epsCagrPct),
      debtToEquity: lowerIsBetter((m) => m.debtToEquity),
      interestCoverage: higherIsBetter((m) => m.interestCoverage),
      shareDilution: lowerIsBetter((m) => m.shareDilutionCagrPct),
    };

    const overallScore = average(Object.values(componentScores)) ?? 0;

    return {
      companyId: c.companyId,
      overallScore,
      componentScores,
      meetsRoeThreshold: c.meetsRoeThreshold,
      meetsRoicThreshold: c.meetsRoicThreshold,
    };
  });

  return scored
    .slice()
    .sort((a, b) => b.overallScore - a.overallScore)
    .map((s, i) => ({ ...s, rank: i + 1 }));
}
