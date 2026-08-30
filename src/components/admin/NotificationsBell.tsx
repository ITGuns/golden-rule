"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  Bot,
  Calendar,
  CheckCheck,
  ClipboardList,
  FileText,
  Inbox,
  MessageSquare,
  PhoneMissed,
  Star,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";

type Notice = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

const TYPE_ICONS: Record<string, LucideIcon> = {
  NEW_LEAD: Inbox,
  SERVICE_REQUEST: ClipboardList,
  MISSED_CALL: PhoneMissed,
  CHAT_LEAD: Bot,
  APPOINTMENT: Calendar,
  REVIEW: Star,
  CONTACT: MessageSquare,
  ESTIMATE_REQUEST: FileText,
  CAREER: UserCog,
};

/** Topbar notifications bell: unread badge + dropdown, polls every 30s. */
export function NotificationsBell() {
  const router = useRouter();
  const [items, setItems] = useState<Notice[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { items: Notice[]; unread: number };
      setItems(data.items);
      setUnread(data.unread);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function markAll() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
    } catch {
      load();
    }
  }

  async function openNotice(n: Notice) {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [n.id] }),
      }).catch(() => undefined);
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load();
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
        className="relative rounded-xl p-2 text-muted transition-colors hover:bg-black/5 hover:text-ink dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
      >
        <Bell className="size-5" aria-hidden />
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-line bg-white shadow-lift dark:border-night-line dark:bg-night-soft sm:w-96"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3 dark:border-night-line">
            <p className="font-display text-sm font-semibold text-ink dark:text-white">
              Notifications
            </p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="inline-flex items-center gap-1 text-xs font-semibold text-gold-deep hover:underline dark:text-gold"
              >
                <CheckCheck className="size-3.5" aria-hidden /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            {!loaded && (
              <p className="px-3 py-4 text-sm text-muted dark:text-gray-400">Loading…</p>
            )}
            {loaded && error && (
              <p className="px-3 py-4 text-sm text-danger" role="alert">
                Couldn’t load notifications.{" "}
                <button type="button" onClick={load} className="font-semibold underline">
                  Retry
                </button>
              </p>
            )}
            {loaded && !error && items.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted dark:text-gray-400">
                You’re all caught up.
              </p>
            )}
            {loaded &&
              !error &&
              items.map((n) => {
                const Icon = TYPE_ICONS[n.type] || Bell;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => openNotice(n)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5",
                      !n.read && "bg-gold/8 dark:bg-gold/10"
                    )}
                  >
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold-deep dark:text-gold">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink dark:text-white">
                        {n.title}
                      </span>
                      {n.body && (
                        <span className="block truncate text-xs text-muted dark:text-gray-400">
                          {n.body}
                        </span>
                      )}
                      <span className="mt-0.5 block text-[11px] text-muted dark:text-gray-500">
                        {timeAgo(n.createdAt)}
                      </span>
                    </span>
                    {!n.read && (
                      <span
                        className="mt-2 size-2 shrink-0 rounded-full bg-gold"
                        aria-hidden
                        title="Unread"
                      />
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
