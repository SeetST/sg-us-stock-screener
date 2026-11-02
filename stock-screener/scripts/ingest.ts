// Fetches the 15 case-study indicators (Phase 1A) for the seed ticker
// universe (scripts/tickers.ts) from Yahoo Finance and upserts them into
// Postgres via Prisma.
//
// Usage: npm run ingest

import YahooFinance from "yahoo-finance2";
import { prisma } from "@/lib/db";
import { computeIndicators, type RawYearFinancials } from "@/lib/indicators";
import { SEED_TICKERS, type SeedTicker } from "./tickers";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const PERIOD1 = "2015-01-01";
const PERIOD2 = new Date().toISOString().slice(0, 10);

// Maps Yahoo's `price.exchangeName` codes to our Exchange enum. Falls back
// to the seed's exchange if the code is unrecognized.
const EXCHANGE_NAME_MAP: Record<string, SeedTicker["exchange"]> = {
  NMS: "NASDAQ",
  NGM: "NASDAQ",
  NCM: "NASDAQ",
  NYQ: "NYSE",
  ASE: "AMEX",
  PCX: "AMEX",
  SES: "SGX",
};

function resolveExchange(exchangeName: string | undefined, fallback: SeedTicker["exchange"]): SeedTicker["exchange"] {
  return (exchangeName ? EXCHANGE_NAME_MAP[exchangeName] : undefined) ?? fallback;
}

async function fetchRawFinancials(ticker: string): Promise<RawYearFinancials[]> {
  const [financials, cashFlow, balanceSheet] = await Promise.all([
    yf.fundamentalsTimeSeries(ticker, { period1: PERIOD1, period2: PERIOD2, type: "annual", module: "financials" }),
    yf.fundamentalsTimeSeries(ticker, { period1: PERIOD1, period2: PERIOD2, type: "annual", module: "cash-flow" }),
    yf.fundamentalsTimeSeries(ticker, { period1: PERIOD1, period2: PERIOD2, type: "annual", module: "balance-sheet" }),
  ]);

  // The yahoo-finance2 types don't discriminate fields by `module`, so cast
  // each result to a loose numeric record for field access.
  type FieldMap = Record<string, number | null | undefined>;
  const asFields = (r: unknown) => r as FieldMap;

  const cashFlowByDate = new Map(cashFlow.map((r) => [new Date(r.date).getFullYear(), asFields(r)]));
  const balanceSheetByDate = new Map(balanceSheet.map((r) => [new Date(r.date).getFullYear(), asFields(r)]));

  return financials
    .map((f): RawYearFinancials | null => {
      const periodEnd = new Date(f.date);
      const fiscalYear = periodEnd.getFullYear();
      const ff = asFields(f);
      const cf = cashFlowByDate.get(fiscalYear);
      const bs = balanceSheetByDate.get(fiscalYear);

      return {
        fiscalYear,
        periodEnd,
        totalRevenue: ff.totalRevenue ?? null,
        grossProfit: ff.grossProfit ?? null,
        operatingIncome: ff.operatingIncome ?? null,
        interestExpense: ff.interestExpense ?? null,
        netIncome: ff.netIncome ?? null,
        dilutedEPS: ff.dilutedEPS ?? null,
        freeCashFlow: cf?.freeCashFlow ?? null,
        totalDebt: bs?.totalDebt ?? null,
        stockholdersEquity: bs?.stockholdersEquity ?? null,
        commonStockDividendPaid: cf?.commonStockDividendPaid ?? null,
        ordinarySharesNumber: bs?.ordinarySharesNumber ?? null,
        ebit: ff.EBIT ?? null,
        pretaxIncome: ff.pretaxIncome ?? null,
        taxProvision: ff.taxProvision ?? null,
        investedCapital: bs?.investedCapital ?? null,
      };
    })
    .filter((r): r is RawYearFinancials => r !== null)
    .sort((a, b) => a.fiscalYear - b.fiscalYear);
}

async function ingestTicker(seed: (typeof SEED_TICKERS)[number]) {
  const { ticker, exchange, country } = seed;
  console.log(`Ingesting ${ticker}...`);

  const [profile, rawYears] = await Promise.all([
    yf.quoteSummary(ticker, { modules: ["assetProfile", "price"] }),
    fetchRawFinancials(ticker),
  ]);

  const resolvedExchange = resolveExchange(profile.price?.exchangeName, exchange);

  const company = await prisma.company.upsert({
    where: { ticker },
    create: {
      ticker,
      name: profile.price?.longName ?? profile.price?.shortName ?? ticker,
      exchange: resolvedExchange,
      country,
      sector: profile.assetProfile?.sector ?? null,
      industry: profile.assetProfile?.industry ?? null,
      marketCap: profile.price?.marketCap ?? null,
      currency: profile.price?.currency ?? "USD",
    },
    update: {
      name: profile.price?.longName ?? profile.price?.shortName ?? ticker,
      exchange: resolvedExchange,
      sector: profile.assetProfile?.sector ?? null,
      industry: profile.assetProfile?.industry ?? null,
      marketCap: profile.price?.marketCap ?? null,
      currency: profile.price?.currency ?? "USD",
    },
  });

  const indicators = computeIndicators(rawYears);

  for (const ind of indicators) {
    await prisma.financialStatement.upsert({
      where: { companyId_fiscalYear: { companyId: company.id, fiscalYear: ind.fiscalYear } },
      create: { companyId: company.id, ...ind },
      update: { ...ind },
    });
  }

  console.log(`  -> ${company.name}: ${indicators.length} fiscal years`);
}

async function main() {
  for (const seed of SEED_TICKERS) {
    try {
      await ingestTicker(seed);
    } catch (err) {
      console.error(`Failed to ingest ${seed.ticker}:`, (err as Error).message);
    }
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
