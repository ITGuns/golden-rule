"use client";
/* eslint-disable @next/next/no-img-element -- admin-only picker over an
   arbitrary local library (svg/gif included); the optimizer isn't wanted here */

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { EmptyState } from "@/components/admin/EmptyState";
import { cn } from "@/lib/utils";
import { apiFetch } from "./shared";

type MediaItem = { url: string; name: string };

/**
 * Image-library picker dialog. Lists /public/images (+ /public/uploads) via
 * /api/admin/media; clicking a tile selects it.
 */
export function MediaPicker({
  open,
  onClose,
  onSelect,
  selected,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  /** Currently selected URL, highlighted in the grid. */
  selected?: string | null;
}) {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open || items !== null) return;
    let cancelled = false;
    setError(null);
    apiFetch<{ items: MediaItem[] }>("/api/admin/media")
      .then((data) => {
        if (!cancelled) setItems(data.items);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [open, items]);

  const filtered = (items ?? []).filter((item) =>
    item.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <Dialog open={open} onClose={onClose} title="Choose an image" className="max-w-3xl">
      <div className="relative mb-4">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the image library…"
          aria-label="Search images"
          className="pl-10"
        />
      </div>

      {error ? (
        <EmptyState
          title="Couldn't load the image library"
          hint={error}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setItems(null);
                setError(null);
              }}
            >
              Try again
            </Button>
          }
        />
      ) : items === null ? (
        <div
          className="grid grid-cols-3 gap-3 sm:grid-cols-4"
          role="status"
          aria-label="Loading images"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-video rounded-lg bg-black/10 dark:bg-white/10"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={query ? "No images match your search" : "The image library is empty"}
          hint={
            query
              ? "Try a different file name."
              : "Add files to /public/images or /public/uploads to see them here."
          }
        />
      ) : (
        <>
          <p className="mb-2 text-xs text-muted dark:text-gray-400">
            {filtered.length} image{filtered.length === 1 ? "" : "s"}
          </p>
          <ul className="grid max-h-[50vh] grid-cols-3 gap-3 overflow-y-auto pr-1 sm:grid-cols-4">
            {filtered.map((item) => (
              <li key={item.url}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(item.url);
                    onClose();
                  }}
                  aria-label={`Use image ${item.name}`}
                  aria-pressed={selected === item.url}
                  className={cn(
                    "group block w-full overflow-hidden rounded-lg border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
                    selected === item.url
                      ? "border-gold"
                      : "border-transparent hover:border-gold/60"
                  )}
                >
                  <span className="block aspect-video bg-black/5 dark:bg-white/5">
                    <img
                      src={item.url}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  </span>
                  <span className="block truncate px-1 py-1 text-left text-[11px] text-muted group-hover:text-ink dark:group-hover:text-white">
                    {item.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Dialog>
  );
}

/**
 * Reusable hero-image field: thumbnail preview + manual URL input + a
 * "Browse library" button that opens the MediaPicker.
 */
export function ImageField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink dark:text-white">
        {label}
      </label>
      <div className="flex items-start gap-3">
        <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-line bg-black/5 dark:border-night-line dark:bg-white/5">
          {value ? (
            <img src={value} alt="Selected image preview" className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center text-[10px] text-muted">
              No image
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <Input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/images/…"
            aria-describedby={`${id}-hint`}
          />
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
              Browse library
            </Button>
            {value && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
                Remove
              </Button>
            )}
          </div>
          <p id={`${id}-hint`} className="text-xs text-muted dark:text-gray-400">
            Pick from the site library or paste a path under /images or /uploads.
          </p>
        </div>
      </div>
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={onChange}
        selected={value || null}
      />
    </div>
  );
}
