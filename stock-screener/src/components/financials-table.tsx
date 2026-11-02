import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FinancialRow } from "@/lib/factsheet";

type RowDef = {
  key: keyof FinancialRow;
  label: string;
  format: (value: number | null, currency: string) => string;
};

const millions = (value: number | null, currency: string) =>
  value === null ? "—" : `${currency} ${(value / 1e6).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const percent = (value: number | null) => (value === null ? "—" : `${value.toFixed(1)}%`);

const perShare = (value: number | null, currency: string) =>
  value === null ? "—" : `${currency} ${value.toFixed(2)}`;

const multiple = (value: number | null) => (value === null ? "—" : `${value.toFixed(1)}x`);

const ROWS: RowDef[] = [
  { key: "revenue", label: "Revenue", format: millions },
  { key: "grossProfit", label: "Gross Profit", format: millions },
  { key: "grossMarginPct", label: "Gross Margin %", format: percent },
  { key: "operatingIncome", label: "Operating Income", format: millions },
  { key: "interestExpense", label: "Interest Expense", format: millions },
  { key: "netIncome", label: "Net Income", format: millions },
  { key: "netIncomeGrowthPct", label: "Net Income Growth %", format: percent },
  { key: "netMarginPct", label: "Net Margin %", format: percent },
  { key: "eps", label: "Earnings Per Share (EPS)", format: perShare },
  { key: "epsGrowthPct", label: "EPS Growth %", format: percent },
  { key: "debtRepaymentRatio", label: "Debt Repayment Ratio (x)", format: multiple },
  { key: "dividendsPerShare", label: "Dividends Per Share", format: perShare },
  { key: "payoutRatioPct", label: "Payout Ratio %", format: percent },
  { key: "freeCashFlow", label: "Free Cash Flow", format: millions },
  { key: "returnOnEquityPct", label: "Return on Equity %", format: percent },
];

export function FinancialsTable({ rows, currency }: { rows: FinancialRow[]; currency: string }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background">Indicator</TableHead>
            {rows.map((r) => (
              <TableHead key={r.fiscalYear} className="text-right">
                {r.fiscalYear}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {ROWS.map((rowDef) => (
            <TableRow key={rowDef.key}>
              <TableCell className="sticky left-0 bg-background font-medium">{rowDef.label}</TableCell>
              {rows.map((r) => (
                <TableCell key={r.fiscalYear} className="text-right tabular-nums">
                  {rowDef.format(r[rowDef.key] as number | null, currency)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
