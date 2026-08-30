/**
 * Shared CRM display metadata: pipeline statuses, priorities, sources and the
 * color language used across the board, tables and calendar. Pure data — safe
 * to import from both server and client components.
 */

export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "ESTIMATE",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "REVIEW_REQUESTED",
  "CLOSED",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** The trailing statuses collapsed into a "Done" group on the compact board. */
export const DONE_STATUSES: LeadStatus[] = ["COMPLETED", "REVIEW_REQUESTED", "CLOSED"];

export type BadgeTone = "neutral" | "gold" | "green" | "red" | "blue" | "purple" | "orange";

export const LEAD_STATUS_META: Record<
  LeadStatus,
  { label: string; tone: BadgeTone; accent: string }
> = {
  NEW: { label: "New", tone: "blue", accent: "bg-sky-500" },
  CONTACTED: { label: "Contacted", tone: "purple", accent: "bg-violet-500" },
  QUALIFIED: { label: "Qualified", tone: "orange", accent: "bg-amber-500" },
  ESTIMATE: { label: "Estimate", tone: "gold", accent: "bg-gold" },
  SCHEDULED: { label: "Scheduled", tone: "blue", accent: "bg-blue-600" },
  IN_PROGRESS: { label: "In progress", tone: "purple", accent: "bg-indigo-500" },
  COMPLETED: { label: "Completed", tone: "green", accent: "bg-green-500" },
  REVIEW_REQUESTED: { label: "Review requested", tone: "gold", accent: "bg-gold-deep" },
  CLOSED: { label: "Closed", tone: "neutral", accent: "bg-gray-400" },
};

export const PRIORITIES = ["LOW", "NORMAL", "HIGH", "EMERGENCY"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_META: Record<Priority, { label: string; dot: string; tone: BadgeTone }> = {
  LOW: { label: "Low", dot: "bg-gray-400", tone: "neutral" },
  NORMAL: { label: "Normal", dot: "bg-sky-500", tone: "blue" },
  HIGH: { label: "High", dot: "bg-orange-500", tone: "orange" },
  EMERGENCY: { label: "Emergency", dot: "bg-red-500", tone: "red" },
};

export const LEAD_SOURCES = [
  "WEBSITE",
  "CHATBOT",
  "PHONE",
  "MISSED_CALL",
  "CONTACT_FORM",
  "SERVICE_REQUEST",
  "ESTIMATE_REQUEST",
  "FINANCING",
  "REFERRAL",
  "ORGANIC",
  "PAID",
  "SOCIAL",
  "OTHER",
] as const;

export const APPOINTMENT_STATUSES = [
  "REQUESTED",
  "CONFIRMED",
  "RESCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const APPOINTMENT_STATUS_META: Record<
  AppointmentStatus,
  { label: string; tone: BadgeTone; chip: string; dot: string }
> = {
  REQUESTED: {
    label: "Requested",
    tone: "orange",
    chip: "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
    dot: "bg-amber-500",
  },
  CONFIRMED: {
    label: "Confirmed",
    tone: "green",
    chip: "bg-green-100 text-green-900 dark:bg-green-500/20 dark:text-green-200",
    dot: "bg-green-500",
  },
  RESCHEDULED: {
    label: "Rescheduled",
    tone: "purple",
    chip: "bg-violet-100 text-violet-900 dark:bg-violet-500/20 dark:text-violet-200",
    dot: "bg-violet-500",
  },
  IN_PROGRESS: {
    label: "In progress",
    tone: "blue",
    chip: "bg-blue-100 text-blue-900 dark:bg-blue-500/20 dark:text-blue-200",
    dot: "bg-blue-600",
  },
  COMPLETED: {
    label: "Completed",
    tone: "green",
    chip: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200",
    dot: "bg-emerald-600",
  },
  CANCELLED: {
    label: "Cancelled",
    tone: "red",
    chip: "bg-red-100 text-red-900 dark:bg-red-500/20 dark:text-red-200",
    dot: "bg-red-500",
  },
  NO_SHOW: {
    label: "No-show",
    tone: "neutral",
    chip: "bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-gray-300",
    dot: "bg-gray-400",
  },
};

export const ESTIMATE_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "DECLINED"] as const;
export type EstimateStatus = (typeof ESTIMATE_STATUSES)[number];

export const ESTIMATE_STATUS_META: Record<EstimateStatus, { label: string; tone: BadgeTone }> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  SENT: { label: "Sent", tone: "blue" },
  ACCEPTED: { label: "Accepted", tone: "green" },
  DECLINED: { label: "Declined", tone: "red" },
};

export const MISSED_CALL_STATUSES = ["NEW", "TEXTED", "RESPONDED", "RESOLVED"] as const;
export type MissedCallStatus = (typeof MISSED_CALL_STATUSES)[number];

export const MISSED_CALL_STATUS_META: Record<MissedCallStatus, { label: string; tone: BadgeTone }> =
  {
    NEW: { label: "New", tone: "red" },
    TEXTED: { label: "Auto-texted", tone: "blue" },
    RESPONDED: { label: "Responded", tone: "gold" },
    RESOLVED: { label: "Resolved", tone: "green" },
  };

export const SERVICE_REQUEST_STATUSES = ["NEW", "REVIEWED", "SCHEDULED", "CLOSED"] as const;
export type ServiceRequestStatus = (typeof SERVICE_REQUEST_STATUSES)[number];

export const SERVICE_REQUEST_STATUS_META: Record<
  ServiceRequestStatus,
  { label: string; tone: BadgeTone }
> = {
  NEW: { label: "New", tone: "blue" },
  REVIEWED: { label: "Reviewed", tone: "purple" },
  SCHEDULED: { label: "Scheduled", tone: "gold" },
  CLOSED: { label: "Closed", tone: "neutral" },
};

export const REVIEW_REQUEST_STATUS_META: Record<string, { label: string; tone: BadgeTone }> = {
  PENDING: { label: "Pending", tone: "neutral" },
  SENT: { label: "Sent", tone: "blue" },
  COMPLETED: { label: "Completed", tone: "green" },
  DECLINED: { label: "Declined", tone: "red" },
};

/** "MISSED_CALL" → "Missed call" */
export function humanize(value: string | null | undefined): string {
  if (!value) return "—";
  const words = value.toLowerCase().replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
}
