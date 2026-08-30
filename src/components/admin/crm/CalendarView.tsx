"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { SERVICE_TYPES } from "@/lib/site";
import { cn, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/Field";
import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_META,
  type AppointmentStatus,
} from "./constants";
import { AppointmentStatusBadge, CrmEmptyState } from "./Bits";
import type { AppointmentDTO, CustomerDTO, TeamMember } from "./types";
import {
  CalendarDays,
  CalendarRange,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react";

/* ---------------------------------------------------------------- */
/* Date math (weeks start Sunday — no date library)                 */
/* ---------------------------------------------------------------- */

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  x.setDate(x.getDate() - x.getDay());
  return x;
}
function startOfMonth(d: Date): Date {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}
function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(1);
  x.setMonth(x.getMonth() + n);
  return x;
}
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function pad(n: number): string {
  return String(n).padStart(2, "0");
}
/** Date → value usable in <input type="datetime-local">. */
function toLocalInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function fmtTime(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function fmtDayLong(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type ViewMode = "month" | "week" | "day";

/** Who the visit is for, best-effort. */
function apptWho(a: AppointmentDTO): string {
  if (a.customer) return `${a.customer.firstName} ${a.customer.lastName}`.trim();
  if (a.lead) return a.lead.name;
  return a.service;
}

/* ---------------------------------------------------------------- */
/* Main view                                                        */
/* ---------------------------------------------------------------- */

export function CalendarView({
  initialAppointments,
  team,
  initialDate,
  initialFrom,
  initialTo,
  autoNew,
}: {
  initialAppointments: AppointmentDTO[];
  team: TeamMember[];
  /** Server "now" — keeps SSR and hydration in agreement. */
  initialDate: string;
  initialFrom: string;
  initialTo: string;
  autoNew?: boolean;
}) {
  const [appointments, setAppointments] = useState<AppointmentDTO[]>(initialAppointments);
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState<Date>(() => startOfDay(new Date(initialDate)));
  const [today] = useState<Date>(() => startOfDay(new Date(initialDate)));
  const [techFilter, setTechFilter] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(Boolean(autoNew));
  const [newPrefill, setNewPrefill] = useState<Date | null>(null);
  useEffect(() => {
    if (autoNew) setNewOpen(true);
  }, [autoNew]);

  const showError = useCallback((message: string) => {
    setError(message);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(null), 6000);
  }, []);

  /* Visible window per view */
  const [rangeStart, rangeEnd] = useMemo<[Date, Date]>(() => {
    if (view === "month") {
      const gridStart = startOfWeek(startOfMonth(cursor));
      return [gridStart, addDays(gridStart, 42)];
    }
    if (view === "week") {
      const ws = startOfWeek(cursor);
      return [ws, addDays(ws, 7)];
    }
    const ds = startOfDay(cursor);
    return [ds, addDays(ds, 1)];
  }, [view, cursor]);

  /* Refetch when the visible window moves beyond what is loaded. */
  const loadedKey = useRef(`${initialFrom}|${initialTo}`);
  useEffect(() => {
    const key = `${rangeStart.toISOString()}|${rangeEnd.toISOString()}`;
    if (key === loadedKey.current) return;
    let cancelled = false;
    setLoading(true);
    fetch(
      `/api/appointments?from=${encodeURIComponent(rangeStart.toISOString())}&to=${encodeURIComponent(rangeEnd.toISOString())}`
    )
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { appointments: AppointmentDTO[] };
        if (!cancelled) {
          setAppointments(data.appointments);
          loadedKey.current = key;
        }
      })
      .catch(() => {
        if (!cancelled) showError("Could not load appointments for this range.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [rangeStart, rangeEnd, showError]);

  const visible = useMemo(() => {
    return appointments
      .filter((a) => {
        const start = new Date(a.start);
        if (start < rangeStart || start >= rangeEnd) return false;
        if (techFilter === "unassigned" && a.technicianId) return false;
        if (techFilter && techFilter !== "unassigned" && a.technicianId !== techFilter)
          return false;
        return true;
      })
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [appointments, rangeStart, rangeEnd, techFilter]);

  const selected = selectedId ? (appointments.find((a) => a.id === selectedId) ?? null) : null;

  const navigate = (dir: -1 | 1) => {
    setCursor((c) =>
      view === "month" ? addMonths(c, dir) : view === "week" ? addDays(c, dir * 7) : addDays(c, dir)
    );
  };

  const rangeLabel =
    view === "month"
      ? cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : view === "week"
        ? `${startOfWeek(cursor).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${addDays(startOfWeek(cursor), 6).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
        : fmtDayLong(cursor);

  const openDay = (day: Date) => {
    setCursor(startOfDay(day));
    setView("day");
  };

  const onSaved = useCallback((updated: AppointmentDTO) => {
    setAppointments((cur) => cur.map((a) => (a.id === updated.id ? updated : a)));
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display text-2xl text-ink dark:text-white">Appointments</h1>
          <p className="text-sm text-muted">
            {visible.length} appointment{visible.length === 1 ? "" : "s"} in view
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setNewPrefill(null);
            setNewOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden /> New Appointment
        </Button>
      </div>

      {/* Toolbar */}
      <Card className="flex flex-wrap items-center gap-2 p-3">
        <div
          role="group"
          aria-label="Calendar view"
          className="flex rounded-xl border border-line p-0.5 dark:border-night-line"
        >
          {(
            [
              ["month", "Month", CalendarDays],
              ["week", "Week", CalendarRange],
              ["day", "Day", CalendarClock],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              aria-pressed={view === key}
              className={cn(
                "flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-sm font-semibold transition-colors",
                view === key
                  ? "bg-ink text-white dark:bg-white/15"
                  : "text-muted hover:text-ink dark:hover:text-white"
              )}
            >
              <Icon className="size-4" aria-hidden /> {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(-1)}
            aria-label="Previous"
            className="rounded-lg p-2 text-muted transition-colors hover:bg-black/5 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(today)}>
            Today
          </Button>
          <button
            onClick={() => navigate(1)}
            aria-label="Next"
            className="rounded-lg p-2 text-muted transition-colors hover:bg-black/5 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>

        <p className="min-w-40 font-display text-sm font-semibold text-ink dark:text-white" aria-live="polite">
          {rangeLabel}
        </p>

        <div className="ml-auto flex items-center gap-2">
          {loading && (
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <Loader2 className="size-3.5 animate-spin" aria-hidden /> Loading…
            </span>
          )}
          <Select
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
            aria-label="Filter by technician"
            className="w-auto"
          >
            <option value="">All technicians</option>
            <option value="unassigned">Unassigned</option>
            {team.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        {APPOINTMENT_STATUSES.map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", APPOINTMENT_STATUS_META[s].dot)} aria-hidden />
            {APPOINTMENT_STATUS_META[s].label}
          </span>
        ))}
      </div>

      {view === "month" && (
        <MonthGrid
          cursor={cursor}
          today={today}
          appointments={visible}
          onOpenDay={openDay}
          onSelect={setSelectedId}
          onAdd={(day) => {
            setNewPrefill(day);
            setNewOpen(true);
          }}
        />
      )}
      {view === "week" && (
        <WeekGrid
          cursor={cursor}
          today={today}
          appointments={visible}
          onOpenDay={openDay}
          onSelect={setSelectedId}
        />
      )}
      {view === "day" && (
        <DayAgenda
          cursor={cursor}
          appointments={visible}
          onSelect={setSelectedId}
          onAdd={() => {
            setNewPrefill(cursor);
            setNewOpen(true);
          }}
        />
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

      {selected && (
        <AppointmentDialog
          key={selected.id}
          appointment={selected}
          team={team}
          onClose={() => setSelectedId(null)}
          onSaved={onSaved}
        />
      )}

      <NewAppointmentDialog
        open={newOpen}
        onClose={() => {
          setNewOpen(false);
          setNewPrefill(null);
        }}
        team={team}
        prefillDate={newPrefill}
        onCreated={(a) => setAppointments((cur) => [...cur, a])}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Month view                                                       */
/* ---------------------------------------------------------------- */

function MonthGrid({
  cursor,
  today,
  appointments,
  onOpenDay,
  onSelect,
  onAdd,
}: {
  cursor: Date;
  today: Date;
  appointments: AppointmentDTO[];
  onOpenDay: (day: Date) => void;
  onSelect: (id: string) => void;
  onAdd: (day: Date) => void;
}) {
  const gridStart = startOfWeek(startOfMonth(cursor));
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  return (
    <Card className="overflow-x-auto">
      <div className="min-w-[840px]">
        <div className="grid grid-cols-7 border-b border-line dark:border-night-line">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="px-2 py-2 text-center text-xs font-bold tracking-wide text-muted uppercase"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7" role="grid" aria-label="Month calendar">
          {days.map((day, i) => {
            const inMonth = day.getMonth() === cursor.getMonth();
            const isToday = isSameDay(day, today);
            const dayAppts = appointments.filter((a) => isSameDay(new Date(a.start), day));
            const shown = dayAppts.slice(0, 3);
            const extra = dayAppts.length - shown.length;
            return (
              <div
                key={day.toISOString()}
                role="gridcell"
                aria-label={`${fmtDayLong(day)}, ${dayAppts.length} appointments`}
                className={cn(
                  "group relative min-h-28 border-b border-line/60 p-1.5 dark:border-night-line/60",
                  i % 7 !== 6 && "border-r",
                  !inMonth && "bg-paper/60 dark:bg-white/[0.02]"
                )}
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => onOpenDay(day)}
                    aria-label={`Open ${fmtDayLong(day)}`}
                    className={cn(
                      "grid size-6 place-items-center rounded-full text-xs font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/10",
                      isToday
                        ? "bg-gold text-ink"
                        : inMonth
                          ? "text-ink dark:text-white"
                          : "text-muted"
                    )}
                  >
                    {day.getDate()}
                  </button>
                  <button
                    onClick={() => onAdd(day)}
                    aria-label={`Add appointment on ${fmtDayLong(day)}`}
                    className="rounded-md p-0.5 text-muted opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:bg-black/5 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <Plus className="size-3.5" aria-hidden />
                  </button>
                </div>
                <div className="mt-1 space-y-1">
                  {shown.map((a) => {
                    const meta = APPOINTMENT_STATUS_META[a.status as AppointmentStatus];
                    return (
                      <button
                        key={a.id}
                        onClick={() => onSelect(a.id)}
                        title={`${fmtTime(new Date(a.start))} — ${apptWho(a)} · ${a.service}`}
                        className={cn(
                          "block w-full truncate rounded-md px-1.5 py-0.5 text-left text-[11px] font-semibold transition-transform hover:scale-[1.02]",
                          meta?.chip ?? "bg-black/5 dark:bg-white/10"
                        )}
                      >
                        {fmtTime(new Date(a.start))} {apptWho(a)}
                      </button>
                    );
                  })}
                  {extra > 0 && (
                    <button
                      onClick={() => onOpenDay(day)}
                      className="block w-full rounded-md px-1.5 py-0.5 text-left text-[11px] font-semibold text-muted hover:bg-black/5 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      +{extra} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------------- */
/* Week view                                                        */
/* ---------------------------------------------------------------- */

function WeekGrid({
  cursor,
  today,
  appointments,
  onOpenDay,
  onSelect,
}: {
  cursor: Date;
  today: Date;
  appointments: AppointmentDTO[];
  onOpenDay: (day: Date) => void;
  onSelect: (id: string) => void;
}) {
  const ws = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));

  return (
    <Card className="overflow-x-auto">
      <div className="grid min-w-[840px] grid-cols-7">
        {days.map((day, i) => {
          const isToday = isSameDay(day, today);
          const dayAppts = appointments.filter((a) => isSameDay(new Date(a.start), day));
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-64 border-line/60 p-2 dark:border-night-line/60",
                i !== 6 && "border-r"
              )}
            >
              <button
                onClick={() => onOpenDay(day)}
                className="flex w-full items-baseline justify-between gap-1 rounded-lg px-1 py-0.5 hover:bg-black/5 dark:hover:bg-white/10"
                aria-label={`Open ${fmtDayLong(day)}`}
              >
                <span className="text-xs font-bold tracking-wide text-muted uppercase">
                  {WEEKDAYS[day.getDay()]}
                </span>
                <span
                  className={cn(
                    "grid size-6 place-items-center rounded-full text-xs font-semibold",
                    isToday ? "bg-gold text-ink" : "text-ink dark:text-white"
                  )}
                >
                  {day.getDate()}
                </span>
              </button>
              <div className="mt-2 space-y-1.5">
                {dayAppts.length === 0 && (
                  <p className="px-1 text-[11px] text-muted/70">No visits</p>
                )}
                {dayAppts.map((a) => {
                  const meta = APPOINTMENT_STATUS_META[a.status as AppointmentStatus];
                  return (
                    <button
                      key={a.id}
                      onClick={() => onSelect(a.id)}
                      className={cn(
                        "block w-full rounded-lg px-2 py-1.5 text-left text-[11px] font-semibold transition-transform hover:scale-[1.02]",
                        meta?.chip ?? "bg-black/5 dark:bg-white/10"
                      )}
                    >
                      <span className="block">
                        {fmtTime(new Date(a.start))}–{fmtTime(new Date(a.end))}
                      </span>
                      <span className="block truncate font-bold">{apptWho(a)}</span>
                      <span className="block truncate font-normal opacity-80">{a.service}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------------- */
/* Day view                                                         */
/* ---------------------------------------------------------------- */

function DayAgenda({
  cursor,
  appointments,
  onSelect,
  onAdd,
}: {
  cursor: Date;
  appointments: AppointmentDTO[];
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  const dayAppts = appointments.filter((a) => isSameDay(new Date(a.start), cursor));

  if (dayAppts.length === 0) {
    return (
      <CrmEmptyState
        icon={<CalendarClock className="size-6" />}
        title="Nothing scheduled this day"
        hint="Book a visit and it will appear on this calendar."
        action={
          <Button size="sm" onClick={onAdd}>
            <Plus className="size-4" aria-hidden /> New Appointment
          </Button>
        }
      />
    );
  }

  const hours = dayAppts.map((a) => new Date(a.start).getHours());
  const minHour = Math.min(7, ...hours);
  const maxHour = Math.max(18, ...hours);
  const rail = Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i);

  return (
    <Card className="divide-y divide-line/60 dark:divide-night-line/60">
      {rail.map((hour) => {
        const rowAppts = dayAppts.filter((a) => new Date(a.start).getHours() === hour);
        const label = new Date(2000, 0, 1, hour).toLocaleTimeString("en-US", {
          hour: "numeric",
        });
        return (
          <div key={hour} className="flex gap-3 px-4 py-2.5">
            <span className="w-16 shrink-0 pt-1 text-right text-xs font-semibold text-muted">
              {label}
            </span>
            <div className="min-h-8 flex-1 space-y-2">
              {rowAppts.map((a) => {
                const meta = APPOINTMENT_STATUS_META[a.status as AppointmentStatus];
                return (
                  <button
                    key={a.id}
                    onClick={() => onSelect(a.id)}
                    className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-line bg-white px-3 py-2 text-left text-sm transition-shadow hover:shadow-lift dark:border-night-line dark:bg-night-soft"
                  >
                    <span className={cn("size-2.5 shrink-0 rounded-full", meta?.dot)} aria-hidden />
                    <span className="font-semibold text-ink dark:text-white">{apptWho(a)}</span>
                    <span className="text-muted">{a.service}</span>
                    <span className="text-xs text-muted">
                      {fmtTime(new Date(a.start))}–{fmtTime(new Date(a.end))}
                    </span>
                    {a.technician && (
                      <span className="text-xs text-muted">· Tech: {a.technician.name}</span>
                    )}
                    <span className="ml-auto">
                      <AppointmentStatusBadge status={a.status} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </Card>
  );
}

/* ---------------------------------------------------------------- */
/* Detail / edit dialog                                             */
/* ---------------------------------------------------------------- */

const DESTRUCTIVE: AppointmentStatus[] = ["CANCELLED", "NO_SHOW"];

function AppointmentDialog({
  appointment,
  team,
  onClose,
  onSaved,
}: {
  appointment: AppointmentDTO;
  team: TeamMember[];
  onClose: () => void;
  onSaved: (a: AppointmentDTO) => void;
}) {
  const [form, setForm] = useState(() => ({
    status: appointment.status,
    technicianId: appointment.technicianId ?? "",
    start: toLocalInput(new Date(appointment.start)),
    end: toLocalInput(new Date(appointment.end)),
    location: appointment.location ?? "",
    notes: appointment.notes ?? "",
  }));
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    setErr(null);
    const start = new Date(form.start);
    const end = new Date(form.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setErr("Please provide valid start and end times.");
      return;
    }
    if (end <= start) {
      setErr("The end time must be after the start time.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: form.status,
          technicianId: form.technicianId || null,
          start: start.toISOString(),
          end: end.toISOString(),
          location: form.location.trim() || null,
          notes: form.notes.trim() || null,
        }),
      });
      const data = (await res.json()) as { appointment?: AppointmentDTO; error?: string };
      if (!res.ok || !data.appointment) throw new Error(data.error || "Save failed");
      onSaved(data.appointment);
      onClose();
    } catch (e) {
      setErr(e instanceof Error && e.message ? e.message : "Could not save the appointment.");
    } finally {
      setSaving(false);
      setConfirming(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const becameDestructive =
      DESTRUCTIVE.includes(form.status as AppointmentStatus) &&
      form.status !== appointment.status;
    if (becameDestructive && !confirming) {
      setConfirming(true);
      return;
    }
    void save();
  };

  const statusLabel =
    APPOINTMENT_STATUS_META[form.status as AppointmentStatus]?.label ?? form.status;

  return (
    <Dialog open onClose={onClose} title={appointment.service}>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <AppointmentStatusBadge status={appointment.status} />
        <span className="font-semibold text-ink dark:text-white">{apptWho(appointment)}</span>
        {appointment.customer?.phone && (
          <a
            href={`tel:${appointment.customer.phone}`}
            className="text-muted underline-offset-2 hover:underline"
          >
            {appointment.customer.phone}
          </a>
        )}
        {appointment.customerId && (
          <Link
            href={`/admin/customers?focus=${appointment.customerId}`}
            className="text-xs font-semibold text-muted underline-offset-2 hover:underline"
          >
            Customer record
          </Link>
        )}
        {appointment.lead && (
          <Link
            href={`/admin/leads/${appointment.lead.id}`}
            className="text-xs font-semibold text-muted underline-offset-2 hover:underline"
          >
            View lead: {appointment.lead.name}
          </Link>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="ap-status">Status</Label>
            <Select
              id="ap-status"
              value={form.status}
              onChange={(e) => {
                setForm((c) => ({ ...c, status: e.target.value }));
                setConfirming(false);
              }}
            >
              {APPOINTMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {APPOINTMENT_STATUS_META[s].label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="ap-tech">Technician</Label>
            <Select
              id="ap-tech"
              value={form.technicianId}
              onChange={(e) => setForm((c) => ({ ...c, technicianId: e.target.value }))}
            >
              <option value="">Unassigned</option>
              {team.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="ap-start">Start</Label>
            <Input
              id="ap-start"
              type="datetime-local"
              value={form.start}
              onChange={(e) => setForm((c) => ({ ...c, start: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="ap-end">End</Label>
            <Input
              id="ap-end"
              type="datetime-local"
              value={form.end}
              onChange={(e) => setForm((c) => ({ ...c, end: e.target.value }))}
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="ap-location">Location</Label>
          <Input
            id="ap-location"
            value={form.location}
            onChange={(e) => setForm((c) => ({ ...c, location: e.target.value }))}
            placeholder="Service address"
          />
        </div>
        <div>
          <Label htmlFor="ap-notes">Notes</Label>
          <Textarea
            id="ap-notes"
            value={form.notes}
            onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))}
            rows={3}
            className="min-h-20"
          />
        </div>
        <p className="text-xs text-muted">Booked {formatDateTime(appointment.createdAt)}</p>
        <FieldError message={err ?? undefined} />

        {confirming ? (
          <div className="rounded-xl border border-danger/40 bg-danger/5 p-3">
            <p className="text-sm font-semibold text-ink dark:text-white">
              Mark this appointment as {statusLabel}?
            </p>
            <p className="mt-1 text-xs text-muted">
              You can change the status again later if this was a mistake.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                Back
              </Button>
              <Button type="submit" variant="danger" size="sm" loading={saving}>
                Yes, mark {statusLabel.toLowerCase()}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={saving}>
              Save changes
            </Button>
          </div>
        )}
      </form>
    </Dialog>
  );
}

/* ---------------------------------------------------------------- */
/* New appointment dialog                                           */
/* ---------------------------------------------------------------- */

const DURATIONS = [
  { label: "1 hour", minutes: 60 },
  { label: "1.5 hours", minutes: 90 },
  { label: "2 hours", minutes: 120 },
  { label: "3 hours", minutes: 180 },
  { label: "4 hours", minutes: 240 },
];

type CustomerHit = Pick<
  CustomerDTO,
  "id" | "firstName" | "lastName" | "phone" | "email" | "city"
>;

function NewAppointmentDialog({
  open,
  onClose,
  team,
  prefillDate,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  team: TeamMember[];
  prefillDate: Date | null;
  onCreated: (a: AppointmentDTO) => void;
}) {
  const [customerQ, setCustomerQ] = useState("");
  const [hits, setHits] = useState<CustomerHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [customer, setCustomer] = useState<CustomerHit | null>(null);

  const [form, setForm] = useState({
    service: "",
    technicianId: "",
    date: "",
    time: "09:00",
    duration: 120,
    status: "REQUESTED",
    location: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /* Prefill date when opened from a calendar cell. */
  useEffect(() => {
    if (open && prefillDate) {
      setForm((c) => ({ ...c, date: toDateInput(prefillDate) }));
    }
  }, [open, prefillDate]);

  /* Debounced customer search. */
  useEffect(() => {
    if (!open) return;
    const q = customerQ.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      fetch(`/api/admin/customers?q=${encodeURIComponent(q)}&take=8`)
        .then(async (res) => {
          if (!res.ok) throw new Error();
          const data = (await res.json()) as { customers: CustomerHit[] };
          setHits(data.customers);
        })
        .catch(() => setHits([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => {
      clearTimeout(t);
      setSearching(false);
    };
  }, [customerQ, open]);

  const reset = () => {
    setCustomer(null);
    setCustomerQ("");
    setHits([]);
    setForm({
      service: "",
      technicianId: "",
      date: "",
      time: "09:00",
      duration: 120,
      status: "REQUESTED",
      location: "",
      notes: "",
    });
    setErr(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!form.service) {
      setErr("Please choose a service.");
      return;
    }
    if (!form.date || !form.time) {
      setErr("Please choose a date and time.");
      return;
    }
    const start = new Date(`${form.date}T${form.time}`);
    if (Number.isNaN(start.getTime())) {
      setErr("That date and time could not be understood.");
      return;
    }
    const end = new Date(start.getTime() + form.duration * 60 * 1000);

    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer?.id ?? null,
          technicianId: form.technicianId || null,
          service: form.service,
          start: start.toISOString(),
          end: end.toISOString(),
          status: form.status,
          location: form.location.trim() || null,
          notes: form.notes.trim() || null,
        }),
      });
      const data = (await res.json()) as { appointment?: AppointmentDTO; error?: string };
      if (!res.ok || !data.appointment) throw new Error(data.error || "Create failed");
      onCreated(data.appointment);
      reset();
      onClose();
    } catch (e2) {
      setErr(
        e2 instanceof Error && e2.message ? e2.message : "Could not schedule the appointment."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="New appointment">
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Customer search */}
        <div>
          <Label htmlFor="na-customer">Customer</Label>
          {customer ? (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2 dark:border-night-line">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink dark:text-white">
                  {customer.firstName} {customer.lastName}
                </p>
                <p className="truncate text-xs text-muted">
                  {[customer.phone, customer.email, customer.city].filter(Boolean).join(" · ") ||
                    "No contact info"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCustomer(null)}
                aria-label="Clear selected customer"
                className="rounded-lg p-1.5 text-muted hover:bg-black/5 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          ) : (
            <div>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
                  aria-hidden
                />
                <Input
                  id="na-customer"
                  value={customerQ}
                  onChange={(e) => setCustomerQ(e.target.value)}
                  placeholder="Search customers by name, phone or email…"
                  className="pl-9"
                  autoComplete="off"
                />
              </div>
              {customerQ.trim().length >= 2 && (
                <div
                  className="mt-1 max-h-44 overflow-y-auto rounded-xl border border-line dark:border-night-line"
                  role="listbox"
                  aria-label="Matching customers"
                >
                  {searching && <p className="px-3 py-2 text-xs text-muted">Searching…</p>}
                  {!searching && hits.length === 0 && (
                    <p className="px-3 py-2 text-xs text-muted">
                      No matching customers — the visit can be booked without one.
                    </p>
                  )}
                  {hits.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      role="option"
                      aria-selected={false}
                      onClick={() => {
                        setCustomer(c);
                        setCustomerQ("");
                        setHits([]);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-paper dark:hover:bg-white/5"
                    >
                      <span className="font-semibold text-ink dark:text-white">
                        {c.firstName} {c.lastName}
                      </span>
                      <span className="ml-2 text-xs text-muted">
                        {[c.phone, c.email].filter(Boolean).join(" · ")}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="na-service" required>
              Service
            </Label>
            <Select
              id="na-service"
              value={form.service}
              onChange={(e) => setForm((c) => ({ ...c, service: e.target.value }))}
              required
            >
              <option value="">Choose…</option>
              {SERVICE_TYPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="na-tech">Technician</Label>
            <Select
              id="na-tech"
              value={form.technicianId}
              onChange={(e) => setForm((c) => ({ ...c, technicianId: e.target.value }))}
            >
              <option value="">Unassigned</option>
              {team.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="na-date" required>
              Date
            </Label>
            <Input
              id="na-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm((c) => ({ ...c, date: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="na-time" required>
              Time
            </Label>
            <Input
              id="na-time"
              type="time"
              value={form.time}
              onChange={(e) => setForm((c) => ({ ...c, time: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="na-duration">Duration</Label>
            <Select
              id="na-duration"
              value={String(form.duration)}
              onChange={(e) => setForm((c) => ({ ...c, duration: Number(e.target.value) }))}
            >
              {DURATIONS.map((d) => (
                <option key={d.minutes} value={d.minutes}>
                  {d.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="na-status">Status</Label>
            <Select
              id="na-status"
              value={form.status}
              onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))}
            >
              <option value="REQUESTED">Requested</option>
              <option value="CONFIRMED">Confirmed</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="na-location">Location</Label>
            <Input
              id="na-location"
              value={form.location}
              onChange={(e) => setForm((c) => ({ ...c, location: e.target.value }))}
              placeholder="Service address"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="na-notes">Notes</Label>
          <Textarea
            id="na-notes"
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
            Schedule
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
