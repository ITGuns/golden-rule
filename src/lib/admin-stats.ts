import { db } from "./db";
import { formatDateTime } from "./utils";

/**
 * Server-side query helpers for the admin dashboard, analytics, reports and
 * insights. All grouping is done in JS (SQLite-friendly, no raw SQL).
 */

/* ————————————————————————— ranges ————————————————————————— */

export const RANGE_KEYS = ["today", "7d", "30d", "90d", "custom"] as const;
export type RangeKey = (typeof RANGE_KEYS)[number];

export type ResolvedRange = {
  from: Date;
  to: Date;
  rangeKey: RangeKey;
};

const DAY_MS = 24 * 60 * 60 * 1000;
/** Custom ranges are clamped to one year so day-series stay bounded. */
const MAX_RANGE_DAYS = 366;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function endOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(23, 59, 59, 999);
  return c;
}

/**
 * Resolve `?range=today|7d|30d|90d` or `?from=YYYY-MM-DD&to=YYYY-MM-DD`
 * search params into a concrete date window. Defaults to the last 30 days.
 */
export function resolveRange(sp: {
  range?: string | string[];
  from?: string | string[];
  to?: string | string[];
}): ResolvedRange {
  const fromRaw = first(sp.from);
  const toRaw = first(sp.to);
  if (fromRaw && toRaw) {
    const f = new Date(fromRaw);
    const t = new Date(toRaw);
    if (!Number.isNaN(f.getTime()) && !Number.isNaN(t.getTime())) {
      let from = startOfDay(f);
      let to = endOfDay(t);
      if (from.getTime() > to.getTime()) [from, to] = [startOfDay(t), endOfDay(f)];
      if (to.getTime() - from.getTime() > MAX_RANGE_DAYS * DAY_MS) {
        from = startOfDay(new Date(to.getTime() - (MAX_RANGE_DAYS - 1) * DAY_MS));
      }
      return { from, to, rangeKey: "custom" };
    }
  }

  const range = first(sp.range);
  const now = new Date();
  const to = endOfDay(now);
  if (range === "today") return { from: startOfDay(now), to, rangeKey: "today" };
  if (range === "7d")
    return { from: startOfDay(new Date(now.getTime() - 6 * DAY_MS)), to, rangeKey: "7d" };
  if (range === "90d")
    return { from: startOfDay(new Date(now.getTime() - 89 * DAY_MS)), to, rangeKey: "90d" };
  return { from: startOfDay(new Date(now.getTime() - 29 * DAY_MS)), to, rangeKey: "30d" };
}

/* ————————————————————————— day series ————————————————————————— */

export type SeriesPoint = { label: string; value: number };

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function dayLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function buildDayBuckets(from: Date, to: Date): { key: string; label: string }[] {
  const buckets: { key: string; label: string }[] = [];
  const cursor = startOfDay(from);
  let guard = 0;
  while (cursor.getTime() <= to.getTime() && guard < MAX_RANGE_DAYS + 1) {
    buckets.push({ key: dayKey(cursor), label: dayLabel(cursor) });
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }
  return buckets;
}

function groupByDay(
  buckets: { key: string; label: string }[],
  rows: { createdAt: Date; amount?: number }[]
): SeriesPoint[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = dayKey(row.createdAt);
    map.set(key, (map.get(key) || 0) + (row.amount ?? 1));
  }
  return buckets.map((b) => ({ label: b.label, value: map.get(b.key) || 0 }));
}

