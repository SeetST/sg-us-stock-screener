"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  data: { fiscalYear: number; revenue: number | null; eps: number | null }[];
};

export function RevenueEpsChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="fiscalYear" />
        <YAxis
          yAxisId="revenue"
          orientation="left"
          tickFormatter={(v: number) => `${(v / 1e6).toFixed(0)}M`}
        />
        <YAxis yAxisId="eps" orientation="right" />
        <Tooltip />
        <Bar yAxisId="revenue" dataKey="revenue" name="Revenue" fill="var(--color-chart-1, #3b82f6)" />
        <Line yAxisId="eps" dataKey="eps" name="EPS" stroke="var(--color-chart-2, #f59e0b)" strokeWidth={2} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
