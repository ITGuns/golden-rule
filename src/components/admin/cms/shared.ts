/**
 * Shared client-safe helpers for the admin CMS feature components.
 * (No imports from server-only modules — safe in "use client" files.)
 */

/** JSON fetch wrapper: throws Error with the API's message on non-2xx. */
export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  let res: globalThis.Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new Error("Network error — check your connection and try again.");
  }
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data as T;
}

/** "SUPER_ADMIN" → "Super Admin" */
export function roleLabel(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export type BadgeTone = "neutral" | "gold" | "green" | "red" | "blue" | "purple" | "orange";

export const ROLE_TONES: Record<string, BadgeTone> = {
  SUPER_ADMIN: "gold",
  ADMIN: "purple",
  MANAGER: "blue",
  DISPATCHER: "orange",
  TECHNICIAN: "neutral",
  MARKETING: "green",
  CONTENT_EDITOR: "blue",
};

/** Kebab-case slug from a title. */
export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
}

/** Replace the query string without a server round-trip (App Router-safe). */
export function replaceQuery(query: string) {
  if (typeof window === "undefined") return;
  const base = window.location.pathname;
  window.history.replaceState(null, "", query ? `${base}?${query}` : base);
}

/** Live URL for a service by division (construction projects roll up to one page). */
export function serviceLiveHref(division: string, slug: string) {
  if (division === "COMMERCIAL") return `/commercial/${slug}`;
  if (division === "NEW_CONSTRUCTION") return "/new-construction";
  return `/residential/${slug}`;
}

// ————— DTOs (dates serialized to ISO strings for client components) —————

export type ArticleDTO = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  heroImage: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ServiceDTO = {
  id: string;
  slug: string;
  name: string;
  division: string;
  excerpt: string;
  body: string;
  heroImage: string | null;
  published: boolean;
  sortOrder: number;
};

export type UserDTO = {
  id: string;
  name: string;
  email: string;
  role: string;
  title: string | null;
  active: boolean;
  createdAt: string;
};
