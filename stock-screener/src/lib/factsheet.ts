import { prisma } from "@/lib/db";

export type FinancialRow = {
  fiscalYear: number;
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
};

export type Factsheet = {
  id: string;
  ticker: string;
  name: string;
  sector: string | null;
  industry: string | null;
  country: string;
  exchange: string;
  currency: string;
  marketCap: number | null;
  overallScore: number | null;
  profitabilityScore: number | null;
  growthScore: number | null;
  financialHealthScore: number | null;
  dividendScore: number | null;
  financials: FinancialRow[];
};

export async function getFactsheet(ticker: string): Promise<Factsheet | null> {
  const company = await prisma.company.findUnique({
    where: { ticker },
    include: {
      financialStatements: { orderBy: { fiscalYear: "asc" } },
      scores: { orderBy: { asOfDate: "desc" }, take: 1 },
    },
  });

  if (!company) return null;

  const score = company.scores[0];
  const toNum = (v: { toNumber: () => number } | null) => v?.toNumber() ?? null;

  return {
    id: company.id,
    ticker: company.ticker,
    name: company.name,
    sector: company.sector,
    industry: company.industry,
    country: company.country,
    exchange: company.exchange,
    currency: company.currency,
    marketCap: toNum(company.marketCap),
    overallScore: toNum(score?.overallScore ?? null),
    profitabilityScore: toNum(score?.profitabilityScore ?? null),
    growthScore: toNum(score?.growthScore ?? null),
    financialHealthScore: toNum(score?.financialHealthScore ?? null),
    dividendScore: toNum(score?.dividendScore ?? null),
    financials: company.financialStatements.map((f) => ({
      fiscalYear: f.fiscalYear,
      revenue: toNum(f.revenue),
      grossProfit: toNum(f.grossProfit),
      grossMarginPct: toNum(f.grossMarginPct),
      operatingIncome: toNum(f.operatingIncome),
      interestExpense: toNum(f.interestExpense),
      netIncome: toNum(f.netIncome),
      netIncomeGrowthPct: toNum(f.netIncomeGrowthPct),
      netMarginPct: toNum(f.netMarginPct),
      eps: toNum(f.eps),
      epsGrowthPct: toNum(f.epsGrowthPct),
      debtRepaymentRatio: toNum(f.debtRepaymentRatio),
      dividendsPerShare: toNum(f.dividendsPerShare),
      payoutRatioPct: toNum(f.payoutRatioPct),
      freeCashFlow: toNum(f.freeCashFlow),
      returnOnEquityPct: toNum(f.returnOnEquityPct),
    })),
  };
}
