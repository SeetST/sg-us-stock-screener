"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import type { CompounderRow } from "@/lib/compounders";

const chartConfig = {
  score: {
    label: "Quality Score",
    color: "hsl(var(--chart-1))",
  },
};

function scoreColor(score: number | null): string {
  if (score === null) return "#94a3b8";
  if (score >= 70) return "#22c55e";
  if (score >= 50) return "#3b82f6";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

interface Props {
  rows: CompounderRow[];
}

export function QualityScoreChart({ rows }: Props) {
  const data = rows
    .filter((r) => r.overallScore !== null)
    .slice(0, 15)
    .map((r) => ({
      name: r.ticker,
      fullName: r.name,
      score: r.overallScore ?? 0,
      country: r.country,
    }))
    .reverse(); // highest score at top in vertical layout

  return (
    <ChartContainer config={chartConfig} className="h-[380px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 32, bottom: 4, left: 8 }}
          barSize={18}
        >
          <CartesianGrid horizontal={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickCount={6}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={64}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }}
          />
          <Tooltip
            content={
              <ChartTooltipContent
                formatter={(value, _name, item) => (
                  <span>
                    <span className="font-medium">{item.payload.fullName}</span>
                    <span className="ml-2 tabular-nums text-muted-foreground">{value}</span>
                  </span>
                )}
                hideLabel
              />
            }
            cursor={{ fill: "hsl(var(--muted))", radius: 4 }}
          />
          <Bar dataKey="score" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={scoreColor(entry.score)} />
            ))}
            <LabelList
              dataKey="score"
              position="right"
              style={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontVariantNumeric: "tabular-nums" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
