// Computes the Phase 3 (MVP) composite score for every company from its two
// most recent fiscal years of fundamentals, and upserts the result into the
// `Score` table.
//
// Usage: npm run score

import { prisma } from "@/lib/db";
import { deriveCompanyMetrics, scoreCompanies, type LatestTwoStatements } from "@/lib/scoring";

async function main() {
  const companies = await prisma.company.findMany({
    include: {
      financialStatements: {
        orderBy: { fiscalYear: "desc" },
        take: 2,
      },
    },
  });

  const inputs: LatestTwoStatements[] = companies
    .filter((c) => c.financialStatements.length > 0)
    .map((c) => {
      const [latest, previous] = c.financialStatements;
      return {
        companyId: c.id,
        sector: c.sector,
        latest: {
          revenue: latest.revenue?.toNumber() ?? null,
          operatingIncome: latest.operatingIncome?.toNumber() ?? null,
          interestExpense: latest.interestExpense?.toNumber() ?? null,
          netIncome: latest.netIncome?.toNumber() ?? null,
          netMarginPct: latest.netMarginPct?.toNumber() ?? null,
          epsGrowthPct: latest.epsGrowthPct?.toNumber() ?? null,
          netIncomeGrowthPct: latest.netIncomeGrowthPct?.toNumber() ?? null,
          grossMarginPct: latest.grossMarginPct?.toNumber() ?? null,
          returnOnEquityPct: latest.returnOnEquityPct?.toNumber() ?? null,
          debtRepaymentRatio: latest.debtRepaymentRatio?.toNumber() ?? null,
          dividendsPerShare: latest.dividendsPerShare?.toNumber() ?? null,
          payoutRatioPct: latest.payoutRatioPct?.toNumber() ?? null,
        },
        previous: previous
          ? {
              revenue: previous.revenue?.toNumber() ?? null,
              dividendsPerShare: previous.dividendsPerShare?.toNumber() ?? null,
            }
          : null,
      };
    });

  const metrics = inputs.map(deriveCompanyMetrics);
  const scores = scoreCompanies(metrics);

  const asOfDate = new Date();
  for (const s of scores) {
    await prisma.score.upsert({
      where: { companyId_asOfDate: { companyId: s.companyId, asOfDate } },
      create: {
        companyId: s.companyId,
        asOfDate,
        overallScore: s.overall,
        profitabilityScore: s.profitability ?? 0,
        growthScore: s.growth ?? 0,
        financialHealthScore: s.financialHealth ?? 0,
        dividendScore: s.dividend ?? 0,
        sectorPercentileRank: s.sectorPercentileRank,
      },
      update: {
        overallScore: s.overall,
        profitabilityScore: s.profitability ?? 0,
        growthScore: s.growth ?? 0,
        financialHealthScore: s.financialHealth ?? 0,
        dividendScore: s.dividend ?? 0,
        sectorPercentileRank: s.sectorPercentileRank,
      },
    });
  }

  console.log(`Scored ${scores.length} companies as of ${asOfDate.toISOString()}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
