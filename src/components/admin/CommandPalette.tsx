"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEMS, QUICK_ACTIONS, type AdminNavItem } from "./nav";
import {
  SEARCH_GROUP_ORDER,
  useAdminSearch,
  type SearchItem,
} from "./useAdminSearch";

/**
 * Cmd/Ctrl+K command palette: fuzzy nav + quick-create actions and inline
 * global search results.
 */

type Entry = {
  key: string;
  label: string;
  group: string;
  href: string;
  icon?: AdminNavItem["icon"];
};

/** Simple fuzzy score: substring beats subsequence; lower gaps beat higher. */
function fuzzyScore(query: string, text: string): number | null {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (!q) return 0;
  const idx = t.indexOf(q);
  if (idx >= 0) return 200 - idx;
  let ti = 0;
  let gaps = 0;
  for (const ch of q) {
    const found = t.indexOf(ch, ti);
    if (found === -1) return null;
    gaps += found - ti;
    ti = found + 1;
  }
  return Math.max(1, 100 - gaps);
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const { results, loading } = useAdminSearch(query);

  // Reset when opening; focus the input.
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      const t = setTimeout(() => inputRef.current?.focus(), 20);
      document.body.style.overflow = "hidden";
      return () => {
        clearTimeout(t);
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  const actionEntries = useMemo<Entry[]>(() => {
    const nav: Entry[] = ADMIN_NAV_ITEMS.map((item) => ({
      key: `nav-${item.href}`,
      label: `Go to ${item.label}`,
      group: "Navigate",
      href: item.href,
      icon: item.icon,
    }));
    const quick: Entry[] = QUICK_ACTIONS.map((item) => ({
      key: `act-${item.href}`,
      label: item.label,
      group: "Actions",
      href: item.href,
      icon: item.icon,
    }));
    return [...quick, ...nav];
  }, []);

  const entries = useMemo<Entry[]>(() => {
    const q = query.trim();
    const scored = actionEntries
      .map((e) => ({ e, score: fuzzyScore(q, e.label) }))
      .filter((x): x is { e: Entry; score: number } => x.score !== null)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.e);

    const searchEntries: Entry[] = [];
    if (results) {
      for (const g of SEARCH_GROUP_ORDER) {
        for (const item of results[g.key] as SearchItem[]) {
          searchEntries.push({
            key: `s-${g.key}-${item.id}`,
            label: item.label,
            group: g.label,
            href: item.href,
          });
        }
      }
    }
    return [...scored, ...searchEntries];
  }, [actionEntries, query, results]);

  // Keep active index in range as results change.
  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, entries.length - 1)));
  }, [entries.length]);

  // Keep the active option visible.
  useEffect(() => {
    const el = document.getElementById(`${listId}-item-${activeIndex}`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, listId]);

  if (!open) return null;

  function go(href: string) {
    onClose();
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (entries.length ? (i + 1) % entries.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (entries.length ? (i <= 0 ? entries.length - 1 : i - 1) : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const entry = entries[activeIndex];
      if (entry) go(entry.href);
    }
  }

  let lastGroup = "";

  return (
    <div
      className="fixed inset-0 z-[95] flex items-start justify-center px-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onKeyDown={onKeyDown}
    >
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-white shadow-2xl dark:border-night-line dark:bg-night-soft">
        <div className="flex items-center gap-3 border-b border-line px-4 dark:border-night-line">
          {loading ? (
            <Loader2 className="size-4.5 shrink-0 animate-spin text-muted" aria-hidden />
          ) : (
            <Search className="size-4.5 shrink-0 text-muted" aria-hidden />
          )}
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={
              entries.length > 0 ? `${listId}-item-${activeIndex}` : undefined
            }
            aria-autocomplete="list"
            aria-label="Type a command or search"
            placeholder="Type a command or search…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            className="w-full bg-transparent py-3.5 text-[15px] text-ink placeholder:text-muted/70 focus:outline-none dark:text-white"
          />
          <kbd className="hidden shrink-0 rounded-md border border-line px-1.5 py-0.5 text-[11px] font-semibold text-muted dark:border-night-line dark:text-gray-400 sm:block">
            esc
          </kbd>
        </div>

        <div
          id={listId}
          ref={listRef}
          role="listbox"
          aria-label="Commands and results"
          className="max-h-[50vh] overflow-y-auto p-2"
        >
          {entries.length === 0 && !loading && (
            <p className="px-3 py-6 text-center text-sm text-muted dark:text-gray-400">
              {query.trim().length >= 2
                ? `Nothing matches “${query.trim()}”.`
                : "No matching commands."}
            </p>
          )}
          {entries.map((entry, idx) => {
            const showHeader = entry.group !== lastGroup;
            lastGroup = entry.group;
            const Icon = entry.icon;
            return (
              <div key={entry.key}>
                {showHeader && (
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted dark:text-gray-500">
                    {entry.group}
                  </p>
                )}
                <button
                  id={`${listId}-item-${idx}`}
                  type="button"
                  role="option"
                  aria-selected={activeIndex === idx}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => go(entry.href)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-body transition-colors dark:text-gray-300",
                    activeIndex === idx && "bg-gold/15 text-ink dark:bg-white/10 dark:text-white"
                  )}
                >
                  {Icon ? (
                    <Icon className="size-4 shrink-0 text-muted dark:text-gray-400" aria-hidden />
                  ) : (
                    <ArrowUpRight
                      className="size-4 shrink-0 text-muted dark:text-gray-400"
                      aria-hidden
                    />
                  )}
                  <span className="truncate">{entry.label}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
