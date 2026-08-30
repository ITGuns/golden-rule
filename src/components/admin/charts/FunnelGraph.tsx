"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type FunnelStage = { status: string; count: number };

export const FUNNEL_STAGE_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  ESTIMATE: "Estimate",
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  REVIEW_REQUESTED: "Review requested",
  CLOSED: "Closed",
};

const W = 820;
const ROW_H = 54;
const PAD = 8;
const NODE_X = 18;
const LABEL_X = 38;
const BAR_X = 205;
const BAR_MAX_W = 460;
const BAR_H = 22;
const GOLD = "#fccd35";

/**
 * Custom SVG pipeline graph: the lead statuses as connected nodes with
 * animated proportional bars. Every node is keyboard focusable; activating a
 * node calls onSelect(status) (again to clear) so a detail list beneath can
 * filter to that stage.
 */
export function FunnelGraph({
  stages,
  selected,
  onSelect,
}: {
  stages: FunnelStage[];
  selected: string | null;
  onSelect: (status: string | null) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const max = Math.max(1, ...stages.map((s) => s.count));
  const height = stages.length * ROW_H + PAD * 2;

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        role="group"
        aria-label="Lead pipeline by status. Activate a stage to filter the lead list."
        className="h-auto w-full min-w-[560px] text-ink dark:text-white"
      >
        {stages.map((stage, i) => {
          const y = PAD + i * ROW_H;
          const cy = y + ROW_H / 2;
          const barW = Math.max(stage.count > 0 ? 8 : 3, (stage.count / max) * BAR_MAX_W);
          const isSelected = selected === stage.status;
          const dimmed = selected !== null && !isSelected;
          const label = FUNNEL_STAGE_LABELS[stage.status] || stage.status;

          return (
            <g key={stage.status}>
              {/* connector to the next node */}
              {i < stages.length - 1 && (
                <line
                  x1={NODE_X}
                  y1={cy + 8}
                  x2={NODE_X}
                  y2={cy + ROW_H - 8}
                  stroke="currentColor"
                  strokeOpacity={0.25}
                  strokeWidth={2}
                  strokeDasharray="1 4"
                  strokeLinecap="round"
                  aria-hidden
                />
              )}
              <g
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`${label}: ${stage.count} lead${stage.count === 1 ? "" : "s"}. ${
                  isSelected ? "Selected — activate to clear the filter" : "Activate to filter"
                }`}
                onClick={() => onSelect(isSelected ? null : stage.status)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(isSelected ? null : stage.status);
                  }
                }}
                className={cn(
                  "cursor-pointer transition-opacity duration-300",
                  dimmed && "opacity-40"
                )}
              >
                {/* row hit area */}
                <rect x={0} y={y + 3} width={W} height={ROW_H - 6} rx={10} fill="transparent" />
                {/* node */}
                <circle
                  cx={NODE_X}
                  cy={cy}
                  r={6.5}
                  fill={isSelected || stage.count > 0 ? GOLD : "none"}
                  stroke={isSelected ? "currentColor" : GOLD}
                  strokeWidth={isSelected ? 2 : 1.5}
                />
                {/* label */}
                <text
                  x={LABEL_X}
                  y={cy + 4.5}
                  fontSize={13.5}
                  fontWeight={isSelected ? 700 : 600}
                  fill="currentColor"
                >
                  {label}
                </text>
                {/* bar track */}
                <rect
                  x={BAR_X}
                  y={cy - BAR_H / 2}
                  width={BAR_MAX_W}
                  height={BAR_H}
                  rx={BAR_H / 2}
                  fill="currentColor"
                  opacity={0.07}
                />
                {/* animated bar */}
                <rect
                  x={BAR_X}
                  y={cy - BAR_H / 2}
                  width={barW}
                  height={BAR_H}
                  rx={Math.min(BAR_H / 2, barW / 2)}
                  fill={GOLD}
                  opacity={stage.count > 0 ? 1 : 0.35}
                  stroke={isSelected ? "currentColor" : "none"}
                  strokeWidth={isSelected ? 1.5 : 0}
                  style={{
                    transform: mounted ? "scaleX(1)" : "scaleX(0.01)",
                    transformOrigin: `${BAR_X}px 0px`,
                    transition: `transform 550ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 45}ms`,
                  }}
                />
                {/* count */}
                <text
                  x={BAR_X + BAR_MAX_W + 14}
                  y={cy + 4.5}
                  fontSize={13.5}
                  fontWeight={700}
                  fill="currentColor"
                >
                  {stage.count.toLocaleString("en-US")}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
