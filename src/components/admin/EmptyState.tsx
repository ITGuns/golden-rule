import { Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Friendly empty state for admin lists, tables and panels. */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  hint,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-12 text-center dark:border-night-line",
        className
      )}
    >
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-gold/15 text-gold-deep dark:text-gold">
        <Icon className="size-6" aria-hidden />
      </div>
      <p className="font-display text-base font-semibold text-ink dark:text-white">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-muted dark:text-gray-400">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
