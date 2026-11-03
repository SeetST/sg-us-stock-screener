"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
} from "@/components/ui/chart";

type DataPoint = { fiscalYear: number; revenue: number | null; eps: number | null };

type Props = { data: DataPoint[] };

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "#3b82f6",
  },
  eps: {
    label: "EPS",
    color: "#f59e0b",
  },
};

function formatRevenue(v: number): string {
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
  return `${v}`;
}

export function RevenueEpsChart({ data }: Props) {
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
          <XAxis
            dataKey="fiscalYear"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            yAxisId="revenue"
            orientation="left"
            tickLine={false}
            axisLine={false}
            tickFormatter={formatRevenue}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            width={52}
          />
          <YAxis
            yAxisId="eps"
            orientation="right"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            width={40}
          />
          <Tooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => {
                  if (name === "revenue")
                    return <span className="tabular-nums">{formatRevenue(value as number)}</span>;
                  return <span className="tabular-nums">{(value as number).toFixed(2)}</span>;
                }}
              />
            }
            cursor={{ fill: "hsl(var(--muted))", radius: 4 }}
          />
          <Legend content={<ChartLegendContent />} />
          <Bar
            yAxisId="revenue"
            dataKey="revenue"
            fill={chartConfig.revenue.color}
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
            opacity={0.85}
          />
          <Line
            yAxisId="eps"
            dataKey="eps"
            stroke={chartConfig.eps.color}
            strokeWidth={2}
            dot={{ r: 3, fill: chartConfig.eps.color, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
