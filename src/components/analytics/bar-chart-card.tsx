"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { CHART_COLORS } from "./chart-colors";

export function BarChartCard({
  data,
  dataKey,
  labelKey,
  color = CHART_COLORS.primary,
}: {
  // Intentionally loose: this wraps Recharts for several unrelated shapes
  // (funnel stages, college/city distributions), each with its own type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  dataKey: string;
  labelKey: string;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis
          dataKey={labelKey}
          tick={{ fontSize: 11, fill: CHART_COLORS.muted }}
          axisLine={{ stroke: CHART_COLORS.grid }}
          tickLine={false}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={50}
        />
        <YAxis tick={{ fontSize: 11, fill: CHART_COLORS.muted }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 8, borderColor: CHART_COLORS.grid, fontSize: 12 }} />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
