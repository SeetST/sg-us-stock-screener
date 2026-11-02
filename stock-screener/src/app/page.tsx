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
import {
  getDistinctSectors,
  getScreenerRows,
  type ScreenerSortKey,
} from "@/lib/screener";
import { formatMarketCap, formatScore, scoreBadgeClass } from "@/lib/format";

// Always reflects the latest scored data; avoid baking DB results into the
// build output (and avoids requiring a DB connection at build time).
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
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">SG &amp; US Stock Screener</h1>
        <p className="text-sm text-muted-foreground">
          MVP screener scored on the 15 fundamentals from the case-study indicator set
          (Profitability 35% · Growth 25% · Financial Health 20% · Dividend 20%).
        </p>
        <nav className="mt-2 text-sm">
          <Link href="/compounders" className="text-primary hover:underline">
            View Quality Compounder rankings →
          </Link>
        </nav>
      </div>

      <form className="flex flex-wrap gap-3" method="get">
        <select
          name="country"
          defaultValue={country ?? ""}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All markets</option>
          <option value="SG">Singapore (SGX)</option>
          <option value="US">United States</option>
        </select>

        <select
          name="sector"
          defaultValue={sector ?? ""}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
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

        <button
          type="submit"
          className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Apply
        </button>
      </form>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {SORT_COLUMNS.map((col) => {
                const isActive = sort === col.key;
                const nextDir = isActive && dir === "desc" ? "asc" : "desc";
                return (
                  <TableHead key={col.key}>
                    <Link
                      href={buildHref({ sort: col.key, dir: nextDir })}
                      className="flex items-center gap-1 hover:underline"
                    >
                      {col.label}
                      {isActive && <span>{dir === "desc" ? "▼" : "▲"}</span>}
                    </Link>
                  </TableHead>
                );
              })}
              <TableHead>Country</TableHead>
              <TableHead className="text-right" title="Requires price data (deferred, see plan Phase 1C)">
                Price
              </TableHead>
              <TableHead className="text-right" title="Requires valuation indicators (deferred, see plan Phase 1C)">
                Fair Value
              </TableHead>
              <TableHead className="text-right" title="Requires valuation indicators (deferred, see plan Phase 1C)">
                Upside %
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  No companies found. Run <code>npm run ingest</code> and{" "}
                  <code>npm run score</code> to populate data.
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  <Link href={`/stocks/${row.ticker}`} className="hover:underline">
                    {row.name}
                  </Link>
                </TableCell>
                <TableCell>{row.ticker}</TableCell>
                <TableCell>{row.sector ?? "—"}</TableCell>
                <TableCell>{formatMarketCap(row.marketCap, row.currency)}</TableCell>
                <TableCell>
                  <Badge className={scoreBadgeClass(row.overallScore)} variant="secondary">
                    {formatScore(row.overallScore)}
                  </Badge>
                </TableCell>
                <TableCell>{row.country}</TableCell>
                <TableCell className="text-right text-muted-foreground">—</TableCell>
                <TableCell className="text-right text-muted-foreground">—</TableCell>
                <TableCell className="text-right text-muted-foreground">—</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