function countBy<T>(rows: T[], pick: (row: T) => string): { label: string; value: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = pick(row);
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

/* ————————————————————————— dashboard ————————————————————————— */

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

export type RecentLead = {
  id: string;
  name: string;
  service: string | null;
  source: string;
  status: string;
  value: number | null;
  createdAt: string;
};

export type DashboardStats = {
  from: string;
  to: string;
  rangeKey: RangeKey;
  cards: {
    todaysLeads: number;
    openOpportunities: number;
    scheduledJobs: number;
    completedJobs: number;
    revenue: number;
    conversionRate: number | null;
    reviewRequestsSent: number;
    missedCalls: number;
    totalLeadsInRange: number;
  };
  leadTrend: SeriesPoint[];
  revenueTrend: SeriesPoint[];
  serviceDemand: SeriesPoint[];
  leadSources: SeriesPoint[];
  funnel: { status: string; count: number }[];
  recentLeads: RecentLead[];
  allDemo: boolean;
};

const COMPLETED_STATUSES = ["COMPLETED", "CLOSED"];

export async function getDashboardStats(range: ResolvedRange): Promise<DashboardStats> {
  const { from, to } = range;
  const inRange = { gte: from, lte: to };

  const [
    leads,
    todaysLeads,
    openOpportunities,
    scheduledJobs,
    completedJobs,
    reviewRequestsSent,
    missedCalls,
  ] = await Promise.all([
    db.lead.findMany({
      where: { createdAt: inRange },
      select: {
        id: true,
        name: true,
        service: true,
        source: true,
        status: true,
        value: true,
        isDemo: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.lead.count({ where: { createdAt: { gte: startOfDay(new Date()) } } }),
    db.lead.count({ where: { status: { notIn: COMPLETED_STATUSES } } }),
    db.appointment.count({
      where: { status: { in: ["CONFIRMED", "REQUESTED"] }, start: inRange },
    }),
    db.appointment.count({ where: { status: "COMPLETED", start: inRange } }),
    db.reviewRequest.count({ where: { sentAt: inRange } }),
    db.missedCall.count({ where: { callTime: inRange } }),
  ]);

  const buckets = buildDayBuckets(from, to);
  const completedLeads = leads.filter((l) => COMPLETED_STATUSES.includes(l.status));
  const revenue = completedLeads.reduce((sum, l) => sum + (l.value || 0), 0);
  const completedCount = leads.filter((l) => l.status === "COMPLETED").length;

  const funnelMap = new Map<string, number>();
  for (const l of leads) funnelMap.set(l.status, (funnelMap.get(l.status) || 0) + 1);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    rangeKey: range.rangeKey,
    cards: {
      todaysLeads,
      openOpportunities,
      scheduledJobs,
      completedJobs,
      revenue,
      conversionRate:
        leads.length > 0 ? Math.round((completedCount / leads.length) * 100) : null,
      reviewRequestsSent,
      missedCalls,
      totalLeadsInRange: leads.length,
    },
    leadTrend: groupByDay(buckets, leads),
    revenueTrend: groupByDay(
      buckets,
      completedLeads.map((l) => ({ createdAt: l.createdAt, amount: l.value || 0 }))
    ),
    serviceDemand: countBy(leads, (l) => l.service || "Unspecified").slice(0, 8),
    leadSources: countBy(leads, (l) =>
      l.source.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase())
    ).slice(0, 8),
    funnel: LEAD_STATUSES.map((status) => ({ status, count: funnelMap.get(status) || 0 })),
    recentLeads: leads.slice(0, 25).map((l) => ({
      id: l.id,
      name: l.name,
      service: l.service,
      source: l.source,
      status: l.status,
      value: l.value,
      createdAt: l.createdAt.toISOString(),
    })),
    allDemo: leads.length > 0 && leads.every((l) => l.isDemo),
  };
}

/* ————————————————————————— analytics ————————————————————————— */

export type AnalyticsSummary = {
  from: string;
  to: string;
  totalsByType: { type: string; count: number }[];
  byDay: { label: string; pageViews: number; formStarts: number; formCompletes: number }[];
  topPaths: { path: string; views: number }[];
  funnel: { pageViews: number; formStarts: number; formCompletes: number; leads: number };
  chat: { starts: number; leads: number };
  phoneClicks: number;
  ctaClicks: number;
  sources: { source: string; leads: number }[];
  totalLeads: number;
};

export async function getAnalyticsSummary(from: Date, to: Date): Promise<AnalyticsSummary> {
  const inRange = { gte: from, lte: to };
  const [events, leadRows] = await Promise.all([
    db.analyticsEvent.findMany({
      where: { createdAt: inRange },
      select: { type: true, path: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      take: 50000,
    }),
    db.lead.findMany({
      where: { createdAt: inRange },
      select: { utmSource: true, source: true },
    }),
  ]);

  const totals = new Map<string, number>();
  const pathViews = new Map<string, number>();
  const buckets = buildDayBuckets(from, to);
  const byDayMap = new Map<
    string,
    { pageViews: number; formStarts: number; formCompletes: number }
  >();

  for (const e of events) {
    totals.set(e.type, (totals.get(e.type) || 0) + 1);
    const key = dayKey(e.createdAt);
    const day = byDayMap.get(key) || { pageViews: 0, formStarts: 0, formCompletes: 0 };
    if (e.type === "page_view") {
      day.pageViews += 1;
      if (e.path) pathViews.set(e.path, (pathViews.get(e.path) || 0) + 1);
    } else if (e.type === "form_start") day.formStarts += 1;
    else if (e.type === "form_complete") day.formCompletes += 1;
    byDayMap.set(key, day);
  }

  const sources = new Map<string, number>();
  for (const l of leadRows) {
    const key = l.utmSource || "Direct / none";
    sources.set(key, (sources.get(key) || 0) + 1);
  }

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    totalsByType: [...totals.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count),
    byDay: buckets.map((b) => {
      const day = byDayMap.get(b.key) || { pageViews: 0, formStarts: 0, formCompletes: 0 };
      return { label: b.label, ...day };
    }),
    topPaths: [...pathViews.entries()]
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10),
    funnel: {
      pageViews: totals.get("page_view") || 0,
      formStarts: totals.get("form_start") || 0,
      formCompletes: totals.get("form_complete") || 0,
      leads: leadRows.length,
    },
    chat: { starts: totals.get("chat_start") || 0, leads: totals.get("chat_lead") || 0 },
    phoneClicks: totals.get("phone_click") || 0,
    ctaClicks: totals.get("cta_click") || 0,
    sources: [...sources.entries()]
      .map(([source, leads]) => ({ source, leads }))
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 10),
    totalLeads: leadRows.length,
  };
}

