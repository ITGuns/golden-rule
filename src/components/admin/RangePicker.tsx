"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESETS = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
  { key: "90d", label: "90d" },
] as const;

/**
 * Drives the `?range=` / `?from=&to=` search params used by resolveRange().
 * Preserves all other query params (e.g. report type).
 */
export function RangePicker({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hasCustom = Boolean(searchParams.get("from") && searchParams.get("to"));
  const activeKey = hasCustom ? "custom" : searchParams.get("range") || "30d";

  const [showCustom, setShowCustom] = useState(hasCustom);
  const [from, setFrom] = useState(searchParams.get("from") || "");
  const [to, setTo] = useState(searchParams.get("to") || "");

  function applyPreset(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("from");
    params.delete("to");
    params.set("range", key);
    setShowCustom(false);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function applyCustom() {
    if (!from || !to) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("range");
    params.set("from", from);
    params.set("to", to);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const btnBase =
    "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-2";
  const inactive =
    "text-muted hover:bg-black/5 hover:text-ink dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white";
  const active = "bg-ink text-white dark:bg-gold dark:text-ink";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div
        role="group"
        aria-label="Date range"
        className="inline-flex items-center gap-1 rounded-xl border border-line bg-white p-1 dark:border-night-line dark:bg-night-soft"
      >
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => applyPreset(p.key)}
            aria-pressed={activeKey === p.key}
            className={cn(btnBase, activeKey === p.key ? active : inactive)}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowCustom((v) => !v)}
          aria-pressed={activeKey === "custom"}
          aria-expanded={showCustom}
          className={cn(
            btnBase,
            "inline-flex items-center gap-1.5",
            activeKey === "custom" ? active : inactive
          )}
        >
          <CalendarClock className="size-4" aria-hidden />
          Custom
        </button>
      </div>

      {showCustom && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="range-from">
            From date
          </label>
          <input
            id="range-from"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm text-ink focus:border-gold focus:outline-none dark:border-night-line dark:bg-night-soft dark:text-white"
          />
          <span className="text-sm text-muted dark:text-gray-400" aria-hidden>
            –
          </span>
          <label className="sr-only" htmlFor="range-to">
            To date
          </label>
          <input
            id="range-to"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm text-ink focus:border-gold focus:outline-none dark:border-night-line dark:bg-night-soft dark:text-white"
          />
          <button
            type="button"
            onClick={applyCustom}
            disabled={!from || !to}
            className="rounded-lg bg-ink px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-night-soft disabled:opacity-50 dark:bg-gold dark:text-ink dark:hover:bg-gold-deep"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
