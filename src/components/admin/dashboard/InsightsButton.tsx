"use client";

import { useState } from "react";
import { Lightbulb, Loader2, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { formatDateTime } from "@/lib/utils";

type Insight = { title: string; detail: string; metric: string };
type Recommendation = { title: string; detail: string; action: string };
type InsightsPayload = {
  generatedAt: string;
  insights: Insight[];
  recommendations: Recommendation[];
  aiSummary?: string;
};

/**
 * "Generate Business Insights" — POSTs /api/admin/insights and renders the
 * deterministic analysis (plus the optional AI summary) in a dialog.
 */
export function InsightsButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<InsightsPayload | null>(null);

  async function generate() {
    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/insights", { method: "POST" });
      if (!res.ok) throw new Error("Request failed");
      setData((await res.json()) as InsightsPayload);
    } catch {
      setError("Couldn’t generate insights right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="dark" size="sm" onClick={generate} className="dark:bg-white/10 dark:hover:bg-white/20">
        <Sparkles className="size-4 text-gold" aria-hidden />
        Generate Business Insights
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Business insights"
        className="max-w-2xl"
      >
        {loading && (
          <div className="flex flex-col items-center gap-3 py-10" aria-busy="true">
            <Loader2 className="size-8 animate-spin text-gold" aria-hidden />
            <p className="text-sm text-muted dark:text-gray-400">
              Analyzing the last 90 days of pipeline data…
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="py-6 text-center">
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
            <Button variant="outline" size="sm" onClick={generate} className="mt-4">
              Try again
            </Button>
          </div>
        )}

        {!loading && !error && data && (
          <div className="space-y-6">
            <p className="text-xs text-muted dark:text-gray-500">
              Generated {formatDateTime(data.generatedAt)} from live database metrics.
            </p>

            {data.aiSummary && (
              <div className="rounded-2xl border border-gold/40 bg-gold-soft/60 p-4 dark:bg-gold/10">
                <p className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold-deep dark:text-gold">
                  <Sparkles className="size-3.5" aria-hidden /> Summary
                </p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-body dark:text-gray-200">
                  {data.aiSummary}
                </p>
              </div>
            )}

            <section aria-labelledby="insights-heading">
              <h3
                id="insights-heading"
                className="mb-2 inline-flex items-center gap-1.5 font-display text-sm font-semibold text-ink dark:text-white"
              >
                <Lightbulb className="size-4 text-gold-deep dark:text-gold" aria-hidden />
                What the numbers say
              </h3>
              {data.insights.length === 0 ? (
                <p className="text-sm text-muted dark:text-gray-400">
                  Not enough data to compute insights yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {data.insights.map((insight) => (
                    <li
                      key={insight.title}
                      className="rounded-xl border border-line p-3.5 dark:border-night-line"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-ink dark:text-white">
                          {insight.title}
                        </p>
                        <Badge tone="gold" className="shrink-0">
                          {insight.metric}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-body dark:text-gray-300">{insight.detail}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="recs-heading">
              <h3
                id="recs-heading"
                className="mb-2 inline-flex items-center gap-1.5 font-display text-sm font-semibold text-ink dark:text-white"
              >
                <Target className="size-4 text-gold-deep dark:text-gold" aria-hidden />
                Recommended next steps
              </h3>
              {data.recommendations.length === 0 ? (
                <p className="text-sm text-muted dark:text-gray-400">
                  No recommendations triggered — the current metrics are inside every threshold
                  the analyzer checks.
                </p>
              ) : (
                <ol className="space-y-3">
                  {data.recommendations.map((rec, i) => (
                    <li
                      key={rec.title}
                      className="flex gap-3 rounded-xl border border-line p-3.5 dark:border-night-line"
                    >
                      <span
                        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold font-display text-xs font-bold text-ink"
                        aria-hidden
                      >
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink dark:text-white">{rec.title}</p>
                        <p className="mt-0.5 text-sm text-body dark:text-gray-300">{rec.detail}</p>
                        <p className="mt-1 text-sm font-semibold text-gold-deep dark:text-gold">
                          → {rec.action}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        )}
      </Dialog>
    </>
  );
}
