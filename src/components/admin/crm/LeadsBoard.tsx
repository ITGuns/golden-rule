"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import Link from "next/link";
import { SERVICE_TYPES } from "@/lib/site";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge, Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/Field";
import {
  DONE_STATUSES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  LEAD_STATUS_META,
  PRIORITIES,
  PRIORITY_META,
  formatMoney,
  humanize,
  type LeadStatus,
} from "./constants";
import { AssigneeAvatar, CrmEmptyState, LeadStatusBadge, PriorityDot } from "./Bits";
import type { LeadListItem, TeamMember } from "./types";
import {
  ArrowDownUp,
  Inbox,
  Kanban,
  Plus,
  Search,
  Table2,
} from "lucide-react";

const ACTIVE_STATUSES = LEAD_STATUSES.filter(
  (s) => !DONE_STATUSES.includes(s)
) as LeadStatus[];

type SortKey = "name" | "status" | "priority" | "service" | "source" | "value" | "createdAt";

export function LeadsBoard({
  initialLeads,
  team,
  autoNew,
}: {
  initialLeads: LeadListItem[];
  team: TeamMember[];
  autoNew?: boolean;
}) {
  const [leads, setLeads] = useState<LeadListItem[]>(initialLeads);
  const [view, setView] = useState<"board" | "table">("board");
  const [expandDone, setExpandDone] = useState(false);

  // Filters
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");

  // Mutation state
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drag state
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // Confirm-before-close
  const [confirmMove, setConfirmMove] = useState<{ lead: LeadListItem; to: LeadStatus } | null>(
    null
  );

  // New-lead dialog
  const [newOpen, setNewOpen] = useState(Boolean(autoNew));
  useEffect(() => {
    if (autoNew) setNewOpen(true);
  }, [autoNew]);

  // Table sorting
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "createdAt", dir: -1 });

  const showError = useCallback((message: string) => {
    setError(message);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(null), 6000);
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return leads.filter((l) => {
      if (query) {
        const hay = `${l.name} ${l.email ?? ""} ${l.phone ?? ""}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      if (statusFilter && l.status !== statusFilter) return false;
      if (sourceFilter && l.source !== sourceFilter) return false;
      if (serviceFilter && l.service !== serviceFilter) return false;
      if (assigneeFilter === "unassigned" && l.assignedToId) return false;
      if (assigneeFilter && assigneeFilter !== "unassigned" && l.assignedToId !== assigneeFilter)
        return false;
      return true;
    });
  }, [leads, q, statusFilter, sourceFilter, serviceFilter, assigneeFilter]);

  const applyStatus = useCallback(
    async (lead: LeadListItem, to: LeadStatus) => {
      if (lead.status === to) return;
      const prevStatus = lead.status;
      setLeads((cur) => cur.map((l) => (l.id === lead.id ? { ...l, status: to } : l)));
      setPendingIds((cur) => new Set(cur).add(lead.id));
      try {
        const res = await fetch(`/api/leads/${lead.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: to }),
        });
        if (!res.ok) throw new Error();
      } catch {
        setLeads((cur) => cur.map((l) => (l.id === lead.id ? { ...l, status: prevStatus } : l)));
        showError(`Could not move ${lead.name} to ${LEAD_STATUS_META[to].label}. Reverted.`);
      } finally {
        setPendingIds((cur) => {
          const next = new Set(cur);
          next.delete(lead.id);
          return next;
        });
      }
    },
    [showError]
  );

  const requestMove = useCallback(
    (lead: LeadListItem, to: LeadStatus) => {
      if (to === "CLOSED") {
        setConfirmMove({ lead, to });
      } else {
        void applyStatus(lead, to);
      }
    },
    [applyStatus]
  );

  const onDrop = useCallback(
    (e: DragEvent, to: LeadStatus) => {
      e.preventDefault();
      setDragOverCol(null);
      const id = e.dataTransfer.getData("text/plain");
      const lead = leads.find((l) => l.id === id);
      if (lead) requestMove(lead, to);
    },
    [leads, requestMove]
  );

  const sortedForTable = useMemo(() => {
    const priorityRank = (p: string) => PRIORITIES.indexOf(p as (typeof PRIORITIES)[number]);
    const statusRank = (s: string) => LEAD_STATUSES.indexOf(s as LeadStatus);
    const rows = [...filtered];
    rows.sort((a, b) => {
      const { key, dir } = sort;
      let cmp = 0;
      if (key === "value") cmp = (a.value ?? -1) - (b.value ?? -1);
      else if (key === "createdAt") cmp = a.createdAt.localeCompare(b.createdAt);
      else if (key === "priority") cmp = priorityRank(a.priority) - priorityRank(b.priority);
      else if (key === "status") cmp = statusRank(a.status) - statusRank(b.status);
      else cmp = String(a[key] ?? "").localeCompare(String(b[key] ?? ""));
      return cmp * dir;
    });
    return rows;
  }, [filtered, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((cur) => (cur.key === key ? { key, dir: cur.dir === 1 ? -1 : 1 } : { key, dir: 1 }));

  const columns: { key: string; label: string; statuses: LeadStatus[]; accent: string }[] =
    expandDone
      ? LEAD_STATUSES.map((s) => ({
          key: s,
          label: LEAD_STATUS_META[s].label,
          statuses: [s],
          accent: LEAD_STATUS_META[s].accent,
        }))
      : [
          ...ACTIVE_STATUSES.map((s) => ({
            key: s,
            label: LEAD_STATUS_META[s].label,
            statuses: [s] as LeadStatus[],
            accent: LEAD_STATUS_META[s].accent,
          })),
          { key: "DONE", label: "Done", statuses: DONE_STATUSES, accent: "bg-green-500" },
        ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display text-2xl text-ink dark:text-white">Leads</h1>
          <p className="text-sm text-muted">
            {leads.length} lead{leads.length === 1 ? "" : "s"} in the pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label="View"
            className="flex rounded-xl border border-line p-0.5 dark:border-night-line"
          >
            <button
              onClick={() => setView("board")}
              aria-pressed={view === "board"}
              className={cn(
                "flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-sm font-semibold transition-colors",
                view === "board"
                  ? "bg-ink text-white dark:bg-white/15"
                  : "text-muted hover:text-ink dark:hover:text-white"
              )}
            >
              <Kanban className="size-4" aria-hidden /> Board
            </button>
            <button
              onClick={() => setView("table")}
              aria-pressed={view === "table"}
              className={cn(
                "flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-sm font-semibold transition-colors",
                view === "table"
                  ? "bg-ink text-white dark:bg-white/15"
                  : "text-muted hover:text-ink dark:hover:text-white"
              )}
            >
              <Table2 className="size-4" aria-hidden /> Table
            </button>
          </div>
          <Button size="sm" onClick={() => setNewOpen(true)}>
            <Plus className="size-4" aria-hidden /> New Lead
          </Button>
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
            placeholder="Search name, email, phone…"
            aria-label="Search leads"
            className="pl-9"
          />
        </div>
        {view === "table" && (
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className="w-auto"
          >
            <option value="">All statuses</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LEAD_STATUS_META[s].label}
              </option>
            ))}
          </Select>
        )}
        <Select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          aria-label="Filter by source"
          className="w-auto"
        >
          <option value="">All sources</option>
          {LEAD_SOURCES.map((s) => (
            <option key={s} value={s}>
              {humanize(s)}
            </option>
          ))}
        </Select>
        <Select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          aria-label="Filter by service"
          className="w-auto"
        >
          <option value="">All services</option>
          {SERVICE_TYPES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          aria-label="Filter by assignee"
          className="w-auto"
        >
          <option value="">Anyone</option>
          <option value="unassigned">Unassigned</option>
          {team.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </Select>
        {view === "board" && (
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-muted">
            <input
              type="checkbox"
              checked={expandDone}
              onChange={(e) => setExpandDone(e.target.checked)}
              className="size-4 accent-gold"
            />
            Expand done columns
          </label>
        )}
      </Card>

      {leads.length === 0 ? (
        <CrmEmptyState
          icon={<Inbox className="size-6" />}
          title="No leads yet"
          hint="Leads from the website forms, chatbot and missed-call texts will land here automatically — or add one manually."
          action={
            <Button size="sm" onClick={() => setNewOpen(true)}>
              <Plus className="size-4" aria-hidden /> New Lead
            </Button>
          }
        />
      ) : view === "board" ? (
        <div className="overflow-x-auto pb-4" role="list" aria-label="Lead pipeline board">
          <div className="flex min-w-max gap-3">
            {columns.map((col) => {
              const colLeads = filtered.filter((l) => col.statuses.includes(l.status as LeadStatus));
              const dropTarget = col.statuses[0];
              return (
                <section
                  key={col.key}
                  role="listitem"
                  aria-label={`${col.label} column, ${colLeads.length} leads`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverCol(col.key);
                  }}
                  onDragLeave={() => setDragOverCol((c) => (c === col.key ? null : c))}
                  onDrop={(e) => onDrop(e, dropTarget)}
                  className={cn(
                    "w-72 shrink-0 rounded-2xl border bg-paper/60 p-2 transition-colors dark:bg-white/[0.03]",
                    dragOverCol === col.key
                      ? "border-gold ring-2 ring-gold/40"
                      : "border-line dark:border-night-line"
                  )}
                >
                  <header className="flex items-center gap-2 px-2 py-1.5">
                    <span className={cn("size-2.5 rounded-full", col.accent)} aria-hidden />
                    <h2 className="text-sm font-bold text-ink dark:text-white">{col.label}</h2>
                    <span className="ml-auto rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold text-muted dark:bg-white/10">
                      {colLeads.length}
                    </span>
                  </header>
                  <div className="mt-1 space-y-2">
                    {colLeads.length === 0 && (
                      <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-xs text-muted dark:border-night-line">
                        {col.key === "DONE" ? "Nothing finished yet" : "Drop leads here"}
                      </p>
                    )}
                    {colLeads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        pending={pendingIds.has(lead.id)}
                        showStatus={col.statuses.length > 1}
                        onMove={(to) => requestMove(lead, to)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted dark:border-night-line">
                {(
                  [
                    ["name", "Name"],
                    ["status", "Status"],
                    ["priority", "Priority"],
                    ["service", "Service"],
                    ["source", "Source"],
                    ["value", "Value"],
                    ["createdAt", "Created"],
                  ] as [SortKey, string][]
                ).map(([key, label]) => (
                  <th key={key} className="px-4 py-3 font-semibold">
                    <button
                      onClick={() => toggleSort(key)}
                      className="inline-flex items-center gap-1 hover:text-ink dark:hover:text-white"
                      aria-label={`Sort by ${label}`}
                    >
                      {label}
                      <ArrowDownUp
                        className={cn("size-3", sort.key === key ? "opacity-100" : "opacity-30")}
                        aria-hidden
                      />
                    </button>
                  </th>
                ))}
                <th className="px-4 py-3 font-semibold">Assignee</th>
                <th className="px-4 py-3 font-semibold">
                  <span className="sr-only">Move</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedForTable.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-muted">
                    No leads match these filters.
                  </td>
                </tr>
              )}
              {sortedForTable.map((lead) => (
                <tr
                  key={lead.id}
                  className={cn(
                    "border-b border-line/60 transition-opacity last:border-0 hover:bg-paper dark:border-night-line/60 dark:hover:bg-white/5",
                    pendingIds.has(lead.id) && "opacity-50"
                  )}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="font-semibold text-ink hover:underline dark:text-white"
                    >
                      {lead.name}
                    </Link>
                    <p className="text-xs text-muted">{lead.phone || lead.email || "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <LeadStatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityDot priority={lead.priority} withLabel />
                  </td>
                  <td className="px-4 py-3">{lead.service || "—"}</td>
                  <td className="px-4 py-3 text-muted">{humanize(lead.source)}</td>
                  <td className="px-4 py-3">{formatMoney(lead.value)}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(lead.createdAt)}</td>
                  <td className="px-4 py-3">
                    {lead.assignedTo ? <AssigneeAvatar name={lead.assignedTo.name} /> : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={lead.status}
                      onChange={(e) => requestMove(lead, e.target.value as LeadStatus)}
                      aria-label={`Move ${lead.name} to status`}
                      className="w-auto py-1.5 text-xs"
                    >
                      {LEAD_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {LEAD_STATUS_META[s].label}
                        </option>
                      ))}
                    </Select>
                  </td>
                </tr>
              ))}
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
        open={Boolean(confirmMove)}
        onClose={() => setConfirmMove(null)}
        title="Close this lead?"
      >
        <p className="text-sm text-body dark:text-gray-300">
          {confirmMove
            ? `${confirmMove.lead.name} will be moved to Closed. You can reopen it later by moving it back to another stage.`
            : ""}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setConfirmMove(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (confirmMove) void applyStatus(confirmMove.lead, confirmMove.to);
              setConfirmMove(null);
            }}
          >
            Close lead
          </Button>
        </div>
      </Dialog>

      <NewLeadDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        team={team}
        onCreated={(lead) => setLeads((cur) => [lead, ...cur])}
      />
    </div>
  );
}

function LeadCard({
  lead,
  pending,
  showStatus,
  onMove,
}: {
  lead: LeadListItem;
  pending: boolean;
  showStatus: boolean;
  onMove: (to: LeadStatus) => void;
}) {
  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", lead.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      aria-label={`Lead ${lead.name}`}
      className={cn(
        "cursor-grab rounded-xl border border-line bg-white p-3 shadow-[0_1px_2px_rgb(0_0_0/0.05)] transition-opacity active:cursor-grabbing dark:border-night-line dark:bg-night-soft",
        pending && "opacity-50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/admin/leads/${lead.id}`}
          className="font-semibold text-ink hover:underline dark:text-white"
        >
          {lead.name}
        </Link>
        <PriorityDot priority={lead.priority} />
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {lead.service && <Badge tone="gold">{lead.service}</Badge>}
        {showStatus && <LeadStatusBadge status={lead.status} />}
        <span className="text-xs text-muted">{humanize(lead.source)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted">
        <span>
          {lead.value !== null && lead.value !== undefined && (
            <span className="mr-2 font-semibold text-ink dark:text-white">
              {formatMoney(lead.value)}
            </span>
          )}
          {timeAgo(lead.createdAt)}
        </span>
        {lead.assignedTo && <AssigneeAvatar name={lead.assignedTo.name} />}
      </div>
      {/* Keyboard alternative to drag-and-drop */}
      <label className="mt-2 block">
        <span className="sr-only">Move {lead.name} to</span>
        <select
          value={lead.status}
          onChange={(e) => onMove(e.target.value as LeadStatus)}
          className="w-full rounded-lg border border-line bg-transparent px-2 py-1 text-xs text-muted focus:border-gold focus:ring-2 focus:ring-gold/40 focus:outline-none dark:border-night-line"
        >
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              Move to: {LEAD_STATUS_META[s].label}
            </option>
          ))}
        </select>
      </label>
    </article>
  );
}

function NewLeadDialog({
  open,
  onClose,
  team,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  team: TeamMember[];
  onCreated: (lead: LeadListItem) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    service: "",
    customerType: "RESIDENTIAL",
    source: "PHONE",
    priority: "NORMAL",
    assignedToId: "",
    value: "",
    message: "",
  });

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((cur) => ({ ...cur, [key]: value }));

  const submit = async () => {
    if (form.name.trim().length < 2) {
      setFormError("A name is required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          service: form.service || null,
          customerType: form.customerType,
          source: form.source,
          priority: form.priority,
          assignedToId: form.assignedToId || null,
          value: form.value ? Number(form.value) : null,
          message: form.message.trim() || null,
        }),
      });
      const data = (await res.json()) as { lead?: LeadListItem; error?: string };
      if (!res.ok || !data.lead) {
        setFormError(data.error || "Could not create the lead.");
        return;
      }
      onCreated(data.lead);
      setForm({
        name: "",
        phone: "",
        email: "",
        service: "",
        customerType: "RESIDENTIAL",
        source: "PHONE",
        priority: "NORMAL",
        assignedToId: "",
        value: "",
        message: "",
      });
      onClose();
    } catch {
      setFormError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="New lead">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="space-y-4"
        noValidate
      >
        <div>
          <Label htmlFor="nl-name" required>
            Name
          </Label>
          <Input
            id="nl-name"
            value={form.name}
            onChange={(e) => set("name")(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="nl-phone">Phone</Label>
            <Input
              id="nl-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone")(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="nl-email">Email</Label>
            <Input
              id="nl-email"
              type="email"
              value={form.email}
              onChange={(e) => set("email")(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="nl-service">Service</Label>
            <Select
              id="nl-service"
              value={form.service}
              onChange={(e) => set("service")(e.target.value)}
            >
              <option value="">Not sure yet</option>
              {SERVICE_TYPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="nl-type">Customer type</Label>
            <Select
              id="nl-type"
              value={form.customerType}
              onChange={(e) => set("customerType")(e.target.value)}
            >
              <option value="RESIDENTIAL">Residential</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="NEW_CONSTRUCTION">New construction</option>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="nl-source">Source</Label>
            <Select
              id="nl-source"
              value={form.source}
              onChange={(e) => set("source")(e.target.value)}
            >
              {LEAD_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {humanize(s)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="nl-priority">Priority</Label>
            <Select
              id="nl-priority"
              value={form.priority}
              onChange={(e) => set("priority")(e.target.value)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_META[p].label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="nl-assignee">Assign to</Label>
            <Select
              id="nl-assignee"
              value={form.assignedToId}
              onChange={(e) => set("assignedToId")(e.target.value)}
            >
              <option value="">Unassigned</option>
              {team.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="nl-value">Est. value ($)</Label>
            <Input
              id="nl-value"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={form.value}
              onChange={(e) => set("value")(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="nl-message">Notes</Label>
          <Textarea
            id="nl-message"
            value={form.message}
            onChange={(e) => set("message")(e.target.value)}
            rows={3}
            className="min-h-20"
          />
        </div>
        <FieldError id="nl-error" message={formError ?? undefined} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={submitting}>
            Create lead
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
