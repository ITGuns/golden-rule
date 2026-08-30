import type { Metadata } from "next";
import {
  BarChart3,
  CalendarClock,
  CheckCheck,
  Inbox,
  PhoneMissed,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";
import { getDashboardStats, resolveRange } from "@/lib/admin-stats";
import { Badge } from "@/components/ui/Card";
import { StatCard } from "@/components/admin/StatCard";
import { ChartCard } from "@/components/admin/ChartCard";
import { RangePicker } from "@/components/admin/RangePicker";
import { TrendChart } from "@/components/admin/charts/TrendChart";
import { BarsChart } from "@/components/admin/charts/BarsChart";
import { FunnelSection } from "@/components/admin/dashboard/FunnelSection";
import { AnalyticsSection } from "@/components/admin/dashboard/AnalyticsSection";
import { InsightsButton } from "@/components/admin/dashboard/InsightsButton";

export const metadata: Metadata = {
  title: "Dashboard",
  alternates: { canonical: "/admin" },
};

export const dynamic = "force-dynamic";

const RANGE_TITLES: Record<string, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  custom: "Custom range",
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const range = resolveRange(sp);
  const stats = await getDashboardStats(range);
  const { cards } = stats;

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink dark:text-white">
              Dashboard
            </h1>
            {stats.allDemo && <Badge tone="purple">Showing seeded demo data</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted dark:text-gray-400">
            Pipeline and performance — {RANGE_TITLES[stats.rangeKey] || "Selected range"}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RangePicker />
          <InsightsButton />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's Leads" value={String(cards.todaysLeads)} icon={Inbox} />
        <StatCard
          label="Open Opportunities"
          value={String(cards.openOpportunities)}
          icon={Target}
          hint="Leads not yet completed or closed"
        />
        <StatCard
          label="Scheduled Jobs"
          value={String(cards.scheduledJobs)}
          icon={CalendarClock}
          hint="Requested + confirmed in range"
        />
        <StatCard label="Completed Jobs" value={String(cards.completedJobs)} icon={CheckCheck} />
        <StatCard
          label="Recorded revenue"
          value={`$${cards.revenue.toLocaleString("en-US")}`}
          icon={BarChart3}
          hint="Value of completed + closed leads in range"
        />
        <StatCard
          label="Conversion Rate"
          value={cards.conversionRate === null ? "—" : `${cards.conversionRate}%`}
          icon={TrendingUp}
          hint={`Completed of ${cards.totalLeadsInRange} lead${
            cards.totalLeadsInRange === 1 ? "" : "s"
          } in range`}
        />
        <StatCard
          label="Review Requests Sent"
          value={String(cards.reviewRequestsSent)}
          icon={Star}
        />
        <StatCard label="Missed Calls" value={String(cards.missedCalls)} icon={PhoneMissed} />
      </div>

      {/* trends */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Lead trend" subtitle="New leads per day">
          <TrendChart data={stats.leadTrend} />
        </ChartCard>
        <ChartCard
          title="Recorded revenue trend"
          subtitle="Value of leads that reached Completed or Closed, by day created"
        >
          <TrendChart data={stats.revenueTrend} valuePrefix="$" />
        </ChartCard>
        <ChartCard title="Service demand" subtitle="Leads by requested service">
          <BarsChart data={stats.serviceDemand} />
        </ChartCard>
        <ChartCard title="Lead sources" subtitle="Leads by source channel">
          <BarsChart data={stats.leadSources} />
        </ChartCard>
      </div>

      {/* pipeline funnel */}
      <ChartCard
        title="Conversion pipeline"
        subtitle="Click a stage node to filter the lead list beneath"
      >
        <FunnelSection funnel={stats.funnel} leads={stats.recentLeads} />
      </ChartCard>

      {/* analytics */}
      <section aria-labelledby="analytics-heading" className="space-y-4">
        <div>
          <h2
            id="analytics-heading"
            className="font-display text-xl font-semibold tracking-tight text-ink dark:text-white"
          >
            Website analytics
          </h2>
          <p className="mt-1 text-sm text-muted dark:text-gray-400">
            How visitors move from the public site into the pipeline.
          </p>
        </div>
        <AnalyticsSection from={stats.from} to={stats.to} />
      </section>
    </div>
  );
}
