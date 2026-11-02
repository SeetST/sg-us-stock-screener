import { prisma } from "@/lib/db";

export type CompounderRow = {
  id: string;
  ticker: string;
  name: string;
  sector: string | null;
  country: string;
  rank: number | null;
  overallScore: number | null;
  meetsRoeThreshold: boolean | null;
  meetsRoicThreshold: boolean | null;
};

/** Companies with a Quality Compounder Score, ranked strongest to weakest. */
export async function getCompounderRows(): Promise<CompounderRow[]> {
  const companies = await prisma.company.findMany({
    include: {
      qualityScores: {
        orderBy: { asOfDate: "desc" },
        take: 1,
      },
    },
  });

  const rows: CompounderRow[] = companies
    .filter((c) => c.qualityScores.length > 0)
    .map((c) => {
      const score = c.qualityScores[0];
      return {
        id: c.id,
        ticker: c.ticker,
        name: c.name,
        sector: c.sector,
        country: c.country,
        rank: score.rank,
        overallScore: score.overallScore?.toNumber() ?? null,
        meetsRoeThreshold: score.meetsRoeThreshold,
        meetsRoicThreshold: score.meetsRoicThreshold,
      };
    });

  rows.sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));

  return rows;
}
