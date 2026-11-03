import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getCompounderRows } from "@/lib/compounders";
import { formatScore, scoreBadgeClass } from "@/lib/format";
import { QualityScoreChart } from "@/components/quality-score-chart";

export const dynamic = "force-dynamic";

function ThresholdBadge({ pass, label }: { pass: boolean | null; label: string }) {
  if (pass === null) {
    return (
      <Badge variant="outline" className="text-xs text-muted-foreground">
        {label}
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={
        pass
          ? "border-emerald-300 bg-emerald-50 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
          : "border-muted-foreground/20 text-xs text-muted-foreground"
      }
    >
      {label} {pass ? "✓" : "✗"}
    </Badge>
  );
}

export default async function CompoundersPage() {
  const rows = await getCompounderRows();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Quality Compounders</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Ranked by 9 sector-relative factors — ROE, ROIC, Gross Margin stability, FCF Margin,
          Revenue CAGR (5Y), EPS CAGR (5Y), Debt-to-Equity, Interest Coverage, Share Dilution
          — equal-weighted (~11.1% each). ROE &gt; 15% and ROIC &gt; 12% badges are
          informational only.
        </p>
      </div>

      {/* Bar chart — top 20 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Quality Score — Top 20</CardTitle>
          <CardDescription>Sector-relative composite score (0–100)</CardDescription>
        </CardHeader>
        <CardContent>
          <QualityScoreChart rows={rows} />
        </CardContent>
      </Card>

      {/* Ranking table */}
      <Card className="overflow-hidden p-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-14 font-semibold">#</TableHead>
                <TableHead className="font-semibold">Company</TableHead>
                <TableHead className="font-semibold">Ticker</TableHead>
                <TableHead className="font-semibold">Sector</TableHead>
                <TableHead className="font-semibold">Market</TableHead>
                <TableHead className="font-semibold">Quality Score</TableHead>
                <TableHead className="font-semibold">Thresholds</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    No companies found. Run{" "}
                    <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run ingest</code> and{" "}
                    <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run score:quality</code> to populate data.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30">
                  <TableCell className="tabular-nums font-medium text-muted-foreground">
                    {row.rank ?? "—"}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/stocks/${row.ticker}`} className="hover:text-primary hover:underline">
                      {row.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{row.ticker}</TableCell>
                  <TableCell className="text-sm">{row.sector ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-normal">
                      {row.country === "SG" ? "🇸🇬 SGX" : "🇺🇸 US"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={scoreBadgeClass(row.overallScore)} variant="secondary">
                      {formatScore(row.overallScore)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <ThresholdBadge pass={row.meetsRoeThreshold} label="ROE>15%" />
                      <ThresholdBadge pass={row.meetsRoicThreshold} label="ROIC>12%" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
