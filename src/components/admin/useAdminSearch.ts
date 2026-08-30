"use client";

import { useEffect, useRef, useState } from "react";

export type SearchItem = { id: string; label: string; href: string };
export type SearchGroups = {
  leads: SearchItem[];
  customers: SearchItem[];
  appointments: SearchItem[];
  articles: SearchItem[];
  services: SearchItem[];
  reviews: SearchItem[];
};

export const SEARCH_GROUP_ORDER: { key: keyof SearchGroups; label: string }[] = [
  { key: "leads", label: "Leads" },
  { key: "customers", label: "Customers" },
  { key: "appointments", label: "Appointments" },
  { key: "articles", label: "Articles" },
  { key: "services", label: "Services" },
  { key: "reviews", label: "Reviews" },
];

export function countResults(groups: SearchGroups | null): number {
  if (!groups) return 0;
  return SEARCH_GROUP_ORDER.reduce((sum, g) => sum + groups[g.key].length, 0);
}

/**
 * Debounced global admin search against GET /api/admin/search?q=.
 * Shared by the topbar GlobalSearch and the command palette.
 */
export function useAdminSearch(query: string) {
  const [results, setResults] = useState<SearchGroups | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      abortRef.current?.abort();
      setResults(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Search failed");
        const data = (await res.json()) as SearchGroups;
        setResults(data);
        setError(null);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError("Search is unavailable right now.");
          setResults(null);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  return { results, loading, error };
}
