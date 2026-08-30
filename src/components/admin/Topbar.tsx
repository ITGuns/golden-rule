"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Command, LogOut, Menu } from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { cn, initials } from "@/lib/utils";
import { Badge } from "@/components/ui/Card";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationsBell } from "./NotificationsBell";
import { ThemeToggle } from "./ThemeToggle";

function roleLabel(role: string) {
  return role.replace(/_/g, " ").toLowerCase().replace(/\b./g, (c) => c.toUpperCase());
}

function UserMenu({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

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

  async function signOut() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.refresh();
      router.replace("/admin/login");
    }
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.name}`}
        className="flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-gold font-display text-xs font-bold text-ink">
          {initials(user.name)}
        </span>
        <ChevronDown
          className={cn(
            "hidden size-4 text-muted transition-transform dark:text-gray-400 sm:block",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-line bg-white p-2 shadow-lift dark:border-night-line dark:bg-night-soft"
        >
          <div className="border-b border-line px-3 py-2.5 dark:border-night-line">
            <p className="truncate text-sm font-semibold text-ink dark:text-white">{user.name}</p>
            <p className="truncate text-xs text-muted dark:text-gray-400">{user.email}</p>
            <Badge tone="gold" className="mt-1.5">
              {roleLabel(user.role)}
            </Badge>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            disabled={busy}
            className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-body transition-colors hover:bg-black/5 hover:text-ink disabled:opacity-60 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <LogOut className="size-4" aria-hidden />
            {busy ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}

/** Sticky admin topbar: menu, global search, ⌘K, notifications, theme, user. */
export function Topbar({
  user,
  onMenu,
  onOpenPalette,
}: {
  user: SessionUser;
  onMenu: () => void;
  onOpenPalette: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-[64px] items-center gap-3 border-b border-line bg-white/85 px-4 backdrop-blur dark:border-night-line dark:bg-night-soft/85 sm:px-6">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open navigation"
        className="rounded-xl p-2 text-muted hover:bg-black/5 hover:text-ink dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <GlobalSearch className="hidden w-full max-w-md md:block" />

      <button
        type="button"
        onClick={onOpenPalette}
        aria-label="Open command palette"
        title="Command palette (Ctrl/⌘ K)"
        className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-line px-2.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-black/5 hover:text-ink dark:border-night-line dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
      >
        <Command className="size-3.5" aria-hidden />
        <span className="hidden sm:inline">K</span>
      </button>

      <NotificationsBell />
      <ThemeToggle />
      <UserMenu user={user} />
    </header>
  );
}
