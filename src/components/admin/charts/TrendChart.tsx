"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ChartPoint = { label: string; value: number };

const GOLD = "#fccd35";

export function ChartTip({
  active,
  payload,
  label,
  prefix = "",
}: {
  active?: boolean;
  payload?: { value?: number | string }[];
  label?: string | number;
  prefix?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const raw = payload[0]?.value;
  const value = typeof raw === "number" ? raw.toLocaleString("en-US") : String(raw ?? "");
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-xs shadow-lift dark:border-night-line dark:bg-night-soft">
      <p className="font-semibold text-ink dark:text-white">
        {prefix}
        {value}
      </p>
      <p className="text-muted dark:text-gray-400">{label}</p>
    </div>
  );
}

/**
 * Gold area chart for day-by-day trends. Axes inherit `currentColor` from the
 * wrapper so they stay legible in both themes.
 */
export function TrendChart({
  data,
  height = 240,
  valuePrefix = "",
}: {
  data: ChartPoint[];
  height?: number;
  valuePrefix?: string;
}) {
  const gradId = `trend${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  if (data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-sm text-muted dark:text-gray-400"
      >
        No data for this range yet.
      </div>
    );
  }

  return (
    <div style={{ height }} className="text-muted dark:text-gray-400">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GOLD} stopOpacity={0.35} />
              <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.12} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "currentColor", fontSize: 11 }}
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <YAxis
            width={44}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            tick={{ fill: "currentColor", fontSize: 11 }}
            tickFormatter={(v: number) =>
              `${valuePrefix}${v >= 1000 ? `${Math.round(v / 100) / 10}k` : v}`
            }
          />
          <Tooltip
            content={<ChartTip prefix={valuePrefix} />}
            cursor={{ stroke: GOLD, strokeOpacity: 0.5 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={GOLD}
            strokeWidth={2.5}
            fill={`url(#${gradId})`}
            activeDot={{ r: 4, fill: GOLD, stroke: "#0a0b0d", strokeWidth: 1.5 }}
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
