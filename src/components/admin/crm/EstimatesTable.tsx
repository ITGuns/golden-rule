"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Field";
import {
  ESTIMATE_STATUSES,
  ESTIMATE_STATUS_META,
  formatMoney,
  type EstimateStatus,
} from "./constants";
import { CrmEmptyState, CrmStatCard, EstimateStatusBadge } from "./Bits";
import type { EstimateDTO } from "./types";
import { Check, FileText, Search, Send, X } from "lucide-react";

/** Actions available from each status (mirrors the API's transition table). */
const NEXT_ACTIONS: Record<EstimateStatus, { to: EstimateStatus; label: string }[]> = {
  DRAFT: [{ to: "SENT", label: "Send" }],
  SENT: [
    { to: "ACCEPTED", label: "Accept" },
    { to: "DECLINED", label: "Decline" },
  ],
  ACCEPTED: [],
  DECLINED: [{ to: "SENT", label: "Re-send" }],
};

export function EstimatesTable({ initialEstimates }: { initialEstimates: EstimateDTO[] }) {
  const [estimates, setEstimates] = useState<EstimateDTO[]>(initialEstimates);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showError = useCallback((message: string) => {
    setError(message);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(null), 6000);
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return estimates.filter((e) => {
      if (statusFilter && e.status !== statusFilter) return false;
      if (query) {
        const hay = `${e.title} ${e.lead?.name ?? ""} ${e.notes ?? ""}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [estimates, q, statusFilter]);

  const stats = useMemo(() => {
    const accepted = estimates.filter((e) => e.status === "ACCEPTED");
    const open = estimates.filter((e) => e.status === "DRAFT" || e.status === "SENT");
    const acceptedValue = accepted.reduce((sum, e) => sum + (e.amount ?? 0), 0);
    return { total: estimates.length, open: open.length, accepted: accepted.length, acceptedValue };
  }, [estimates]);

  const transition = useCallback(
    async (estimate: EstimateDTO, to: EstimateStatus) => {
      const prev = estimate.status;
      setEstimates((cur) => cur.map((e) => (e.id === estimate.id ? { ...e, status: to } : e)));
      setPendingIds((cur) => new Set(cur).add(estimate.id));
      try {
        const res = await fetch(
          `/api/leads/${estimate.leadId}/estimates?estimateId=${encodeURIComponent(estimate.id)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: to }),
          }
        );
        if (!res.ok) throw new Error();
      } catch {
        setEstimates((cur) => cur.map((e) => (e.id === estimate.id ? { ...e, status: prev } : e)));
        showError(`Could not mark "${estimate.title}" as ${ESTIMATE_STATUS_META[to].label}.`);
      } finally {
        setPendingIds((cur) => {
          const next = new Set(cur);
          next.delete(estimate.id);
          return next;
        });
      }
    },
    [showError]
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display text-2xl text-ink dark:text-white">Estimates</h1>
          <p className="text-sm text-muted">
            {estimates.length} estimate{estimates.length === 1 ? "" : "s"} across all leads
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CrmStatCard label="Total" value={stats.total} icon={<FileText className="size-5" />} />
        <CrmStatCard label="Open" value={stats.open} hint="Draft or sent" />
        <CrmStatCard label="Accepted" value={stats.accepted} />
        <CrmStatCard
          label="Accepted value"
          value={formatMoney(stats.acceptedValue)}
          hint="Sum of accepted amounts"
        />
      </div>

      {/* Toolbar */}
      <Card className="flex flex-wrap items-center gap-2 p-3">
        <div className="relative min-w-52 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title or lead name…"
            aria-label="Search estimates"
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="w-auto"
        >
          <option value="">All statuses</option>
          {ESTIMATE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ESTIMATE_STATUS_META[s].label}
            </option>
          ))}
        </Select>
      </Card>

      {estimates.length === 0 ? (
        <CrmEmptyState
          icon={<FileText className="size-6" />}
          title="No estimates yet"
          hint="Create estimates from a lead's detail page — they will all be tracked here."
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted dark:border-night-line">
                <th className="px-4 py-3 font-semibold">Lead</th>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted">
                    No estimates match these filters.
                  </td>
                </tr>
              )}
              {filtered.map((e) => {
                const pending = pendingIds.has(e.id);
                const actions = NEXT_ACTIONS[e.status as EstimateStatus] ?? [];
                return (
                  <tr
                    key={e.id}
                    className={cn(
                      "border-b border-line/60 transition-opacity last:border-0 hover:bg-paper dark:border-night-line/60 dark:hover:bg-white/5",
                      pending && "opacity-50"
                    )}
                  >
                    <td className="px-4 py-3">
                      {e.lead ? (
                        <Link
                          href={`/admin/leads/${e.lead.id}`}
                          className="font-semibold text-ink hover:underline dark:text-white"
                        >
                          {e.lead.name}
                        </Link>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                      {e.lead?.service && <p className="text-xs text-muted">{e.lead.service}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink dark:text-white">{e.title}</p>
                      {e.notes && <p className="max-w-64 truncate text-xs text-muted">{e.notes}</p>}
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink dark:text-white">
                      {formatMoney(e.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <EstimateStatusBadge status={e.status} />
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(e.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {actions.length === 0 && <span className="text-xs text-muted">—</span>}
                        {actions.map((a) => (
                          <Button
                            key={a.to}
                            size="sm"
                            variant={a.to === "DECLINED" ? "danger" : "outline"}
                            className="px-2.5 py-1 text-xs dark:border-white/40 dark:text-white dark:hover:bg-white dark:hover:text-ink"
                            disabled={pending}
                            onClick={() => void transition(e, a.to)}
                          >
                            {a.to === "SENT" && <Send className="size-3" aria-hidden />}
                            {a.to === "ACCEPTED" && <Check className="size-3" aria-hidden />}
                            {a.to === "DECLINED" && <X className="size-3" aria-hidden />}
                            {a.label}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Error toast */}
      {error && (
        <div
          role="status"
          className="fixed right-4 bottom-4 z-[95] rounded-xl bg-danger px-4 py-3 text-sm font-semibold text-white shadow-lift"
        >
          {error}
        </div>
      )}
    </div>
  );
}
