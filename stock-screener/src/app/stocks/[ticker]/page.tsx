import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FinancialsTable } from "@/components/financials-table";
import { RevenueEpsChart } from "@/components/revenue-eps-chart";
import { getFactsheet } from "@/lib/factsheet";
import { formatMarketCap, formatScore, scoreBadgeClass } from "@/lib/format";

// Always reflects the latest data; avoid baking DB results into the build
// output (and avoids requiring a DB connection at build time).
export const dynamic = "force-dynamic";

export default async function StockFactsheetPage(props: PageProps<"/stocks/[ticker]">) {
  const { ticker } = await props.params;
  const factsheet = await getFactsheet(ticker);

  if (!factsheet) notFound();

  const chartData = factsheet.financials.map((f) => ({
    fiscalYear: f.fiscalYear,
    revenue: f.revenue,
    eps: f.eps,
  }));

  const scoreCards: { label: string; value: number | null }[] = [
    { label: "Overall", value: factsheet.overallScore },
    { label: "Profitability", value: factsheet.profitabilityScore },
    { label: "Growth", value: factsheet.growthScore },
    { label: "Financial Health", value: factsheet.financialHealthScore },
    { label: "Dividend", value: factsheet.dividendScore },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-10">
      <div>
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          ← Back to screener
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{factsheet.name}</h1>
          <Badge variant="outline">{factsheet.ticker}</Badge>
          <Badge variant="outline">{factsheet.exchange}</Badge>
          <Badge variant="outline">{factsheet.country}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {factsheet.sector ?? "Unknown sector"}
          {factsheet.industry ? ` · ${factsheet.industry}` : ""} · Market Cap{" "}
          {formatMarketCap(factsheet.marketCap, factsheet.currency)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {scoreCards.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={scoreBadgeClass(s.value)} variant="secondary">
                {formatScore(s.value)}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue &amp; EPS Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <RevenueEpsChart data={chartData} />
          ) : (
            <p className="text-sm text-muted-foreground">No financial history available.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financials (Annual)</CardTitle>
        </CardHeader>
        <CardContent>
          {factsheet.financials.length > 0 ? (
            <FinancialsTable rows={factsheet.financials} currency={factsheet.currency} />
          ) : (
            <p className="text-sm text-muted-foreground">
              No financial history available. Run <code>npm run ingest</code> to fetch data.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
