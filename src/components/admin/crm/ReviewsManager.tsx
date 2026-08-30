"use client";

import { useCallback, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge, Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/Field";
import { REVIEW_REQUEST_STATUS_META, humanize } from "./constants";
import { CrmEmptyState, CrmStatCard, Stars } from "./Bits";
import type { ReviewDTO, ReviewRequestDTO } from "./types";
import {
  CheckCircle2,
  MessageSquareQuote,
  Percent,
  Search,
  Send,
  Star,
} from "lucide-react";

export type ReviewStats = {
  requested: number;
  sent: number;
  completed: number;
  responseRate: number;
};

export function ReviewsManager({
  initialReviews,
  initialRequests,
  stats,
}: {
  initialReviews: ReviewDTO[];
  initialRequests: ReviewRequestDTO[];
  stats: ReviewStats;
}) {
  const [reviews, setReviews] = useState<ReviewDTO[]>(initialReviews);
  const [q, setQ] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [responding, setResponding] = useState<ReviewDTO | null>(null);

  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showError = useCallback((message: string) => {
    setError(message);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(null), 6000);
  }, []);

  const sources = useMemo(
    () => Array.from(new Set(reviews.map((r) => r.source))).sort(),
    [reviews]
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return reviews.filter((r) => {
      if (sourceFilter && r.source !== sourceFilter) return false;
      if (query) {
        const hay = `${r.customerName} ${r.title ?? ""} ${r.text}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [reviews, q, sourceFilter]);

  const pendingRequests = useMemo(
    () => initialRequests.filter((r) => r.status === "PENDING" || r.status === "SENT"),
    [initialRequests]
  );

  const patchReview = useCallback(
    async (
      review: ReviewDTO,
      body: { published?: boolean; response?: string | null },
      failMessage: string
    ): Promise<boolean> => {
      const before = review;
      setReviews((cur) => cur.map((r) => (r.id === review.id ? { ...r, ...body } : r)));
      setPendingIds((cur) => new Set(cur).add(review.id));
      try {
        const res = await fetch("/api/admin/reviews", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: review.id, ...body }),
        });
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { review?: ReviewDTO };
        if (data.review) {
          setReviews((cur) => cur.map((r) => (r.id === review.id ? data.review! : r)));
        }
        return true;
      } catch {
        setReviews((cur) => cur.map((r) => (r.id === review.id ? before : r)));
        showError(failMessage);
        return false;
      } finally {
        setPendingIds((cur) => {
          const next = new Set(cur);
          next.delete(review.id);
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
          <h1 className="display text-2xl text-ink dark:text-white">Reviews</h1>
          <p className="text-sm text-muted">
            {reviews.length} review{reviews.length === 1 ? "" : "s"} ·{" "}
            {pendingRequests.length} open request{pendingRequests.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CrmStatCard
          label="Requested"
          value={stats.requested}
          icon={<MessageSquareQuote className="size-5" />}
          hint="All review requests"
        />
        <CrmStatCard label="Sent" value={stats.sent} icon={<Send className="size-5" />} />
        <CrmStatCard
          label="Completed"
          value={stats.completed}
          icon={<CheckCircle2 className="size-5" />}
        />
        <CrmStatCard
          label="Response rate"
          value={`${Math.round(stats.responseRate * 100)}%`}
          icon={<Percent className="size-5" />}
          hint="Completed ÷ sent"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Reviews table */}
        <div className="min-w-0 space-y-3">
          <Card className="flex flex-wrap items-center gap-2 p-3">
            <div className="relative min-w-44 flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search reviews…"
                aria-label="Search reviews"
                className="pl-9"
              />
            </div>
            <Select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              aria-label="Filter by source"
              className="w-auto"
            >
              <option value="">All sources</option>
              {sources.map((s) => (
                <option key={s} value={s}>
                  {humanize(s)}
                </option>
              ))}
            </Select>
          </Card>

          {reviews.length === 0 ? (
            <CrmEmptyState
              icon={<Star className="size-6" />}
              title="No reviews yet"
              hint="Reviews collected from customers will appear here for publishing and responses."
            />
          ) : (
            <Card className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs uppercase tracking-wide text-muted dark:border-night-line">
                    <th className="px-4 py-3 font-semibold">Review</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Source</th>
                    <th className="px-4 py-3 font-semibold">Published</th>
                    <th className="px-4 py-3 font-semibold">
                      <span className="sr-only">Respond</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-muted">
                        No reviews match these filters.
                      </td>
                    </tr>
                  )}
                  {filtered.map((r) => {
                    const pending = pendingIds.has(r.id);
                    return (
                      <tr
                        key={r.id}
                        className={cn(
                          "border-b border-line/60 align-top transition-opacity last:border-0 hover:bg-paper dark:border-night-line/60 dark:hover:bg-white/5",
                          pending && "opacity-50"
                        )}
                      >
                        <td className="max-w-sm px-4 py-3">
                          <Stars rating={r.rating} />
                          {r.title && (
                            <p className="mt-1 font-semibold text-ink dark:text-white">{r.title}</p>
                          )}
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted">{r.text}</p>
                          {r.response && (
                            <p className="mt-1.5 line-clamp-1 rounded-lg bg-gold-soft px-2 py-1 text-xs text-[#8a6d00] dark:bg-gold/15 dark:text-gold">
                              Reply: {r.response}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-ink dark:text-white">{r.customerName}</p>
                          <p className="text-xs text-muted" title={formatDate(r.createdAt)}>
                            {r.serviceDate
                              ? `Service ${formatDate(r.serviceDate)}`
                              : timeAgo(r.createdAt)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={r.source === "GOOGLE" ? "blue" : "neutral"}>
                            {humanize(r.source)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            role="switch"
                            aria-checked={r.published}
                            aria-label={`${r.published ? "Unpublish" : "Publish"} review from ${r.customerName}`}
                            disabled={pending}
                            onClick={() =>
                              void patchReview(
                                r,
                                { published: !r.published },
                                "Could not change the review's visibility."
                              )
                            }
                            className={cn(
                              "relative h-6 w-11 rounded-full transition-colors disabled:opacity-50",
                              r.published ? "bg-gold" : "bg-black/15 dark:bg-white/15"
                            )}
                          >
                            <span
                              className={cn(
                                "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform",
                                r.published && "translate-x-5"
                              )}
                              aria-hidden
                            />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="px-2.5 py-1 text-xs dark:border-white/40 dark:text-white dark:hover:bg-white dark:hover:text-ink"
                            onClick={() => setResponding(r)}
                          >
                            {r.response ? "Edit reply" : "Respond"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </div>

        {/* Pending review requests */}
        <aside className="space-y-3">
          <h2 className="display text-lg text-ink dark:text-white">Review requests</h2>
          {pendingRequests.length === 0 ? (
            <CrmEmptyState
              title="No open requests"
              hint="Move a completed lead to “Review requested” to ask for a review."
              className="py-8"
            />
          ) : (
            <ul className="space-y-2">
              {pendingRequests.map((req) => {
                const meta = REVIEW_REQUEST_STATUS_META[req.status];
                return (
                  <li key={req.id}>
                    <Card className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        {req.lead ? (
                          <Link
                            href={`/admin/leads/${req.lead.id}`}
                            className="truncate font-semibold text-ink hover:underline dark:text-white"
                          >
                            {req.lead.name}
                          </Link>
                        ) : (
                          <span className="text-sm text-muted">Lead removed</span>
                        )}
                        <Badge tone={meta?.tone ?? "neutral"}>
                          {meta?.label ?? humanize(req.status)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {humanize(req.channel)} ·{" "}
                        {req.sentAt ? `Sent ${timeAgo(req.sentAt)}` : `Created ${timeAgo(req.createdAt)}`}
                      </p>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>

      {/* Error toast */}
      {error && (
        <div
          role="status"
          className="fixed right-4 bottom-4 z-[95] rounded-xl bg-danger px-4 py-3 text-sm font-semibold text-white shadow-lift"
        >
          {error}
        </div>
      )}

      {responding && (
        <RespondDialog
          key={responding.id}
          review={responding}
          onClose={() => setResponding(null)}
          onSave={async (text) => {
            const ok = await patchReview(
              responding,
              { response: text || null },
              "Could not save the response."
            );
            if (ok) setResponding(null);
            return ok;
          }}
        />
      )}
    </div>
  );
}

function RespondDialog({
  review,
  onClose,
  onSave,
}: {
  review: ReviewDTO;
  onClose: () => void;
  onSave: (text: string) => Promise<boolean>;
}) {
  const [text, setText] = useState(review.response ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    const ok = await onSave(text.trim());
    setSaving(false);
    if (!ok) setErr("The response could not be saved. Please try again.");
  };

  return (
    <Dialog open onClose={onClose} title={`Respond to ${review.customerName}`}>
      <div className="mb-4 rounded-xl border border-line bg-paper p-3 dark:border-night-line dark:bg-white/[0.04]">
        <Stars rating={review.rating} />
        {review.title && (
          <p className="mt-1 text-sm font-semibold text-ink dark:text-white">{review.title}</p>
        )}
        <p className="mt-1 text-sm text-body dark:text-gray-300">{review.text}</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="rv-response">Your response</Label>
          <Textarea
            id="rv-response"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Thank the customer and address anything they raised…"
            autoFocus
          />
          <p className="mt-1 text-xs text-muted">
            Leave empty and save to remove an existing response.
          </p>
        </div>
        <FieldError message={err ?? undefined} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={saving}>
            Save response
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
