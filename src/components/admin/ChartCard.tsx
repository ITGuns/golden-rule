import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Card wrapper for charts and data panels: title, optional subtitle/action. */
export function ChartCard({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold tracking-tight text-ink dark:text-white">
            {title}
          </h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted dark:text-gray-400">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="mt-4">{children}</div>
    </Card>
  );
}
