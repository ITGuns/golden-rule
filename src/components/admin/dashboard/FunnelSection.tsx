"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Inbox, X } from "lucide-react";
import type { RecentLead } from "@/lib/admin-stats";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/Card";
import { EmptyState } from "@/components/admin/EmptyState";
import {
  FunnelGraph,
  FUNNEL_STAGE_LABELS,
  type FunnelStage,
} from "@/components/admin/charts/FunnelGraph";

const STATUS_TONES: Record<
  string,
  "neutral" | "gold" | "green" | "red" | "blue" | "purple" | "orange"
> = {
  NEW: "gold",
  CONTACTED: "blue",
  QUALIFIED: "purple",
  ESTIMATE: "orange",
  SCHEDULED: "blue",
  IN_PROGRESS: "orange",
  COMPLETED: "green",
  REVIEW_REQUESTED: "purple",
  CLOSED: "neutral",
};

function friendlySource(source: string) {
  return source.replace(/_/g, " ").toLowerCase();
}

/**
 * Conversion pipeline graph + recent-leads table. Clicking a funnel node
 * filters the table to that stage.
 */
export function FunnelSection({
  funnel,
  leads,
}: {
  funnel: FunnelStage[];
  leads: RecentLead[];
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(
    () => (selected ? leads.filter((l) => l.status === selected) : leads),
    [leads, selected]
  );
  const shown = filtered.slice(0, 10);
  const total = funnel.reduce((sum, s) => sum + s.count, 0);

  if (total === 0) {
    return (
      <EmptyState
        title="No leads in this range yet"
        hint="New leads from the website, chatbot and missed-call text-backs will appear in the pipeline here."
      />
    );
  }

  return (
    <div>
      <FunnelGraph stages={funnel} selected={selected} onSelect={setSelected} />

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4 dark:border-night-line">
        <h4 className="text-sm font-semibold text-ink dark:text-white">
          {selected ? `Leads in ${FUNNEL_STAGE_LABELS[selected] || selected}` : "Recent leads"}
        </h4>
        {selected && (
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-xs font-semibold text-gold-deep transition-colors hover:bg-gold/25 dark:text-gold"
          >
            <X className="size-3" aria-hidden /> Clear filter
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No recent leads in this stage"
          hint="The table shows the most recent leads in the selected range — pick another stage or clear the filter."
          className="mt-3 py-8"
        />
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted dark:border-night-line dark:text-gray-400">
                <th scope="col" className="py-2 pr-4 font-semibold">Name</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Service</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Status</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Source</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Value</th>
                <th scope="col" className="py-2 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-line/70 transition-colors hover:bg-black/[0.025] dark:border-night-line/70 dark:hover:bg-white/5"
                >
                  <td className="py-2.5 pr-4">
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="font-semibold text-ink hover:text-gold-deep dark:text-white dark:hover:text-gold"
                    >
                      {lead.name}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4 text-body dark:text-gray-300">
                    {lead.service || "—"}
                  </td>
                  <td className="py-2.5 pr-4">
                    <Badge tone={STATUS_TONES[lead.status] || "neutral"}>
                      {FUNNEL_STAGE_LABELS[lead.status] || lead.status}
                    </Badge>
                  </td>
                  <td className="py-2.5 pr-4 capitalize text-body dark:text-gray-300">
                    {friendlySource(lead.source)}
                  </td>
                  <td className="py-2.5 pr-4 text-body dark:text-gray-300">
                    {lead.value !== null ? `$${lead.value.toLocaleString("en-US")}` : "—"}
                  </td>
                  <td className="py-2.5 text-muted dark:text-gray-400">
                    {formatDateTime(lead.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
