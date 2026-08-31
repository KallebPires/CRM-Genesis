"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function HorizontalBarChart({
  data,
  color = "var(--chart-1)",
  valueFormatter,
}: {
  data: { label: string; value: number }[];
  color?: string;
  valueFormatter?: (value: number) => string;
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem dados suficientes ainda.</p>;
  }

  const height = Math.max(120, data.length * 40);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 24, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={140}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          contentStyle={{
            background: "var(--popover)",
            color: "var(--popover-foreground)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            fontSize: 12,
            fontVariantNumeric: "tabular-nums",
            boxShadow: "0 4px 16px rgb(0 0 0 / 0.18)",
          }}
          formatter={(value) => (valueFormatter ? valueFormatter(Number(value)) : Number(value))}
        />
        <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
