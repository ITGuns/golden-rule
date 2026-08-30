import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileText } from "lucide-react";
import {
  buildReport,
  isReportType,
  REPORT_LABELS,
  REPORT_TYPES,
  resolveRange,
  type ReportType,
} from "@/lib/admin-stats";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { RangePicker } from "@/components/admin/RangePicker";
import { EmptyState } from "@/components/admin/EmptyState";

export const metadata: Metadata = {
  title: "Reports",
  alternates: { canonical: "/admin/reports" },
};

export const dynamic = "force-dynamic";

const PREVIEW_ROWS = 20;

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const range = resolveRange(sp);
  const typeRaw = Array.isArray(sp.type) ? sp.type[0] : sp.type;
  const type: ReportType = isReportType(typeRaw) ? typeRaw : "lead";
  const report = await buildReport(type, range.from, range.to);

  // Preserve the active range when switching report type.
  const rangeQS = new URLSearchParams();
  if (range.rangeKey === "custom") {
    rangeQS.set("from", isoDate(range.from));
    rangeQS.set("to", isoDate(range.to));
  } else {
    rangeQS.set("range", range.rangeKey);
  }

  const csvHref = `/api/admin/reports?type=${type}&from=${isoDate(range.from)}&to=${isoDate(
    range.to
  )}&format=csv`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink dark:text-white">
            Reports
          </h1>
          <p className="mt-1 text-sm text-muted dark:text-gray-400">
            Pick a report, set the range, preview it and export the full CSV.
          </p>
        </div>
        <RangePicker />
      </div>

      {/* report picker */}
      <div role="group" aria-label="Report type" className="flex flex-wrap gap-2">
        {REPORT_TYPES.map((t) => {
          const active = t === type;
          const qs = new URLSearchParams(rangeQS);
          qs.set("type", t);
          return (
            <Link
              key={t}
              href={`/admin/reports?${qs.toString()}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-ink text-white dark:bg-gold dark:text-ink"
                  : "border border-line text-body hover:bg-black/5 hover:text-ink dark:border-night-line dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
              )}
            >
              {REPORT_LABELS[t]}
            </Link>
          );
        })}
      </div>

      {/* preview */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold tracking-tight text-ink dark:text-white">
              {report.title}
            </h2>
            <p className="mt-0.5 text-xs text-muted dark:text-gray-400">
              {report.rows.length === 0
                ? "No rows in this range"
                : report.rows.length > PREVIEW_ROWS
                  ? `Previewing first ${PREVIEW_ROWS} of ${report.rows.length.toLocaleString(
                      "en-US"
                    )} rows — the CSV includes everything`
                  : `${report.rows.length.toLocaleString("en-US")} row${
                      report.rows.length === 1 ? "" : "s"
                    }`}
            </p>
          </div>
          <a
            href={csvHref}
            download
            className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-[15px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-night-soft dark:bg-gold dark:text-ink dark:hover:bg-gold-deep"
          >
            <Download className="size-4" aria-hidden />
            Export CSV
          </a>
        </div>

        {report.rows.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nothing to report for this range"
            hint="Try widening the date range or picking a different report type."
            className="mt-4"
          />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted dark:border-night-line dark:text-gray-400">
                  {report.columns.map((col) => (
                    <th key={col} scope="col" className="py-2 pr-4 font-semibold">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.rows.slice(0, PREVIEW_ROWS).map((row, ri) => (
                  <tr
                    key={ri}
                    className="border-b border-line/70 transition-colors hover:bg-black/[0.025] dark:border-night-line/70 dark:hover:bg-white/5"
                  >
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={cn(
                          "max-w-56 truncate py-2.5 pr-4",
                          typeof cell === "number"
                            ? "font-semibold text-ink tabular-nums dark:text-white"
                            : "text-body dark:text-gray-300"
                        )}
                      >
                        {typeof cell === "number" ? cell.toLocaleString("en-US") : cell || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
