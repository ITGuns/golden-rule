"use client";

import {
  Bar,
  BarChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTip, type ChartPoint } from "./TrendChart";

const GOLD = "#fccd35";

/**
 * Horizontal category bars (service demand, lead sources, …). Height grows
 * with the number of rows; labels inherit currentColor for theme support.
 */
export function BarsChart({
  data,
  color = GOLD,
  valuePrefix = "",
}: {
  data: ChartPoint[];
  color?: string;
  valuePrefix?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted dark:text-gray-400">
        No data for this range yet.
      </div>
    );
  }

  const height = Math.max(160, data.length * 44);

  return (
    <div style={{ height }} className="text-muted dark:text-gray-400">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 44, left: 4, bottom: 4 }}
        >
          <XAxis type="number" hide domain={[0, "dataMax"]} />
          <YAxis
            type="category"
            dataKey="label"
            width={130}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "currentColor", fontSize: 12 }}
          />
          <Tooltip
            content={<ChartTip prefix={valuePrefix} />}
            cursor={{ fill: "currentColor", opacity: 0.06 }}
          />
          <Bar dataKey="value" fill={color} radius={[4, 8, 8, 4]} barSize={18} animationDuration={600}>
            <LabelList
              dataKey="value"
              position="right"
              fill="currentColor"
              fontSize={12}
              formatter={(v: React.ReactNode) =>
                `${valuePrefix}${typeof v === "number" ? v.toLocaleString("en-US") : String(v ?? "")}`
              }
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
