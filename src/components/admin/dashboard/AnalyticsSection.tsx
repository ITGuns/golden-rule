"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bot,
  CheckCheck,
  Eye,
  Inbox,
  MousePointerClick,
  PhoneCall,
  RefreshCw,
} from "lucide-react";
import type { AnalyticsSummary } from "@/lib/admin-stats";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ChartCard } from "@/components/admin/ChartCard";
import { EmptyState } from "@/components/admin/EmptyState";

function pct(part: number, whole: number): string {
  if (whole === 0) return "—";
  return `${Math.round((part / whole) * 100)}%`;
}

function FunnelStep({
  icon: Icon,
  label,
  value,
  rate,
}: {
  icon: typeof Eye;
  label: string;
  value: number;
  rate?: string;
}) {
  return (
    <div className="rounded-2xl border border-line p-4 dark:border-night-line">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted dark:text-gray-400">
        <Icon className="size-4 text-gold-deep dark:text-gold" aria-hidden />
        {label}
      </div>
      <p className="mt-1.5 font-display text-2xl font-semibold text-ink dark:text-white">
        {value.toLocaleString("en-US")}
      </p>
      {rate && (
        <p className="mt-0.5 text-xs text-muted dark:text-gray-500">{rate} of previous step</p>
      )}
    </div>
  );
}

/**
 * Website analytics section on the dashboard — first-party events funnel,
 * top pages and traffic sources for the selected range.
 */
export function AnalyticsSection({ from, to }: { from: string; to: string }) {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/analytics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      );
      if (!res.ok) throw new Error("Request failed");
      setData((await res.json()) as AnalyticsSummary);
    } catch {
      setError("Couldn’t load analytics for this range.");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label="Loading analytics">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-line bg-black/5 dark:border-night-line dark:bg-white/5"
          />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        icon={RefreshCw}
        title="Analytics unavailable"
        hint={error || "Something went wrong loading analytics."}
        action={
          <Button variant="outline" size="sm" onClick={load}>
            Try again
          </Button>
        }
      />
    );
  }

  const { funnel, topPaths, sources, chat, phoneClicks, ctaClicks } = data;
  const noEvents =
    funnel.pageViews === 0 && funnel.formStarts === 0 && funnel.leads === 0 && phoneClicks === 0;

  if (noEvents) {
    return (
      <EmptyState
        icon={Eye}
        title="No website activity in this range"
        hint="Page views, form starts and phone clicks from the public site will show up here."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* conversion funnel */}
      <Card className="p-5">
        <h3 className="font-display text-base font-semibold tracking-tight text-ink dark:text-white">
          Visitor-to-lead funnel
        </h3>
        <p className="mt-0.5 text-xs text-muted dark:text-gray-400">
          First-party events only — no third-party trackers.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FunnelStep icon={Eye} label="Page views" value={funnel.pageViews} />
          <FunnelStep
            icon={MousePointerClick}
            label="Form starts"
            value={funnel.formStarts}
            rate={pct(funnel.formStarts, funnel.pageViews)}
          />
          <FunnelStep
            icon={CheckCheck}
            label="Forms completed"
            value={funnel.formCompletes}
            rate={pct(funnel.formCompletes, funnel.formStarts)}
          />
          <FunnelStep
            icon={Inbox}
            label="Leads"
            value={funnel.leads}
            rate={pct(funnel.leads, funnel.formCompletes)}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4 text-sm dark:border-night-line">
          <span className="inline-flex items-center gap-1.5 text-body dark:text-gray-300">
            <PhoneCall className="size-4 text-gold-deep dark:text-gold" aria-hidden />
            <strong className="text-ink dark:text-white">{phoneClicks.toLocaleString("en-US")}</strong>
            phone clicks
          </span>
          <span className="inline-flex items-center gap-1.5 text-body dark:text-gray-300">
            <Bot className="size-4 text-gold-deep dark:text-gold" aria-hidden />
            <strong className="text-ink dark:text-white">{chat.starts.toLocaleString("en-US")}</strong>
            chat starts
          </span>
          <span className="inline-flex items-center gap-1.5 text-body dark:text-gray-300">
            <Inbox className="size-4 text-gold-deep dark:text-gold" aria-hidden />
            <strong className="text-ink dark:text-white">{chat.leads.toLocaleString("en-US")}</strong>
            chat leads
          </span>
          <span className="inline-flex items-center gap-1.5 text-body dark:text-gray-300">
            <MousePointerClick className="size-4 text-gold-deep dark:text-gold" aria-hidden />
            <strong className="text-ink dark:text-white">{ctaClicks.toLocaleString("en-US")}</strong>
            CTA clicks
          </span>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Top pages" subtitle="By page views in the selected range">
          {topPaths.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted dark:text-gray-400">
              No page views recorded yet.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted dark:border-night-line dark:text-gray-400">
                  <th scope="col" className="py-2 pr-4 font-semibold">Path</th>
                  <th scope="col" className="py-2 text-right font-semibold">Views</th>
                </tr>
              </thead>
              <tbody>
                {topPaths.map((p) => (
                  <tr key={p.path} className="border-b border-line/70 dark:border-night-line/70">
                    <td className="max-w-0 truncate py-2 pr-4 font-mono text-xs text-body dark:text-gray-300">
                      {p.path}
                    </td>
                    <td className="py-2 text-right font-semibold text-ink dark:text-white">
                      {p.views.toLocaleString("en-US")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ChartCard>

        <ChartCard title="Traffic sources" subtitle="Leads grouped by UTM source">
          {sources.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted dark:text-gray-400">
              No leads with source data in this range.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted dark:border-night-line dark:text-gray-400">
                  <th scope="col" className="py-2 pr-4 font-semibold">Source</th>
                  <th scope="col" className="py-2 text-right font-semibold">Leads</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.source} className="border-b border-line/70 dark:border-night-line/70">
                    <td className="py-2 pr-4 text-body dark:text-gray-300">{s.source}</td>
                    <td className="py-2 text-right font-semibold text-ink dark:text-white">
                      {s.leads.toLocaleString("en-US")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
