"use client";

import { useCallback, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { cn, formatDateTime, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { FieldError, Label, Select, Textarea } from "@/components/ui/Field";
import {
  MISSED_CALL_STATUSES,
  MISSED_CALL_STATUS_META,
  type MissedCallStatus,
} from "./constants";
import { CrmEmptyState } from "./Bits";
import type { MissedCallDTO } from "./types";
import { PhoneMissed, Settings } from "lucide-react";

export function MissedCallsTable({ initialCalls }: { initialCalls: MissedCallDTO[] }) {
  const [calls, setCalls] = useState<MissedCallDTO[]>(initialCalls);
  const [statusFilter, setStatusFilter] = useState("");
  const [noteFor, setNoteFor] = useState<MissedCallDTO | null>(null);

  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showError = useCallback((message: string) => {
    setError(message);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(null), 6000);
  }, []);

  const filtered = useMemo(
    () => calls.filter((c) => !statusFilter || c.status === statusFilter),
    [calls, statusFilter]
  );

  const patchCall = useCallback(
    async (
      call: MissedCallDTO,
      status: MissedCallStatus,
      note?: string
    ): Promise<boolean> => {
      const before = call;
      setCalls((cur) => cur.map((c) => (c.id === call.id ? { ...c, status } : c)));
      setPendingIds((cur) => new Set(cur).add(call.id));
      try {
        const res = await fetch("/api/admin/missed-calls", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: call.id, status, note: note || undefined }),
        });
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { call?: MissedCallDTO };
        if (data.call) {
          setCalls((cur) => cur.map((c) => (c.id === call.id ? data.call! : c)));
        }
        return true;
      } catch {
        setCalls((cur) => cur.map((c) => (c.id === call.id ? before : c)));
        showError(`Could not update the call from ${call.phone}.`);
        return false;
      } finally {
        setPendingIds((cur) => {
          const next = new Set(cur);
          next.delete(call.id);
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
          <h1 className="display text-2xl text-ink dark:text-white">Missed Calls</h1>
          <p className="text-sm text-muted">
            {calls.length} missed call{calls.length === 1 ? "" : "s"} logged
          </p>
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="w-auto"
        >
          <option value="">All statuses</option>
          {MISSED_CALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {MISSED_CALL_STATUS_META[s].label}
            </option>
          ))}
        </Select>
      </div>

      {calls.length === 0 ? (
        <CrmEmptyState
          icon={<PhoneMissed className="size-6" />}
          title="No missed calls"
          hint="When a call goes unanswered, it is logged here so the caller can be texted back and followed up."
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted dark:border-night-line">
                <th className="px-4 py-3 font-semibold">Caller</th>
                <th className="px-4 py-3 font-semibold">Call time</th>
                <th className="px-4 py-3 font-semibold">Auto-text sent</th>
                <th className="px-4 py-3 font-semibold">Lead</th>
                <th className="px-4 py-3 font-semibold">Responded</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">
                  <span className="sr-only">Follow up</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted">
                    No calls with this status.
                  </td>
                </tr>
              )}
              {filtered.map((c) => {
                const pending = pendingIds.has(c.id);
                return (
                  <tr
                    key={c.id}
                    className={cn(
                      "border-b border-line/60 transition-opacity last:border-0 hover:bg-paper dark:border-night-line/60 dark:hover:bg-white/5",
                      pending && "opacity-50"
                    )}
                  >
                    <td className="px-4 py-3">
                      <a
                        href={`tel:${c.phone}`}
                        className="font-semibold text-ink underline-offset-2 hover:underline dark:text-white"
                      >
                        {c.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-muted" title={formatDateTime(c.callTime)}>
                      {formatDateTime(c.callTime)}
                      <span className="block text-xs">{timeAgo(c.callTime)}</span>
                    </td>
                    <td className="max-w-56 px-4 py-3">
                      {c.smsBody ? (
                        <p className="line-clamp-2 text-xs text-muted" title={c.smsBody}>
                          {c.smsBody}
                        </p>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {c.lead ? (
                        <Link
                          href={`/admin/leads/${c.lead.id}`}
                          className="text-xs font-semibold text-ink underline-offset-2 hover:underline dark:text-white"
                        >
                          {c.lead.name}
                        </Link>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {c.respondedAt ? timeAgo(c.respondedAt) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={c.status}
                        onChange={(e) => void patchCall(c, e.target.value as MissedCallStatus)}
                        aria-label={`Status of call from ${c.phone}`}
                        className="w-auto py-1.5 text-xs"
                        disabled={pending}
                      >
                        {MISSED_CALL_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {MISSED_CALL_STATUS_META[s].label}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="px-2.5 py-1 text-xs dark:border-white/40 dark:text-white dark:hover:bg-white dark:hover:text-ink"
                        onClick={() => setNoteFor(c)}
                      >
                        Log follow-up
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Config hint */}
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <Settings className="size-4 shrink-0 text-muted" aria-hidden />
        <p className="text-sm text-muted">
          The automatic text-back message for missed calls is configured in{" "}
          <Link
            href="/admin/settings"
            className="font-semibold text-ink underline-offset-2 hover:underline dark:text-white"
          >
            Settings
          </Link>
          .
        </p>
      </Card>

      {/* Error toast */}
      {error && (
        <div
          role="status"
          className="fixed right-4 bottom-4 z-[95] rounded-xl bg-danger px-4 py-3 text-sm font-semibold text-white shadow-lift"
        >
          {error}
        </div>
      )}

      {noteFor && (
        <FollowUpDialog
          key={noteFor.id}
          call={noteFor}
          onClose={() => setNoteFor(null)}
          onSave={async (status, note) => {
            const ok = await patchCall(noteFor, status, note);
            if (ok) setNoteFor(null);
            return ok;
          }}
        />
      )}
    </div>
  );
}

function FollowUpDialog({
  call,
  onClose,
  onSave,
}: {
  call: MissedCallDTO;
  onClose: () => void;
  onSave: (status: MissedCallStatus, note: string) => Promise<boolean>;
}) {
  const [status, setStatus] = useState<MissedCallStatus>(
    call.status === "NEW" || call.status === "TEXTED"
      ? "RESPONDED"
      : (call.status as MissedCallStatus)
  );
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    const ok = await onSave(status, note.trim());
    setSaving(false);
    if (!ok) setErr("The follow-up could not be saved. Please try again.");
  };

  return (
    <Dialog open onClose={onClose} title={`Follow up on ${call.phone}`}>
      <p className="mb-4 text-sm text-muted">
        Call missed {formatDateTime(call.callTime)}
        {call.lead ? ` — linked to lead ${call.lead.name}.` : "."}
      </p>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="mc-status">Status</Label>
          <Select
            id="mc-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as MissedCallStatus)}
          >
            {MISSED_CALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {MISSED_CALL_STATUS_META[s].label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="mc-note">Note</Label>
          <Textarea
            id="mc-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="What happened when you called back?"
            autoFocus
          />
          {call.leadId ? (
            <p className="mt-1 text-xs text-muted">
              The note is added to the linked lead&rsquo;s timeline.
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted">
              This call has no linked lead, so only the status is stored.
            </p>
          )}
        </div>
        <FieldError message={err ?? undefined} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={saving}>
            Save follow-up
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
