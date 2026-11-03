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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getDistinctSectors,
  getScreenerRows,
  type ScreenerSortKey,
} from "@/lib/screener";
import { formatMarketCap, formatScore, scoreBadgeClass } from "@/lib/format";

export const dynamic = "force-dynamic";

const SORT_COLUMNS: { key: ScreenerSortKey; label: string }[] = [
  { key: "name", label: "Company" },
  { key: "ticker", label: "Ticker" },
  { key: "sector", label: "Sector" },
  { key: "marketCap", label: "Market Cap" },
  { key: "overallScore", label: "Score" },
];

export default async function ScreenerPage(props: PageProps<"/">) {
  const params = await props.searchParams;
  const country = typeof params.country === "string" ? params.country : undefined;
  const sector = typeof params.sector === "string" ? params.sector : undefined;
  const sort = (typeof params.sort === "string" ? params.sort : "overallScore") as ScreenerSortKey;
  const dir = params.dir === "asc" ? "asc" : "desc";

  const [rows, sectors] = await Promise.all([
    getScreenerRows({ country, sector, sort, dir }),
    getDistinctSectors(),
  ]);

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { country, sector, sort, dir, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value) next.set(key, value);
    }
    const qs = next.toString();
    return qs ? `/?${qs}` : "/";
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">SG &amp; US Stock Screener</h1>
        <p className="text-sm text-muted-foreground">
          Ranked by fundamentals · Profitability 35% · Growth 25% · Financial Health 20% · Dividend 20%
        </p>
      </div>

      {/* Filter bar */}
      <form className="flex flex-wrap items-center gap-2" method="get">
        <select
          name="country"
          defaultValue={country ?? ""}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All markets</option>
          <option value="SG">Singapore (SGX)</option>
          <option value="US">United States</option>
        </select>

        <select
          name="sector"
          defaultValue={sector ?? ""}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All sectors</option>
          {sectors.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <input type="hidden" name="sort" value={sort} />
        <input type="hidden" name="dir" value={dir} />

        <Button type="submit" size="sm">Apply</Button>

        {(country || sector) && (
          <Link
            href="/"
            className="inline-flex h-8 items-center rounded-md px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Clear filters
          </Link>
        )}

        <span className="ml-auto text-sm text-muted-foreground">
          {rows.length} {rows.length === 1 ? "company" : "companies"}
        </span>
      </form>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {SORT_COLUMNS.map((col) => {
                  const isActive = sort === col.key;
                  const nextDir = isActive && dir === "desc" ? "asc" : "desc";
                  return (
                    <TableHead key={col.key} className="font-semibold">
                      <Link
                        href={buildHref({ sort: col.key, dir: nextDir })}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        {col.label}
                        {isActive ? (
                          <span className="text-primary">{dir === "desc" ? "↓" : "↑"}</span>
                        ) : (
                          <span className="text-muted-foreground/40">↕</span>
                        )}
                      </Link>
                    </TableHead>
                  );
                })}
                <TableHead className="font-semibold">Market</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">Price</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">Fair Value</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">Upside %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                    No companies found. Run <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run ingest</code> and{" "}
                    <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run score</code> to populate data.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    <Link href={`/stocks/${row.ticker}`} className="hover:text-primary hover:underline">
                      {row.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{row.ticker}</TableCell>
                  <TableCell className="text-sm">{row.sector ?? "—"}</TableCell>
                  <TableCell className="tabular-nums text-sm">{formatMarketCap(row.marketCap, row.currency)}</TableCell>
                  <TableCell>
                    <Badge className={scoreBadgeClass(row.overallScore)} variant="secondary">
                      {formatScore(row.overallScore)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-normal">
                      {row.country === "SG" ? "🇸🇬 SGX" : "🇺🇸 US"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">—</TableCell>
                  <TableCell className="text-right text-muted-foreground">—</TableCell>
                  <TableCell className="text-right text-muted-foreground">—</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
