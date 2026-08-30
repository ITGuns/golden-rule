"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { SERVICE_TYPES } from "@/lib/site";
import { cn, formatDateTime, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge, Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/Field";
import { Tabs } from "@/components/ui/Tabs";
import {
  LEAD_STATUSES,
  LEAD_STATUS_META,
  PRIORITIES,
  PRIORITY_META,
  REVIEW_REQUEST_STATUS_META,
  formatMoney,
  humanize,
  type LeadStatus,
} from "./constants";
import {
  AppointmentStatusBadge,
  CrmEmptyState,
  EstimateStatusBadge,
  LeadStatusBadge,
  MetaChip,
} from "./Bits";
import { parseAttachments, type LeadFullDTO, type TeamMember } from "./types";
import {
  ArrowLeft,
  ArrowRightLeft,
  CalendarDays,
  FileText,
  Mail,
  MessageSquare,
  Paperclip,
  Phone,
  PhoneCall,
  Send,
  Sparkles,
  Star,
  StickyNote,
  Wrench,
} from "lucide-react";

const ACTIVITY_ICONS: Record<string, ReactNode> = {
  CREATED: <Sparkles className="size-4" aria-hidden />,
  STATUS_CHANGE: <ArrowRightLeft className="size-4" aria-hidden />,
  NOTE: <StickyNote className="size-4" aria-hidden />,
  SMS_SENT: <MessageSquare className="size-4" aria-hidden />,
  EMAIL_SENT: <Mail className="size-4" aria-hidden />,
  CALL: <PhoneCall className="size-4" aria-hidden />,
  APPOINTMENT: <CalendarDays className="size-4" aria-hidden />,
  ESTIMATE: <FileText className="size-4" aria-hidden />,
  REVIEW_REQUEST: <Star className="size-4" aria-hidden />,
  SYSTEM: <Wrench className="size-4" aria-hidden />,
};

export function LeadDetail({
  initialLead,
  team,
}: {
  initialLead: LeadFullDTO;
  team: TeamMember[];
}) {
  const [lead, setLead] = useState<LeadFullDTO>(initialLead);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [valueDraft, setValueDraft] = useState(
    lead.value !== null && lead.value !== undefined ? String(lead.value) : ""
  );
  const [confirmStatus, setConfirmStatus] = useState<LeadStatus | null>(null);
  const [smsOpen, setSmsOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [estimateOpen, setEstimateOpen] = useState(false);

  const showError = useCallback((message: string) => {
    setError(message);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(null), 6000);
  }, []);

  /** PATCH the lead; the API returns the fully-included lead back. */
  const patchLead = useCallback(
    async (payload: Record<string, unknown>): Promise<boolean> => {
      setBusy(true);
      try {
        const res = await fetch(`/api/leads/${lead.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as { lead?: LeadFullDTO; error?: string };
        if (!res.ok || !data.lead) {
          showError(data.error || "Update failed.");
          return false;
        }
        setLead(data.lead);
        return true;
      } catch {
        showError("Network error — please try again.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [lead.id, showError]
  );

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${lead.id}`);
      const data = (await res.json()) as { lead?: LeadFullDTO };
      if (res.ok && data.lead) setLead(data.lead);
    } catch {
      // keep current state; mutations already reported their own errors
    }
  }, [lead.id]);

  const onStatusSelect = (next: LeadStatus) => {
    if (next === lead.status) return;
    if (next === "CLOSED" || next === "REVIEW_REQUESTED") {
      setConfirmStatus(next);
    } else {
      void patchLead({ status: next });
    }
  };

  const valueChanged =
    valueDraft.trim() !==
    (lead.value !== null && lead.value !== undefined ? String(lead.value) : "");

  const attachmentGroups = useMemo(
    () =>
      lead.serviceRequests
        .map((sr) => ({ sr, files: parseAttachments(sr.attachments) }))
        .filter((g) => g.files.length > 0),
    [lead.serviceRequests]
  );
  const fileCount = attachmentGroups.reduce((n, g) => n + g.files.length, 0);
  const noteActivities = lead.activities.filter((a) => a.type === "NOTE");
  const latestServiceRequest = lead.serviceRequests[0];

  return (
    <div className="space-y-5">
      <Link
        href="/admin/leads"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink dark:hover:text-white"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to leads
      </Link>

      {/* Header */}
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="display text-2xl text-ink dark:text-white">{lead.name}</h1>
              <LeadStatusBadge status={lead.status} />
              <Badge tone={PRIORITY_META[lead.priority as keyof typeof PRIORITY_META]?.tone}>
                {humanize(lead.priority)}
              </Badge>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              {lead.phone && (
                <a
                  href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`}
                  className="inline-flex items-center gap-1.5 hover:text-ink dark:hover:text-white"
                >
                  <Phone className="size-3.5" aria-hidden /> {lead.phone}
                </a>
              )}
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="inline-flex items-center gap-1.5 hover:text-ink dark:hover:text-white"
                >
                  <Mail className="size-3.5" aria-hidden /> {lead.email}
                </a>
              )}
              <span>Created {timeAgo(lead.createdAt)}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setSmsOpen(true)}>
              <MessageSquare className="size-4" aria-hidden /> Send SMS
            </Button>
            {lead.status === "COMPLETED" && (
              <Button size="sm" onClick={() => setConfirmStatus("REVIEW_REQUESTED")}>
                <Star className="size-4" aria-hidden /> Request review
              </Button>
            )}
          </div>
        </div>

        {/* Control row */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label htmlFor="ld-status">Status</Label>
            <Select
              id="ld-status"
              value={lead.status}
              disabled={busy}
              onChange={(e) => onStatusSelect(e.target.value as LeadStatus)}
            >
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {LEAD_STATUS_META[s].label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="ld-priority">Priority</Label>
            <Select
              id="ld-priority"
              value={lead.priority}
              disabled={busy}
              onChange={(e) => void patchLead({ priority: e.target.value })}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_META[p].label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="ld-assignee">Assigned to</Label>
            <Select
              id="ld-assignee"
              value={lead.assignedToId ?? ""}
              disabled={busy}
              onChange={(e) => void patchLead({ assignedToId: e.target.value || null })}
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
            <Label htmlFor="ld-value">Est. value ($)</Label>
            <div className="flex gap-2">
              <Input
                id="ld-value"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={valueDraft}
                onChange={(e) => setValueDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void patchLead({ value: valueDraft ? Number(valueDraft) : null });
                  }
                }}
              />
              {valueChanged && (
                <Button
                  size="sm"
                  variant="dark"
                  loading={busy}
                  onClick={() => void patchLead({ value: valueDraft ? Number(valueDraft) : null })}
                >
                  Save
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Source + UTM chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <MetaChip label="Source" value={humanize(lead.source)} />
          {lead.utmSource && <MetaChip label="utm_source" value={lead.utmSource} />}
          {lead.utmMedium && <MetaChip label="utm_medium" value={lead.utmMedium} />}
          {lead.utmCampaign && <MetaChip label="utm_campaign" value={lead.utmCampaign} />}
          {lead.utmTerm && <MetaChip label="utm_term" value={lead.utmTerm} />}
          {lead.utmContent && <MetaChip label="utm_content" value={lead.utmContent} />}
          {lead.landingPage && <MetaChip label="Landing" value={lead.landingPage} />}
          {lead.referrer && <MetaChip label="Referrer" value={lead.referrer} />}
        </div>
      </Card>

      <Tabs
        tabs={[
          {
            key: "overview",
            label: "Overview",
            content: (
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Customer */}
                <Card className="p-5">
                  <h2 className="mb-3 font-display text-sm font-bold tracking-wide text-muted uppercase">
                    Customer
                  </h2>
                  {lead.customer ? (
                    <dl className="space-y-2 text-sm">
                      <Row label="Name">
                        {lead.customer.firstName} {lead.customer.lastName}
                      </Row>
                      <Row label="Type">{humanize(lead.customer.type)}</Row>
                      <Row label="Phone">{lead.customer.phone || "—"}</Row>
                      <Row label="Email">{lead.customer.email || "—"}</Row>
                      <Row label="Address">
                        {[lead.customer.street, lead.customer.city, lead.customer.zip]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </Row>
                    </dl>
                  ) : (
                    <p className="text-sm text-muted">No customer record linked.</p>
                  )}
                  {lead.customerId && (
                    <Link
                      href={`/admin/customers?focus=${lead.customerId}`}
                      className="mt-3 inline-block text-sm font-semibold text-ink underline-offset-2 hover:underline dark:text-gold"
                    >
                      View in customers
                    </Link>
                  )}
                </Card>

                {/* Inquiry + service request */}
                <Card className="p-5">
                  <h2 className="mb-3 font-display text-sm font-bold tracking-wide text-muted uppercase">
                    Inquiry
                  </h2>
                  <dl className="space-y-2 text-sm">
                    <Row label="Service">{lead.service || "—"}</Row>
                    {latestServiceRequest && (
                      <>
                        <Row label="Requested">{latestServiceRequest.serviceType}</Row>
                        <Row label="Preferred date">
                          {latestServiceRequest.preferredDate || "—"}
                        </Row>
                        <Row label="Preferred time">
                          {latestServiceRequest.preferredTime || "—"}
                        </Row>
                        <Row label="Job address">
                          {[
                            latestServiceRequest.street,
                            latestServiceRequest.city,
                            latestServiceRequest.zip,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </Row>
                      </>
                    )}
                  </dl>
                  {(lead.message || latestServiceRequest?.description) && (
                    <blockquote className="mt-3 rounded-xl bg-paper p-3 text-sm text-body dark:bg-white/5 dark:text-gray-300">
                      {lead.message || latestServiceRequest?.description}
                    </blockquote>
                  )}
                </Card>

                {/* Quick actions */}
                <Card className="p-5 lg:col-span-2">
                  <h2 className="mb-3 font-display text-sm font-bold tracking-wide text-muted uppercase">
                    Quick actions
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setCallOpen(true)}>
                      <PhoneCall className="size-4" aria-hidden /> Log a call
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSmsOpen(true)}>
                      <MessageSquare className="size-4" aria-hidden /> Send SMS
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setScheduleOpen(true)}>
                      <CalendarDays className="size-4" aria-hidden /> Schedule appointment
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEstimateOpen(true)}>
                      <FileText className="size-4" aria-hidden /> New estimate
                    </Button>
                    {lead.status === "COMPLETED" && (
                      <Button size="sm" onClick={() => setConfirmStatus("REVIEW_REQUESTED")}>
                        <Star className="size-4" aria-hidden /> Request review
                      </Button>
                    )}
                  </div>
                  {lead.reviewRequests.length > 0 && (
                    <div className="mt-4 space-y-1.5">
                      {lead.reviewRequests.map((r) => (
                        <p key={r.id} className="flex items-center gap-2 text-sm text-muted">
                          <Star className="size-3.5 text-gold" aria-hidden />
                          Review request ({r.channel.toLowerCase()})
                          <Badge tone={REVIEW_REQUEST_STATUS_META[r.status]?.tone ?? "neutral"}>
                            {REVIEW_REQUEST_STATUS_META[r.status]?.label ?? humanize(r.status)}
                          </Badge>
                          <span>{timeAgo(r.createdAt)}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            ),
          },
          {
            key: "timeline",
            label: "Timeline",
            count: lead.activities.length,
            content:
              lead.activities.length === 0 ? (
                <CrmEmptyState title="No activity yet" hint="Actions on this lead will appear here." />
              ) : (
                <ol className="space-y-0">
                  {lead.activities.map((a, i) => (
                    <li key={a.id} className="relative flex gap-3 pb-5">
                      {i < lead.activities.length - 1 && (
                        <span
                          className="absolute top-8 left-[15px] h-full w-px bg-line dark:bg-night-line"
                          aria-hidden
                        />
                      )}
                      <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full bg-gold-soft text-[#8a6d00] dark:bg-gold/15 dark:text-gold">
                        {ACTIVITY_ICONS[a.type] ?? <Wrench className="size-4" aria-hidden />}
                      </span>
                      <div className="min-w-0 pt-1">
                        <p className="text-sm text-ink dark:text-white">{a.description}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          {a.user ? `${a.user.name} · ` : ""}
                          {timeAgo(a.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              ),
          },
          {
            key: "messages",
            label: "Messages",
            count: lead.messages.length,
            content: (
              <MessagesPanel
                lead={lead}
                onSent={refresh}
                onError={showError}
                openComposer={() => setSmsOpen(true)}
              />
            ),
          },
          {
            key: "appointments",
            label: "Appointments",
            count: lead.appointments.length,
            content: (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => setScheduleOpen(true)}>
                    <CalendarDays className="size-4" aria-hidden /> Schedule
                  </Button>
                </div>
                {lead.appointments.length === 0 ? (
                  <CrmEmptyState
                    icon={<CalendarDays className="size-6" />}
                    title="No appointments"
                    hint="Schedule a visit and it will appear on the team calendar."
                  />
                ) : (
                  lead.appointments.map((a) => (
                    <Card key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div>
                        <p className="font-semibold text-ink dark:text-white">{a.service}</p>
                        <p className="text-sm text-muted">
                          {formatDateTime(a.start)} – {formatDateTime(a.end)}
                          {a.technician ? ` · ${a.technician.name}` : ""}
                        </p>
                        {a.location && <p className="text-xs text-muted">{a.location}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <AppointmentStatusBadge status={a.status} />
                        <Link
                          href="/admin/appointments"
                          className="text-sm font-semibold text-muted underline-offset-2 hover:text-ink hover:underline dark:hover:text-white"
                        >
                          Calendar
                        </Link>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            ),
          },
          {
            key: "estimates",
            label: "Estimates",
            count: lead.estimates.length,
            content: (
              <EstimatesPanel
                lead={lead}
                onChanged={refresh}
                onError={showError}
                openCreate={() => setEstimateOpen(true)}
              />
            ),
          },
          {
            key: "notes",
            label: "Notes",
            count: noteActivities.length,
            content: (
              <NotesPanel
                notes={noteActivities}
                busy={busy}
                onSave={(note) => patchLead({ note })}
              />
            ),
          },
          {
            key: "files",
            label: "Files",
            count: fileCount,
            content:
              fileCount === 0 ? (
                <CrmEmptyState
                  icon={<Paperclip className="size-6" />}
                  title="No files"
                  hint="Photos attached to service requests will show up here."
                />
              ) : (
                <div className="space-y-5">
                  {attachmentGroups.map(({ sr, files }) => (
                    <div key={sr.id}>
                      <p className="mb-2 text-sm font-semibold text-muted">
                        {sr.serviceType} request · {timeAgo(sr.createdAt)}
                      </p>
                      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {files.map((path) => {
                          const isImage = /\.(jpe?g|png|webp|gif|avif)$/i.test(path);
                          const name = path.split("/").pop() || path;
                          return (
                            <li key={path}>
                              <a
                                href={path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block overflow-hidden rounded-xl border border-line transition-shadow hover:shadow-lift dark:border-night-line"
                              >
                                {isImage ? (
                                  <span className="relative block aspect-[4/3]">
                                    <Image
                                      src={path}
                                      alt={`Attachment ${name}`}
                                      fill
                                      className="object-cover"
                                      sizes="(max-width: 640px) 50vw, 25vw"
                                      unoptimized
                                    />
                                  </span>
                                ) : (
                                  <span className="flex aspect-[4/3] items-center justify-center bg-paper dark:bg-white/5">
                                    <Paperclip className="size-6 text-muted" aria-hidden />
                                  </span>
                                )}
                                <span className="block truncate px-2.5 py-1.5 text-xs text-muted">
                                  {name}
                                </span>
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              ),
          },
        ]}
      />

      {/* Error toast */}
      {error && (
        <div
          role="status"
          className="fixed right-4 bottom-4 z-[95] rounded-xl bg-danger px-4 py-3 text-sm font-semibold text-white shadow-lift"
        >
          {error}
        </div>
      )}

      {/* Confirm status changes with side effects */}
      <Dialog
        open={Boolean(confirmStatus)}
        onClose={() => setConfirmStatus(null)}
        title={confirmStatus === "REVIEW_REQUESTED" ? "Request a review?" : "Close this lead?"}
      >
        <p className="text-sm text-body dark:text-gray-300">
          {confirmStatus === "REVIEW_REQUESTED"
            ? `A review request will be created${
                lead.phone ? ` and a text sent to ${lead.phone}` : ""
              } using your review message template from Settings.`
            : "The lead will be moved to Closed. You can reopen it later by changing its status."}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setConfirmStatus(null)}>
            Cancel
          </Button>
          <Button
            variant={confirmStatus === "CLOSED" ? "danger" : "gold"}
            size="sm"
            loading={busy}
            onClick={async () => {
              if (confirmStatus) {
                const ok = await patchLead({ status: confirmStatus });
                if (ok) setConfirmStatus(null);
              }
            }}
          >
            {confirmStatus === "REVIEW_REQUESTED" ? "Send request" : "Close lead"}
          </Button>
        </div>
      </Dialog>

      <SendSmsDialog
        open={smsOpen}
        onClose={() => setSmsOpen(false)}
        lead={lead}
        onSent={refresh}
      />
      <LogCallDialog
        open={callOpen}
        onClose={() => setCallOpen(false)}
        onSave={async (note) => {
          const ok = await patchLead({ note: `Call logged: ${note}` });
          if (ok) setCallOpen(false);
        }}
        busy={busy}
      />
      <ScheduleDialog
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        lead={lead}
        team={team}
        onScheduled={refresh}
      />
      <NewEstimateDialog
        open={estimateOpen}
        onClose={() => setEstimateOpen(false)}
        leadId={lead.id}
        onCreated={refresh}
      />
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-28 shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 text-ink dark:text-white">{children}</dd>
    </div>
  );
}

function MessagesPanel({
  lead,
  onSent,
  onError,
  openComposer,
}: {
  lead: LeadFullDTO;
  onSent: () => Promise<void>;
  onError: (m: string) => void;
  openComposer: () => void;
}) {
  const [text, setText] = useState("");
  const [channel, setChannel] = useState<"SMS" | "EMAIL">("SMS");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text.trim(), channel }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        onError(data.error || "Could not send the message.");
        return;
      }
      setText("");
      await onSent();
    } catch {
      onError("Network error — please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {lead.messages.length === 0 ? (
        <CrmEmptyState
          icon={<MessageSquare className="size-6" />}
          title="No messages yet"
          hint="Text or email this lead — the conversation will be threaded here."
          action={
            <Button size="sm" variant="outline" onClick={openComposer}>
              Send the first message
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {lead.messages.map((m) => (
            <li
              key={m.id}
              className={cn("flex", m.direction === "OUTBOUND" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                  m.direction === "OUTBOUND"
                    ? "rounded-br-md bg-ink text-white dark:bg-gold dark:text-ink"
                    : "rounded-bl-md bg-paper text-body dark:bg-white/10 dark:text-gray-200"
                )}
              >
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p
                  className={cn(
                    "mt-1 text-[11px]",
                    m.direction === "OUTBOUND"
                      ? "text-white/60 dark:text-ink/60"
                      : "text-muted"
                  )}
                >
                  {m.channel} · {timeAgo(m.createdAt)}
                  {m.status === "MOCKED" ? " · mock" : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="flex items-end gap-2"
      >
        <div className="w-28 shrink-0">
          <Label htmlFor="msg-channel" className="sr-only">
            Channel
          </Label>
          <Select
            id="msg-channel"
            value={channel}
            onChange={(e) => setChannel(e.target.value as "SMS" | "EMAIL")}
          >
            <option value="SMS">SMS</option>
            <option value="EMAIL">Email</option>
          </Select>
        </div>
        <div className="flex-1">
          <Label htmlFor="msg-body" className="sr-only">
            Message
          </Label>
          <Textarea
            id="msg-body"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            className="min-h-12"
            placeholder={channel === "SMS" ? "Type a text message…" : "Type an email…"}
          />
        </div>
        <Button type="submit" size="md" loading={sending} disabled={!text.trim()}>
          <Send className="size-4" aria-hidden /> Send
        </Button>
      </form>
    </div>
  );
}

function EstimatesPanel({
  lead,
  onChanged,
  onError,
  openCreate,
}: {
  lead: LeadFullDTO;
  onChanged: () => Promise<void>;
  onError: (m: string) => void;
  openCreate: () => void;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  const transition = async (estimateId: string, status: string) => {
    setPendingId(estimateId);
    try {
      const res = await fetch(`/api/leads/${lead.id}/estimates?estimateId=${estimateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        onError(data.error || "Could not update the estimate.");
        return;
      }
      await onChanged();
    } catch {
      onError("Network error — please try again.");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate}>
          <FileText className="size-4" aria-hidden /> New estimate
        </Button>
      </div>
      {lead.estimates.length === 0 ? (
        <CrmEmptyState
          icon={<FileText className="size-6" />}
          title="No estimates"
          hint="Draft an estimate for this lead, send it, then record the outcome."
        />
      ) : (
        lead.estimates.map((est) => (
          <Card key={est.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="font-semibold text-ink dark:text-white">{est.title}</p>
              <p className="text-sm text-muted">
                {formatMoney(est.amount)} · created {timeAgo(est.createdAt)}
              </p>
              {est.notes && <p className="mt-1 text-sm text-body dark:text-gray-300">{est.notes}</p>}
            </div>
            <div className="flex items-center gap-2">
              <EstimateStatusBadge status={est.status} />
              {est.status === "DRAFT" && (
                <Button
                  size="sm"
                  variant="dark"
                  loading={pendingId === est.id}
                  onClick={() => void transition(est.id, "SENT")}
                >
                  Mark sent
                </Button>
              )}
              {est.status === "SENT" && (
                <>
                  <Button
                    size="sm"
                    loading={pendingId === est.id}
                    onClick={() => void transition(est.id, "ACCEPTED")}
                  >
                    Accepted
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    loading={pendingId === est.id}
                    onClick={() => void transition(est.id, "DECLINED")}
                  >
                    Declined
                  </Button>
                </>
              )}
              {est.status === "DECLINED" && (
                <Button
                  size="sm"
                  variant="outline"
                  loading={pendingId === est.id}
                  onClick={() => void transition(est.id, "SENT")}
                >
                  Re-send
                </Button>
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

function NotesPanel({
  notes,
  busy,
  onSave,
}: {
  notes: LeadFullDTO["activities"];
  busy: boolean;
  onSave: (note: string) => Promise<boolean>;
}) {
  const [text, setText] = useState("");
  return (
    <div className="space-y-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!text.trim()) return;
          const ok = await onSave(text.trim());
          if (ok) setText("");
        }}
        className="flex items-end gap-2"
      >
        <div className="flex-1">
          <Label htmlFor="note-body" className="sr-only">
            Note
          </Label>
          <Textarea
            id="note-body"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            className="min-h-12"
            placeholder="Add an internal note…"
          />
        </div>
        <Button type="submit" size="md" loading={busy} disabled={!text.trim()}>
          Save note
        </Button>
      </form>
      {notes.length === 0 ? (
        <CrmEmptyState
          icon={<StickyNote className="size-6" />}
          title="No notes yet"
          hint="Notes are internal — the customer never sees them."
        />
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="rounded-xl bg-paper p-3 text-sm dark:bg-white/5">
              <p className="whitespace-pre-wrap text-body dark:text-gray-200">{n.description}</p>
              <p className="mt-1 text-xs text-muted">
                {n.user ? `${n.user.name} · ` : ""}
                {timeAgo(n.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SendSmsDialog({
  open,
  onClose,
  lead,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  lead: LeadFullDTO;
  onSent: () => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    setErr(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text.trim(), channel: "SMS" }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(data.error || "Could not send the message.");
        return;
      }
      setText("");
      await onSent();
      onClose();
    } catch {
      setErr("Network error — please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={`Text ${lead.name}`}>
      {lead.phone ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
          className="space-y-4"
        >
          <p className="text-sm text-muted">
            To <span className="font-semibold text-ink dark:text-white">{lead.phone}</span>
          </p>
          <div>
            <Label htmlFor="sms-body" required>
              Message
            </Label>
            <Textarea
              id="sms-body"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              maxLength={2000}
              autoFocus
            />
          </div>
          <FieldError message={err ?? undefined} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={sending} disabled={!text.trim()}>
              <Send className="size-4" aria-hidden /> Send SMS
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted">
          This lead has no phone number on file, so an SMS cannot be sent.
        </p>
      )}
    </Dialog>
  );
}

function LogCallDialog({
  open,
  onClose,
  onSave,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (note: string) => Promise<void>;
  busy: boolean;
}) {
  const [text, setText] = useState("");
  return (
    <Dialog open={open} onClose={onClose} title="Log a call">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!text.trim()) return;
          await onSave(text.trim());
          setText("");
        }}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="call-note" required>
            What happened on the call?
          </Label>
          <Textarea
            id="call-note"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={busy} disabled={!text.trim()}>
            Save call note
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function ScheduleDialog({
  open,
  onClose,
  lead,
  team,
  onScheduled,
}: {
  open: boolean;
  onClose: () => void;
  lead: LeadFullDTO;
  team: TeamMember[];
  onScheduled: () => Promise<void>;
}) {
  const defaultLocation = lead.customer
    ? [lead.customer.street, lead.customer.city, lead.customer.zip].filter(Boolean).join(", ")
    : "";
  const [form, setForm] = useState({
    service: lead.service || "",
    date: "",
    time: "09:00",
    hours: "2",
    technicianId: "",
    location: defaultLocation,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!form.service || !form.date || !form.time) {
      setErr("Service, date and time are required.");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      const start = new Date(`${form.date}T${form.time}`);
      const end = new Date(start.getTime() + Number(form.hours) * 60 * 60 * 1000);
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          customerId: lead.customerId,
          technicianId: form.technicianId || null,
          service: form.service,
          start: start.toISOString(),
          end: end.toISOString(),
          status: "CONFIRMED",
          location: form.location || null,
          notes: form.notes || null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(data.error || "Could not schedule the appointment.");
        return;
      }
      await onScheduled();
      onClose();
    } catch {
      setErr("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((cur) => ({ ...cur, [key]: value }));

  return (
    <Dialog open={open} onClose={onClose} title="Schedule appointment">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="ap-service" required>
            Service
          </Label>
          <Select
            id="ap-service"
            value={form.service}
            onChange={(e) => set("service")(e.target.value)}
            required
          >
            <option value="">Choose a service…</option>
            {SERVICE_TYPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="ap-date" required>
              Date
            </Label>
            <Input
              id="ap-date"
              type="date"
              value={form.date}
              onChange={(e) => set("date")(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="ap-time" required>
              Time
            </Label>
            <Input
              id="ap-time"
              type="time"
              value={form.time}
              onChange={(e) => set("time")(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="ap-hours">Duration</Label>
            <Select
              id="ap-hours"
              value={form.hours}
              onChange={(e) => set("hours")(e.target.value)}
            >
              {["1", "2", "3", "4"].map((h) => (
                <option key={h} value={h}>
                  {h} hour{h === "1" ? "" : "s"}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="ap-tech">Technician</Label>
          <Select
            id="ap-tech"
            value={form.technicianId}
            onChange={(e) => set("technicianId")(e.target.value)}
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
          <Label htmlFor="ap-location">Location</Label>
          <Input
            id="ap-location"
            value={form.location}
            onChange={(e) => set("location")(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="ap-notes">Notes</Label>
          <Textarea
            id="ap-notes"
            value={form.notes}
            onChange={(e) => set("notes")(e.target.value)}
            rows={2}
            className="min-h-16"
          />
        </div>
        <FieldError message={err ?? undefined} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={submitting}>
            Schedule
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function NewEstimateDialog({
  open,
  onClose,
  leadId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  leadId: string;
  onCreated: () => Promise<void>;
}) {
  const [form, setForm] = useState({ title: "", amount: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (form.title.trim().length < 2) {
      setErr("An estimate title is required.");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/estimates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          amount: form.amount ? Number(form.amount) : null,
          notes: form.notes.trim() || null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(data.error || "Could not create the estimate.");
        return;
      }
      setForm({ title: "", amount: "", notes: "" });
      await onCreated();
      onClose();
    } catch {
      setErr("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="New estimate">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="est-title" required>
            Title
          </Label>
          <Input
            id="est-title"
            value={form.title}
            onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))}
            placeholder="e.g. Replace 3-ton condenser"
            required
            autoFocus
          />
        </div>
        <div>
          <Label htmlFor="est-amount">Amount ($)</Label>
          <Input
            id="est-amount"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => setForm((c) => ({ ...c, amount: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="est-notes">Notes</Label>
          <Textarea
            id="est-notes"
            value={form.notes}
            onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))}
            rows={3}
            className="min-h-20"
          />
        </div>
        <FieldError message={err ?? undefined} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={submitting}>
            Create draft
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
