"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  countResults,
  SEARCH_GROUP_ORDER,
  useAdminSearch,
  type SearchItem,
} from "./useAdminSearch";

/**
 * Topbar global search — combobox with grouped, keyboard-navigable results
 * from GET /api/admin/search?q=.
 */
export function GlobalSearch({ className }: { className?: string }) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { results, loading, error } = useAdminSearch(query);

  const flat: { item: SearchItem; group: string }[] = [];
  if (results) {
    for (const g of SEARCH_GROUP_ORDER) {
      for (const item of results[g.key]) flat.push({ item, group: g.label });
    }
  }
  const total = countResults(results);
  const showPanel = open && query.trim().length >= 2;

  function go(href: string) {
    setOpen(false);
    setQuery("");
    setActiveIndex(-1);
    inputRef.current?.blur();
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!showPanel || flat.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % flat.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? flat.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0 && activeIndex < flat.length) {
      e.preventDefault();
      go(flat[activeIndex].item.href);
    }
  }

  let flatIndex = -1;

  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted dark:text-gray-500"
        aria-hidden
      />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-label="Search leads, customers, appointments and content"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-activedescendant={
          activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined
        }
        aria-autocomplete="list"
        placeholder="Search anything…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Delay so option onMouseDown/onClick fires first.
          setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={onKeyDown}
        className="w-full rounded-xl border border-line bg-paper py-2 pl-9 pr-3 text-sm text-ink placeholder:text-muted/70 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40 dark:border-night-line dark:bg-night dark:text-white"
      />

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          aria-label="Search results"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-line bg-white p-2 shadow-lift dark:border-night-line dark:bg-night-soft"
        >
          {loading && (
            <p className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted dark:text-gray-400">
              <Loader2 className="size-4 animate-spin" aria-hidden /> Searching…
            </p>
          )}
          {!loading && error && (
            <p className="px-3 py-2.5 text-sm text-danger" role="alert">
              {error}
            </p>
          )}
          {!loading && !error && total === 0 && (
            <p className="px-3 py-2.5 text-sm text-muted dark:text-gray-400">
              No results for “{query.trim()}”.
            </p>
          )}
          {!loading &&
            !error &&
            results &&
            SEARCH_GROUP_ORDER.map((g) =>
              results[g.key].length === 0 ? null : (
                <div key={g.key} className="mb-1">
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted dark:text-gray-500">
                    {g.label}
                  </p>
                  {results[g.key].map((item) => {
                    flatIndex += 1;
                    const idx = flatIndex;
                    return (
                      <button
                        key={item.id}
                        id={`${listId}-opt-${idx}`}
                        type="button"
                        role="option"
                        aria-selected={activeIndex === idx}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => go(item.href)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={cn(
                          "block w-full truncate rounded-lg px-3 py-2 text-left text-sm text-body dark:text-gray-300",
                          activeIndex === idx &&
                            "bg-gold/15 text-ink dark:bg-white/10 dark:text-white"
                        )}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )
            )}
        </div>
      )}
    </div>
  );
}
