// The 15 fundamentals from the "Case Study #1: S&P Global Inc" indicator set
// (see plan, Phase 1A). One value per fiscal year.
export type YearIndicators = {
  fiscalYear: number;
  periodEnd: Date;
  revenue: number | null;
  grossProfit: number | null;
  grossMarginPct: number | null;
  operatingIncome: number | null;
  interestExpense: number | null;
  netIncome: number | null;
  netIncomeGrowthPct: number | null;
  netMarginPct: number | null;
  eps: number | null;
  epsGrowthPct: number | null;
  debtRepaymentRatio: number | null;
  dividendsPerShare: number | null;
  payoutRatioPct: number | null;
  freeCashFlow: number | null;
  returnOnEquityPct: number | null;
  // Additional pass-through figures for the Quality Compounder Score (see plan addendum).
  ebit: number | null;
  pretaxIncome: number | null;
  taxProvision: number | null;
  totalDebt: number | null;
  stockholdersEquity: number | null;
  sharesOutstanding: number | null;
  investedCapital: number | null;
};

// Raw per-year figures pulled from the data provider (in reporting currency).
export type RawYearFinancials = {
  fiscalYear: number;
  periodEnd: Date;
  totalRevenue: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  interestExpense: number | null;
  netIncome: number | null;
  dilutedEPS: number | null;
  freeCashFlow: number | null;
  totalDebt: number | null;
  stockholdersEquity: number | null;
  commonStockDividendPaid: number | null; // typically reported as a negative outflow
  ordinarySharesNumber: number | null;
  ebit: number | null;
  pretaxIncome: number | null;
  taxProvision: number | null;
  investedCapital: number | null;
};

export function pct(numerator: number | null, denominator: number | null): number | null {
  if (numerator === null || denominator === null || denominator === 0) return null;
  return (numerator / denominator) * 100;
}

export function growthPct(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Converts a sorted (ascending by fiscalYear) list of raw annual financials
 * into the 15 case-study indicators, including YoY growth figures which
 * require the prior year's data.
 */
export function computeIndicators(years: RawYearFinancials[]): YearIndicators[] {
  return years.map((y, i) => {
    const prev = years[i - 1];

    const dividendsPerShare =
      y.commonStockDividendPaid !== null && y.ordinarySharesNumber
        ? Math.abs(y.commonStockDividendPaid) / y.ordinarySharesNumber
        : null;

    const payoutRatioPct =
      y.commonStockDividendPaid !== null && y.netIncome
        ? (Math.abs(y.commonStockDividendPaid) / y.netIncome) * 100
        : null;

    const debtRepaymentRatio =
      y.totalDebt !== null && y.freeCashFlow && y.freeCashFlow !== 0
        ? y.totalDebt / y.freeCashFlow
        : null;

    return {
      fiscalYear: y.fiscalYear,
      periodEnd: y.periodEnd,
      revenue: y.totalRevenue,
      grossProfit: y.grossProfit,
      grossMarginPct: pct(y.grossProfit, y.totalRevenue),
      operatingIncome: y.operatingIncome,
      interestExpense: y.interestExpense !== null ? -Math.abs(y.interestExpense) : null,
      netIncome: y.netIncome,
      netIncomeGrowthPct: growthPct(y.netIncome, prev?.netIncome ?? null),
      netMarginPct: pct(y.netIncome, y.totalRevenue),
      eps: y.dilutedEPS,
      epsGrowthPct: growthPct(y.dilutedEPS, prev?.dilutedEPS ?? null),
      debtRepaymentRatio,
      dividendsPerShare,
      payoutRatioPct,
      freeCashFlow: y.freeCashFlow,
      returnOnEquityPct: pct(y.netIncome, y.stockholdersEquity),
      ebit: y.ebit,
      pretaxIncome: y.pretaxIncome,
      taxProvision: y.taxProvision,
      totalDebt: y.totalDebt,
      stockholdersEquity: y.stockholdersEquity,
      sharesOutstanding: y.ordinarySharesNumber,
      investedCapital: y.investedCapital,
    };
  });
}
