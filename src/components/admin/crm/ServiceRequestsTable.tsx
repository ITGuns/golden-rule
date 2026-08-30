"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge, Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Select } from "@/components/ui/Field";
import {
  SERVICE_REQUEST_STATUSES,
  SERVICE_REQUEST_STATUS_META,
  humanize,
  type ServiceRequestStatus,
} from "./constants";
import { CrmEmptyState, ServiceRequestStatusBadge } from "./Bits";
import { parseAttachments, type ServiceRequestDTO } from "./types";
import { ChevronDown, ClipboardList, Paperclip, Search } from "lucide-react";

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif)$/i;

export function ServiceRequestsTable({
  initialRequests,
}: {
  initialRequests: ServiceRequestDTO[];
}) {
  const [requests, setRequests] = useState<ServiceRequestDTO[]>(initialRequests);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [confirmClose, setConfirmClose] = useState<ServiceRequestDTO | null>(null);

  const showError = useCallback((message: string) => {
    setError(message);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(null), 6000);
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return requests.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (query) {
        const hay =
          `${r.firstName} ${r.lastName} ${r.email} ${r.phone} ${r.city} ${r.serviceType}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [requests, q, statusFilter]);

  const applyStatus = useCallback(
    async (request: ServiceRequestDTO, status: ServiceRequestStatus) => {
      if (request.status === status) return;
      const prev = request.status;
      setRequests((cur) => cur.map((r) => (r.id === request.id ? { ...r, status } : r)));
      setPendingIds((cur) => new Set(cur).add(request.id));
      try {
        const res = await fetch("/api/admin/service-requests", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: request.id, status }),
        });
        if (!res.ok) throw new Error();
      } catch {
        setRequests((cur) => cur.map((r) => (r.id === request.id ? { ...r, status: prev } : r)));
        showError(
          `Could not move the request from ${request.firstName} ${request.lastName}. Reverted.`
        );
      } finally {
        setPendingIds((cur) => {
          const next = new Set(cur);
          next.delete(request.id);
          return next;
        });
      }
    },
    [showError]
  );

  const requestStatus = useCallback(
    (request: ServiceRequestDTO, status: ServiceRequestStatus) => {
      if (status === "CLOSED") setConfirmClose(request);
      else void applyStatus(request, status);
    },
    [applyStatus]
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display text-2xl text-ink dark:text-white">Service Requests</h1>
          <p className="text-sm text-muted">
            {requests.length} request{requests.length === 1 ? "" : "s"} from the website wizard
          </p>
        </div>
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
            placeholder="Search name, email, phone, city…"
            aria-label="Search service requests"
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
          {SERVICE_REQUEST_STATUSES.map((s) => (
            <option key={s} value={s}>
              {SERVICE_REQUEST_STATUS_META[s].label}
            </option>
          ))}
        </Select>
      </Card>

      {requests.length === 0 ? (
        <CrmEmptyState
          icon={<ClipboardList className="size-6" />}
          title="No service requests yet"
          hint="Requests submitted through the website's request-service wizard will appear here."
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted dark:border-night-line">
                <th className="px-4 py-3 font-semibold">
                  <span className="sr-only">Expand</span>
                </th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Preferred</th>
                <th className="px-4 py-3 font-semibold">Lead</th>
                <th className="px-4 py-3 font-semibold">Files</th>
                <th className="px-4 py-3 font-semibold">Received</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted">
                    No requests match these filters.
                  </td>
                </tr>
              )}
              {filtered.map((r) => {
                const files = parseAttachments(r.attachments);
                const expanded = expandedId === r.id;
                return (
                  <RequestRow
                    key={r.id}
                    request={r}
                    files={files}
                    expanded={expanded}
                    pending={pendingIds.has(r.id)}
                    onToggle={() => setExpandedId(expanded ? null : r.id)}
                    onStatus={(s) => requestStatus(r, s)}
                  />
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

      {/* Confirm close */}
      <Dialog
        open={Boolean(confirmClose)}
        onClose={() => setConfirmClose(null)}
        title="Close this request?"
      >
        <p className="text-sm text-body dark:text-gray-300">
          {confirmClose
            ? `The request from ${confirmClose.firstName} ${confirmClose.lastName} will be marked closed. You can reopen it later by changing its status.`
            : ""}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setConfirmClose(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (confirmClose) void applyStatus(confirmClose, "CLOSED");
              setConfirmClose(null);
            }}
          >
            Close request
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function RequestRow({
  request: r,
  files,
  expanded,
  pending,
  onToggle,
  onStatus,
}: {
  request: ServiceRequestDTO;
  files: string[];
  expanded: boolean;
  pending: boolean;
  onToggle: () => void;
  onStatus: (s: ServiceRequestStatus) => void;
}) {
  return (
    <>
      <tr
        className={cn(
          "border-b border-line/60 transition-opacity dark:border-night-line/60 hover:bg-paper dark:hover:bg-white/5",
          pending && "opacity-50",
          expanded && "bg-paper dark:bg-white/5"
        )}
      >
        <td className="px-4 py-3">
          <button
            onClick={onToggle}
            aria-expanded={expanded}
            aria-label={`${expanded ? "Collapse" : "Expand"} request from ${r.firstName} ${r.lastName}`}
            className="rounded-lg p-1 text-muted transition-transform hover:bg-black/5 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
          >
            <ChevronDown
              className={cn("size-4 transition-transform", expanded && "rotate-180")}
              aria-hidden
            />
          </button>
        </td>
        <td className="px-4 py-3">
          <p className="font-semibold text-ink dark:text-white">
            {r.firstName} {r.lastName}
          </p>
          <p className="text-xs text-muted">
            {r.phone} · {r.email}
          </p>
        </td>
        <td className="px-4 py-3">
          <Badge tone="gold">{r.serviceType}</Badge>
          <p className="mt-1 text-xs text-muted">{humanize(r.customerType)}</p>
        </td>
        <td className="px-4 py-3 text-muted">
          {r.preferredDate || "Any day"}
          {r.preferredTime ? ` · ${r.preferredTime}` : ""}
        </td>
        <td className="px-4 py-3">
          {r.lead ? (
            <Link
              href={`/admin/leads/${r.lead.id}`}
              className="text-xs font-semibold text-ink underline-offset-2 hover:underline dark:text-white"
            >
              {r.lead.name}
            </Link>
          ) : (
            <span className="text-muted">—</span>
          )}
        </td>
        <td className="px-4 py-3">
          {files.length > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted">
              <Paperclip className="size-3.5" aria-hidden /> {files.length}
            </span>
          ) : (
            <span className="text-muted">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-muted" title={formatDate(r.createdAt)}>
          {timeAgo(r.createdAt)}
        </td>
        <td className="px-4 py-3">
          <Select
            value={r.status}
            onChange={(e) => onStatus(e.target.value as ServiceRequestStatus)}
            aria-label={`Status of request from ${r.firstName} ${r.lastName}`}
            className="w-auto py-1.5 text-xs"
            disabled={pending}
          >
            {SERVICE_REQUEST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {SERVICE_REQUEST_STATUS_META[s].label}
              </option>
            ))}
          </Select>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-line/60 bg-paper/60 dark:border-night-line/60 dark:bg-white/[0.03]">
          <td />
          <td colSpan={7} className="px-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="eyebrow text-xs text-muted">Service address</p>
                <p className="mt-1 text-sm text-body dark:text-gray-300">
                  {r.street}, {r.city} {r.zip}
                </p>
                <p className="mt-3 eyebrow text-xs text-muted">Status</p>
                <p className="mt-1">
                  <ServiceRequestStatusBadge status={r.status} />
                </p>
              </div>
              <div>
                <p className="eyebrow text-xs text-muted">Description</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-body dark:text-gray-300">
                  {r.description || "No description provided."}
                </p>
              </div>
            </div>
            {files.length > 0 && (
              <div className="mt-4">
                <p className="eyebrow text-xs text-muted">Attachments</p>
                <ul className="mt-2 flex flex-wrap gap-3">
                  {files.map((path) => {
                    const name = path.split("/").pop() || path;
                    const isImage = IMAGE_EXT.test(path);
                    return (
                      <li key={path}>
                        <a
                          href={path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-xl border border-line bg-white p-2 text-xs font-semibold text-ink transition-shadow hover:shadow-lift dark:border-night-line dark:bg-night-soft dark:text-white"
                        >
                          {isImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={path}
                              alt={`Attachment ${name}`}
                              className="size-12 rounded-lg object-cover"
                            />
                          ) : (
                            <Paperclip className="size-4 text-muted" aria-hidden />
                          )}
                          <span className="max-w-40 truncate">{name}</span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
