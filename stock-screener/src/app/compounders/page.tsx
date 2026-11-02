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
import { getCompounderRows } from "@/lib/compounders";
import { formatScore, scoreBadgeClass } from "@/lib/format";

// Always reflects the latest scored data; avoid baking DB results into the
// build output (and avoids requiring a DB connection at build time).
export const dynamic = "force-dynamic";

function ThresholdBadge({ pass, label }: { pass: boolean | null; label: string }) {
  if (pass === null) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        {label} —
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={
        pass
          ? "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
          : "border-muted-foreground/30 text-muted-foreground"
      }
    >
      {label} {pass ? "✓" : "✗"}
    </Badge>
  );
}

export default async function CompoundersPage() {
  const rows = await getCompounderRows();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-10">
      <div>
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          ← Back to screener
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Quality Compounder Score</h1>
        <p className="text-sm text-muted-foreground">
          Companies ranked from strongest to weakest compounder, based on 9 sector-relative
          factors: ROE, ROIC, Gross Margin stability, FCF Margin, Revenue CAGR (5Y),
          EPS CAGR (5Y), Debt-to-Equity, Interest Coverage, and Share Dilution trend
          (equal-weighted, ~11.1% each). Insider ownership is omitted — no free-tier data
          source covers it. ROE &gt; 15% and ROIC &gt; 12% badges are informational, not
          hard filters.
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Rank</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Ticker</TableHead>
              <TableHead>Sector</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Quality Score</TableHead>
              <TableHead>Thresholds</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No companies found. Run <code>npm run ingest</code> and{" "}
                  <code>npm run score:quality</code> to populate data.
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium tabular-nums">{row.rank ?? "—"}</TableCell>
                <TableCell className="font-medium">
                  <Link href={`/stocks/${row.ticker}`} className="hover:underline">
                    {row.name}
                  </Link>
                </TableCell>
                <TableCell>{row.ticker}</TableCell>
                <TableCell>{row.sector ?? "—"}</TableCell>
                <TableCell>{row.country}</TableCell>
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
      </div>
    </div>
  );
}
