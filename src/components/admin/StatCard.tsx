import { Minus, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export type StatDelta = {
  direction: "up" | "down" | "flat";
  label: string;
  /** Whether the movement is good news — controls green/red coloring. */
  positive?: boolean;
};

/** KPI tile for the admin dashboard. */
export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  hint,
  className,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  delta?: StatDelta;
  hint?: string;
  className?: string;
}) {
  const DeltaIcon =
    delta?.direction === "up" ? TrendingUp : delta?.direction === "down" ? TrendingDown : Minus;
  const deltaTone =
    delta?.positive === undefined
      ? "text-muted dark:text-gray-400"
      : delta.positive
        ? "text-success dark:text-green-400"
        : "text-danger dark:text-red-400";

  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted dark:text-gray-400">
          {label}
        </p>
        {Icon && (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-deep dark:text-gold">
            <Icon className="size-4.5" aria-hidden />
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink dark:text-white">
        {value}
      </p>
      {(delta || hint) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          {delta && (
            <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", deltaTone)}>
              <DeltaIcon className="size-3.5" aria-hidden />
              {delta.label}
            </span>
          )}
          {hint && <span className="text-xs text-muted dark:text-gray-500">{hint}</span>}
        </div>
      )}
    </Card>
  );
}