/* ————————————————————————— insights ————————————————————————— */

export type InsightMetrics = {
  computedAt: string;
  leads30: number;
  leadsPrev30: number;
  leadVolumeDeltaPct: number | null;
  leads90: number;
  topServices: { service: string; count: number }[];
  sourceMix: { source: string; count: number; sharePct: number }[];
  funnel90: { status: string; count: number }[];
  conversionRate90Pct: number | null;
  missedCalls90: {
    total: number;
    responded: number;
    responseRatePct: number | null;
    avgResponseMinutes: number | null;
  };
  reviewRequests90: { sent: number; completed: number; conversionPct: number | null };
  avgHoursNewToContacted: number | null;
};

export async function computeInsightMetrics(): Promise<InsightMetrics> {
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * DAY_MS);
  const d60 = new Date(now.getTime() - 60 * DAY_MS);
  const d90 = new Date(now.getTime() - 90 * DAY_MS);

  const [leads30, leadsPrev30, leads90rows, missed, reviewReqs, contactActivities] =
    await Promise.all([
      db.lead.count({ where: { createdAt: { gte: d30 } } }),
      db.lead.count({ where: { createdAt: { gte: d60, lt: d30 } } }),
      db.lead.findMany({
        where: { createdAt: { gte: d90 } },
        select: { service: true, source: true, status: true },
      }),
      db.missedCall.findMany({
        where: { callTime: { gte: d90 } },
        select: { status: true, callTime: true, respondedAt: true },
      }),
      db.reviewRequest.findMany({
        where: { createdAt: { gte: d90 } },
        select: { status: true, sentAt: true },
      }),
      db.leadActivity.findMany({
        where: { type: "STATUS_CHANGE", createdAt: { gte: d90 } },
        select: {
          leadId: true,
          description: true,
          meta: true,
          createdAt: true,
          lead: { select: { createdAt: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

  const leadVolumeDeltaPct =
    leadsPrev30 > 0 ? Math.round(((leads30 - leadsPrev30) / leadsPrev30) * 100) : null;

  const serviceCounts = new Map<string, number>();
  const sourceCounts = new Map<string, number>();
  const funnelCounts = new Map<string, number>();
  for (const l of leads90rows) {
    const svc = l.service || "Unspecified";
    serviceCounts.set(svc, (serviceCounts.get(svc) || 0) + 1);
    sourceCounts.set(l.source, (sourceCounts.get(l.source) || 0) + 1);
    funnelCounts.set(l.status, (funnelCounts.get(l.status) || 0) + 1);
  }
  const total90 = leads90rows.length;
  const completed90 = leads90rows.filter((l) => l.status === "COMPLETED").length;

  // Missed-call response stats
  const respondedCalls = missed.filter(
    (m) => m.respondedAt !== null || m.status === "RESPONDED" || m.status === "RESOLVED"
  );
  const responseTimes = missed
    .filter((m) => m.respondedAt !== null)
    .map((m) => (m.respondedAt as Date).getTime() - m.callTime.getTime())
    .filter((ms) => ms >= 0);
  const avgResponseMinutes =
    responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 60000)
      : null;

  // Review request conversion
  const sentReqs = reviewReqs.filter((r) => r.sentAt !== null || r.status !== "PENDING");
  const completedReqs = reviewReqs.filter((r) => r.status === "COMPLETED");

  // Average time from NEW to CONTACTED via the first matching STATUS_CHANGE activity.
  const firstContact = new Map<string, number>();
  for (const a of contactActivities) {
    if (firstContact.has(a.leadId)) continue;
    let toContacted = /contacted/i.test(a.description);
    if (!toContacted && a.meta) {
      try {
        const meta = JSON.parse(a.meta) as { to?: string };
        toContacted = meta?.to === "CONTACTED";
      } catch {
        // ignore unparseable meta
      }
    }
    if (!toContacted) continue;
    const hours = (a.createdAt.getTime() - a.lead.createdAt.getTime()) / 3600000;
    if (hours >= 0) firstContact.set(a.leadId, hours);
  }
  const contactHours = [...firstContact.values()];
  const avgHoursNewToContacted =
    contactHours.length > 0
      ? Math.round((contactHours.reduce((a, b) => a + b, 0) / contactHours.length) * 10) / 10
      : null;

  return {
    computedAt: now.toISOString(),
    leads30,
    leadsPrev30,
    leadVolumeDeltaPct,
    leads90: total90,
    topServices: [...serviceCounts.entries()]
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    sourceMix: [...sourceCounts.entries()]
      .map(([source, count]) => ({
        source,
        count,
        sharePct: total90 > 0 ? Math.round((count / total90) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count),
    funnel90: LEAD_STATUSES.map((status) => ({
      status,
      count: funnelCounts.get(status) || 0,
    })),
    conversionRate90Pct: total90 > 0 ? Math.round((completed90 / total90) * 100) : null,
    missedCalls90: {
      total: missed.length,
      responded: respondedCalls.length,
      responseRatePct:
        missed.length > 0 ? Math.round((respondedCalls.length / missed.length) * 100) : null,
      avgResponseMinutes,
    },
    reviewRequests90: {
      sent: sentReqs.length,
      completed: completedReqs.length,
      conversionPct:
        sentReqs.length > 0
          ? Math.round((completedReqs.length / sentReqs.length) * 100)
          : null,
    },
    avgHoursNewToContacted,
  };
}

/* ————————————————————————— reports ————————————————————————— */

export const REPORT_TYPES = [
  "lead",
  "revenue",
  "service",
  "marketing",
  "review",
  "technician",
  "appointment",
] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_LABELS: Record<ReportType, string> = {
  lead: "Lead Report",
  revenue: "Revenue Report",
  service: "Service Report",
  marketing: "Marketing Report",
  review: "Review Report",
  technician: "Technician Report",
  appointment: "Appointment Report",
};

export type ReportData = {
  type: ReportType;
  title: string;
  columns: string[];
  rows: (string | number)[][];
};

export function isReportType(v: string | undefined): v is ReportType {
  return typeof v === "string" && (REPORT_TYPES as readonly string[]).includes(v);
}

export async function buildReport(
  type: ReportType,
  from: Date,
  to: Date
): Promise<ReportData> {
  const inRange = { gte: from, lte: to };
  const title = REPORT_LABELS[type];

  if (type === "lead") {
    const rows = await db.lead.findMany({
      where: { createdAt: inRange },
      select: {
        createdAt: true,
        name: true,
        email: true,
        phone: true,
        service: true,
        source: true,
        status: true,
        priority: true,
        value: true,
        assignedTo: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return {
      type,
      title,
      columns: [
        "Created",
        "Name",
        "Email",
        "Phone",
        "Service",
        "Source",
        "Status",
        "Priority",
        "Value",
        "Assigned To",
      ],
      rows: rows.map((l) => [
        formatDateTime(l.createdAt),
        l.name,
        l.email || "",
        l.phone || "",
        l.service || "",
        l.source,
        l.status,
        l.priority,
        l.value ?? "",
        l.assignedTo?.name || "",
      ]),
    };
  }

  if (type === "revenue") {
    const rows = await db.lead.findMany({
      where: { createdAt: inRange, status: { in: COMPLETED_STATUSES }, value: { not: null } },
      select: {
        createdAt: true,
        name: true,
        service: true,
        source: true,
        status: true,
        value: true,
      },
      orderBy: { value: "desc" },
    });
    return {
      type,
      title,
      columns: ["Created", "Name", "Service", "Source", "Status", "Recorded Value"],
      rows: rows.map((l) => [
        formatDateTime(l.createdAt),
        l.name,
        l.service || "",
        l.source,
        l.status,
        l.value ?? 0,
      ]),
    };
  }

  if (type === "service") {
    const leads = await db.lead.findMany({
      where: { createdAt: inRange },
      select: { service: true, status: true, value: true },
    });
    const groups = new Map<string, { total: number; completed: number; value: number }>();
    for (const l of leads) {
      const key = l.service || "Unspecified";
      const g = groups.get(key) || { total: 0, completed: 0, value: 0 };
      g.total += 1;
      if (COMPLETED_STATUSES.includes(l.status)) {
        g.completed += 1;
        g.value += l.value || 0;
      }
      groups.set(key, g);
    }
    return {
      type,
      title,
      columns: ["Service", "Leads", "Completed", "Conversion %", "Recorded Value"],
      rows: [...groups.entries()]
        .sort((a, b) => b[1].total - a[1].total)
        .map(([service, g]) => [
          service,
          g.total,
          g.completed,
          g.total > 0 ? Math.round((g.completed / g.total) * 100) : 0,
          g.value,
        ]),
    };
  }

  if (type === "marketing") {
    const leads = await db.lead.findMany({
      where: { createdAt: inRange },
      select: {
        source: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        status: true,
        value: true,
      },
    });
    const groups = new Map<
      string,
      {
        source: string;
        utmSource: string;
        utmMedium: string;
        utmCampaign: string;
        total: number;
        completed: number;
        value: number;
      }
    >();
    for (const l of leads) {
      const key = [l.source, l.utmSource || "", l.utmMedium || "", l.utmCampaign || ""].join("|");
      const g =
        groups.get(key) ||
        {
          source: l.source,
          utmSource: l.utmSource || "",
          utmMedium: l.utmMedium || "",
          utmCampaign: l.utmCampaign || "",
          total: 0,
          completed: 0,
          value: 0,
        };
      g.total += 1;
      if (COMPLETED_STATUSES.includes(l.status)) {
        g.completed += 1;
        g.value += l.value || 0;
      }
      groups.set(key, g);
    }
    return {
      type,
      title,
      columns: [
        "Source",
        "UTM Source",
        "UTM Medium",
        "UTM Campaign",
        "Leads",
        "Completed",
        "Conversion %",
        "Recorded Value",
      ],
      rows: [...groups.values()]
        .sort((a, b) => b.total - a.total)
        .map((g) => [
          g.source,
          g.utmSource,
          g.utmMedium,
          g.utmCampaign,
          g.total,
          g.completed,
          g.total > 0 ? Math.round((g.completed / g.total) * 100) : 0,
          g.value,
        ]),
    };
  }

  if (type === "review") {
    const rows = await db.review.findMany({
      where: { createdAt: inRange },
      select: {
        createdAt: true,
        customerName: true,
        rating: true,
        title: true,
        source: true,
        published: true,
        response: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return {
      type,
      title,
      columns: ["Created", "Customer", "Rating", "Title", "Source", "Published", "Responded"],
      rows: rows.map((r) => [
        formatDateTime(r.createdAt),
        r.customerName,
        r.rating,
        r.title || "",
        r.source,
        r.published ? "Yes" : "No",
        r.response ? "Yes" : "No",
      ]),
    };
  }

  if (type === "technician") {
    const appts = await db.appointment.findMany({
      where: { start: inRange },
      select: {
        status: true,
        start: true,
        technician: { select: { id: true, name: true } },
      },
    });
    const now = Date.now();
    const groups = new Map<
      string,
      { name: string; total: number; completed: number; cancelled: number; noShow: number; upcoming: number }
    >();
    for (const a of appts) {
      const key = a.technician?.id || "unassigned";
      const g =
        groups.get(key) ||
        {
          name: a.technician?.name || "Unassigned",
          total: 0,
          completed: 0,
          cancelled: 0,
          noShow: 0,
          upcoming: 0,
        };
      g.total += 1;
      if (a.status === "COMPLETED") g.completed += 1;
      else if (a.status === "CANCELLED") g.cancelled += 1;
      else if (a.status === "NO_SHOW") g.noShow += 1;
      else if (a.start.getTime() > now) g.upcoming += 1;
      groups.set(key, g);
    }
    return {
      type,
      title,
      columns: ["Technician", "Appointments", "Completed", "Cancelled", "No-shows", "Upcoming"],
      rows: [...groups.values()]
        .sort((a, b) => b.total - a.total)
        .map((g) => [g.name, g.total, g.completed, g.cancelled, g.noShow, g.upcoming]),
    };
  }

  // appointment
  const appts = await db.appointment.findMany({
    where: { start: inRange },
    select: {
      start: true,
      end: true,
      service: true,
      status: true,
      location: true,
      technician: { select: { name: true } },
      customer: { select: { firstName: true, lastName: true } },
      lead: { select: { name: true } },
    },
    orderBy: { start: "asc" },
  });
  return {
    type,
    title,
    columns: ["Start", "End", "Service", "Status", "Technician", "Customer", "Location"],
    rows: appts.map((a) => [
      formatDateTime(a.start),
      formatDateTime(a.end),
      a.service,
      a.status,
      a.technician?.name || "",
      a.customer ? `${a.customer.firstName} ${a.customer.lastName}` : a.lead?.name || "",
      a.location || "",
    ]),
  };
}
