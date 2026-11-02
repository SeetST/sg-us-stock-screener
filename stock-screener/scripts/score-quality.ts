// Computes the Quality Compounder Score (plan addendum) for every company
// from its last 5 fiscal years of fundamentals, and upserts the result into
// the `QualityCompounderScore` table.
//
// Usage: npm run score:quality

import { prisma } from "@/lib/db";
import { computeQualityMetrics, scoreQualityCompounders, type QualityYear } from "@/lib/quality-score";

async function main() {
  const companies = await prisma.company.findMany({
    include: {
      financialStatements: {
        orderBy: { fiscalYear: "desc" },
        take: 5,
      },
    },
  });

  const withMetrics = companies
    .filter((c) => c.financialStatements.length > 0)
    .map((c) => {
      const years: QualityYear[] = c.financialStatements
        .slice()
        .reverse() // ascending by fiscalYear
        .map((f) => ({
          fiscalYear: f.fiscalYear,
          grossMarginPct: f.grossMarginPct?.toNumber() ?? null,
          revenue: f.revenue?.toNumber() ?? null,
          freeCashFlow: f.freeCashFlow?.toNumber() ?? null,
          eps: f.eps?.toNumber() ?? null,
          sharesOutstanding: f.sharesOutstanding?.toNumber() ?? null,
          totalDebt: f.totalDebt?.toNumber() ?? null,
          stockholdersEquity: f.stockholdersEquity?.toNumber() ?? null,
          operatingIncome: f.operatingIncome?.toNumber() ?? null,
          interestExpense: f.interestExpense?.toNumber() ?? null,
          ebit: f.ebit?.toNumber() ?? null,
          pretaxIncome: f.pretaxIncome?.toNumber() ?? null,
          taxProvision: f.taxProvision?.toNumber() ?? null,
          investedCapital: f.investedCapital?.toNumber() ?? null,
          returnOnEquityPct: f.returnOnEquityPct?.toNumber() ?? null,
        }));

      return computeQualityMetrics(c.id, c.sector, years);
    });

  const results = scoreQualityCompounders(withMetrics);

  const asOfDate = new Date();
  for (const r of results) {
    await prisma.qualityCompounderScore.upsert({
      where: { companyId_asOfDate: { companyId: r.companyId, asOfDate } },
      create: {
        companyId: r.companyId,
        asOfDate,
        overallScore: r.overallScore,
        componentScores: r.componentScores,
        meetsRoeThreshold: r.meetsRoeThreshold,
        meetsRoicThreshold: r.meetsRoicThreshold,
        rank: r.rank,
      },
      update: {
        overallScore: r.overallScore,
        componentScores: r.componentScores,
        meetsRoeThreshold: r.meetsRoeThreshold,
        meetsRoicThreshold: r.meetsRoicThreshold,
        rank: r.rank,
      },
    });
  }

  console.log(`Scored ${results.length} companies for Quality Compounder ranking as of ${asOfDate.toISOString()}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
