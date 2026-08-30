import { cn, initials } from "@/lib/utils";
import { Badge, Card } from "@/components/ui/Card";
import type { ReactNode } from "react";
import {
  APPOINTMENT_STATUS_META,
  ESTIMATE_STATUS_META,
  LEAD_STATUS_META,
  MISSED_CALL_STATUS_META,
  PRIORITY_META,
  SERVICE_REQUEST_STATUS_META,
  humanize,
  type AppointmentStatus,
  type EstimateStatus,
  type LeadStatus,
  type MissedCallStatus,
  type Priority,
  type ServiceRequestStatus,
} from "./constants";

/**
 * Local CRM equivalents of the dashboard primitives (EmptyState / StatCard)
 * plus small status atoms. Presentational only — usable from server and
 * client components alike.
 */

export function CrmEmptyState({
  icon,
  title,
  hint,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line px-6 py-12 text-center dark:border-night-line",
        className
      )}
    >
      {icon && (
        <div
          className="grid size-12 place-items-center rounded-full bg-gold-soft text-[#8a6d00] dark:bg-gold/15 dark:text-gold"
          aria-hidden
        >
          {icon}
        </div>
      )}
      <p className="font-display text-base font-semibold text-ink dark:text-white">{title}</p>
      {hint && <p className="max-w-sm text-sm text-muted">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function CrmStatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="flex items-start justify-between gap-3 p-5">
      <div>
        <p className="eyebrow text-xs text-muted">{label}</p>
        <p className="display mt-1 text-2xl text-ink dark:text-white">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      </div>
      {icon && (
        <div
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold-soft text-[#8a6d00] dark:bg-gold/15 dark:text-gold"
          aria-hidden
        >
          {icon}
        </div>
      )}
    </Card>
  );
}

export function LeadStatusBadge({ status }: { status: string }) {
  const meta = LEAD_STATUS_META[status as LeadStatus];
  return <Badge tone={meta?.tone ?? "neutral"}>{meta?.label ?? humanize(status)}</Badge>;
}

export function AppointmentStatusBadge({ status }: { status: string }) {
  const meta = APPOINTMENT_STATUS_META[status as AppointmentStatus];
  return <Badge tone={meta?.tone ?? "neutral"}>{meta?.label ?? humanize(status)}</Badge>;
}

export function EstimateStatusBadge({ status }: { status: string }) {
  const meta = ESTIMATE_STATUS_META[status as EstimateStatus];
  return <Badge tone={meta?.tone ?? "neutral"}>{meta?.label ?? humanize(status)}</Badge>;
}

export function MissedCallStatusBadge({ status }: { status: string }) {
  const meta = MISSED_CALL_STATUS_META[status as MissedCallStatus];
  return <Badge tone={meta?.tone ?? "neutral"}>{meta?.label ?? humanize(status)}</Badge>;
}

export function ServiceRequestStatusBadge({ status }: { status: string }) {
  const meta = SERVICE_REQUEST_STATUS_META[status as ServiceRequestStatus];
  return <Badge tone={meta?.tone ?? "neutral"}>{meta?.label ?? humanize(status)}</Badge>;
}

export function PriorityDot({
  priority,
  withLabel = false,
  className,
}: {
  priority: string;
  withLabel?: boolean;
  className?: string;
}) {
  const meta = PRIORITY_META[priority as Priority] ?? PRIORITY_META.NORMAL;
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className={cn("size-2 rounded-full", meta.dot)} aria-hidden />
      {withLabel ? (
        <span className="text-xs font-medium text-muted">{meta.label}</span>
      ) : (
        <span className="sr-only">{meta.label} priority</span>
      )}
    </span>
  );
}

export function AssigneeAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      title={name}
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded-full bg-ink text-[10px] font-bold text-gold dark:bg-gold dark:text-ink",
        className
      )}
    >
      {initials(name)}
      <span className="sr-only">Assigned to {name}</span>
    </span>
  );
}

export function Stars({ rating }: { rating: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          viewBox="0 0 20 20"
          className={cn(
            "size-4",
            n <= rating ? "fill-gold" : "fill-line dark:fill-night-line"
          )}
          aria-hidden
        >
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}

/** Small labeled chip for UTM / meta values. */
export function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-0.5 text-xs dark:border-night-line">
      <span className="font-semibold text-muted">{label}</span>
      <span className="text-body dark:text-gray-200">{value}</span>
    </span>
  );
}
