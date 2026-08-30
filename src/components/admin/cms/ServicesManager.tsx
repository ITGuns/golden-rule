"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ExternalLink,
  Eye,
  Pencil,
  Wrench,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, FieldError } from "@/components/ui/Field";
import { Card, Badge } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/admin/EmptyState";
import { RichBody } from "@/components/content/RichBody";
import { DIVISIONS, type DivisionKey } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Toggle } from "./Toggle";
import { ImageField } from "./MediaPicker";
import { apiFetch, serviceLiveHref, type ServiceDTO } from "./shared";

const DIVISION_ORDER: DivisionKey[] = ["RESIDENTIAL", "COMMERCIAL", "NEW_CONSTRUCTION"];

const BODY_HELP =
  "Plain text with light formatting: ## Heading and ### Subheading, **bold**, *italic*, " +
  "- bulleted lists, 1. numbered lists, --- for a divider. Separate paragraphs with a blank line.";

/** Match the API ordering: sortOrder, then name. */
function byOrder(a: ServiceDTO, b: ServiceDTO) {
  return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
}

/**
 * Services workspace: every public service page grouped by division, with
 * inline excerpt edits, publish toggles, ordering controls and a full editor
 * dialog. Slug and division are locked — the public URLs are built from them.
 */
export function ServicesManager({ initialServices }: { initialServices: ServiceDTO[] }) {
  const [services, setServices] = useState<ServiceDTO[]>(initialServices);
  const [error, setError] = useState<string | null>(null);
  /** Ids with a request in flight (toggle / reorder). */
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<ServiceDTO | null>(null);
  const [excerptEdit, setExcerptEdit] = useState<{ id: string; value: string; error?: string; saving?: boolean } | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, ServiceDTO[]>();
    for (const s of services) {
      const list = map.get(s.division) ?? [];
      list.push(s);
      map.set(s.division, list);
    }
    for (const list of map.values()) list.sort(byOrder);
    return map;
  }, [services]);

  const publishedCount = services.filter((s) => s.published).length;

  function markPending(ids: string[], on: boolean) {
    setPending((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  function applyUpdate(updated: ServiceDTO) {
    setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  async function togglePublished(service: ServiceDTO) {
    setError(null);
    markPending([service.id], true);
    const next = !service.published;
    applyUpdate({ ...service, published: next }); // optimistic
    try {
      const result = await apiFetch<{ service: ServiceDTO }>(
        `/api/admin/services/${service.id}`,
        { method: "PATCH", body: JSON.stringify({ published: next }) }
      );
      applyUpdate(result.service);
    } catch (e) {
      applyUpdate(service); // revert
      setError(e instanceof Error ? e.message : "Failed to update the service.");
    } finally {
      markPending([service.id], false);
    }
  }

  async function move(service: ServiceDTO, dir: -1 | 1) {
    setError(null);
    const group = grouped.get(service.division) ?? [];
    const idx = group.findIndex((s) => s.id === service.id);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= group.length) return;

    const reordered = [...group];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    // Normalize the whole group so future moves are stable even when the
    // seeded sortOrder values collide.
    const changes = reordered
      .map((s, i) => ({ service: s, sortOrder: i }))
      .filter((c) => c.service.sortOrder !== c.sortOrder);
    if (changes.length === 0) return;

    const snapshot = services;
    markPending(changes.map((c) => c.service.id), true);
    setServices((prev) =>
      prev.map((s) => {
        const change = changes.find((c) => c.service.id === s.id);
        return change ? { ...s, sortOrder: change.sortOrder } : s;
      })
    );
    try {
      for (const change of changes) {
        await apiFetch<{ service: ServiceDTO }>(`/api/admin/services/${change.service.id}`, {
          method: "PATCH",
          body: JSON.stringify({ sortOrder: change.sortOrder }),
        });
      }
    } catch (e) {
      setServices(snapshot); // revert
      setError(e instanceof Error ? e.message : "Failed to reorder services.");
    } finally {
      markPending(changes.map((c) => c.service.id), false);
    }
  }

  async function saveExcerpt() {
    if (!excerptEdit) return;
    const value = excerptEdit.value.trim();
    if (value.length < 10) {
      setExcerptEdit({ ...excerptEdit, error: "Excerpt must be at least 10 characters." });
      return;
    }
    if (value.length > 500) {
      setExcerptEdit({ ...excerptEdit, error: "Keep the excerpt under 500 characters." });
      return;
    }
    setError(null);
    setExcerptEdit({ ...excerptEdit, error: undefined, saving: true });
    try {
      const result = await apiFetch<{ service: ServiceDTO }>(
        `/api/admin/services/${excerptEdit.id}`,
        { method: "PATCH", body: JSON.stringify({ excerpt: value }) }
      );
      applyUpdate(result.service);
      setExcerptEdit(null);
    } catch (e) {
      setExcerptEdit((prev) =>
        prev
          ? { ...prev, saving: false, error: e instanceof Error ? e.message : "Save failed." }
          : prev
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Website</p>
          <h1 className="display text-2xl text-ink dark:text-white">Services</h1>
          <p className="mt-1 text-sm text-muted dark:text-gray-400">
            {publishedCount} of {services.length} live — grouped by division. Name, description
            and ordering are editable; slugs and divisions are locked because the public URLs
            are built from them.
          </p>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}

      {services.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No services yet"
          hint="Service pages are created by the site seed (prisma/seed.ts). Run the seed to populate this list."
        />
      ) : (
        DIVISION_ORDER.filter((key) => grouped.has(key)).map((key) => {
          const list = grouped.get(key) ?? [];
          const division = DIVISIONS[key];
          return (
            <section key={key} aria-labelledby={`division-${key}`}>
              <div className="mb-3 flex items-center gap-3">
                <h2
                  id={`division-${key}`}
                  className="font-display text-lg font-semibold text-ink dark:text-white"
                >
                  {division.label}
                </h2>
                <Badge tone="neutral">
                  {list.length} service{list.length === 1 ? "" : "s"}
                </Badge>
              </div>
              <Card className="divide-y divide-line dark:divide-night-line">
                {list.map((service, idx) => {
                  const busy = pending.has(service.id);
                  const rowEdit =
                    excerptEdit && excerptEdit.id === service.id ? excerptEdit : null;
                  return (
                    <div
                      key={service.id}
                      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start"
                    >
                      {/* Order controls */}
                      <div className="flex shrink-0 gap-1 sm:flex-col" role="group" aria-label={`Reorder ${service.name}`}>
                        <button
                          type="button"
                          onClick={() => move(service, -1)}
                          disabled={idx === 0 || busy}
                          aria-label={`Move ${service.name} up`}
                          className="rounded-lg border border-line p-1.5 text-muted transition-colors hover:bg-black/5 hover:text-ink disabled:opacity-30 dark:border-night-line dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <ArrowUp className="size-3.5" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(service, 1)}
                          disabled={idx === list.length - 1 || busy}
                          aria-label={`Move ${service.name} down`}
                          className="rounded-lg border border-line p-1.5 text-muted transition-colors hover:bg-black/5 hover:text-ink disabled:opacity-30 dark:border-night-line dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <ArrowDown className="size-3.5" aria-hidden />
                        </button>
                      </div>

                      {/* Name + excerpt */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditing(service)}
                            className="truncate text-left font-semibold text-ink hover:underline dark:text-white"
                          >
                            {service.name}
                          </button>
                          <span className="font-mono text-xs text-muted dark:text-gray-400">
                            {serviceLiveHref(service.division, service.slug)}
                          </span>
                        </div>

                        {rowEdit ? (
                          <div className="mt-2">
                            <Textarea
                              value={rowEdit.value}
                              onChange={(e) =>
                                setExcerptEdit({ ...rowEdit, value: e.target.value, error: undefined })
                              }
                              rows={2}
                              className="min-h-0 text-sm"
                              aria-label={`Excerpt for ${service.name}`}
                              aria-invalid={rowEdit.error ? true : undefined}
                              autoFocus
                            />
                            <FieldError message={rowEdit.error} />
                            <div className="mt-2 flex items-center gap-2">
                              <Button size="sm" onClick={saveExcerpt} loading={rowEdit.saving}>
                                <Check className="size-3.5" aria-hidden />
                                Save
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExcerptEdit(null)}
                                disabled={rowEdit.saving}
                              >
                                <X className="size-3.5" aria-hidden />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setExcerptEdit({ id: service.id, value: service.excerpt })
                            }
                            title="Edit excerpt"
                            className="group mt-1 block max-w-2xl text-left"
                          >
                            <span className="line-clamp-2 text-sm text-body group-hover:text-ink dark:text-gray-300 dark:group-hover:text-white">
                              {service.excerpt}
                            </span>
                            <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 dark:text-gray-400">
                              <Pencil className="size-3" aria-hidden />
                              Edit excerpt
                            </span>
                          </button>
                        )}
                      </div>

                      {/* Status + actions */}
                      <div className="flex shrink-0 flex-wrap items-center gap-3 sm:justify-end">
                        <div className="flex items-center gap-2">
                          <Toggle
                            checked={service.published}
                            disabled={busy}
                            onChange={() => togglePublished(service)}
                            label={`${service.published ? "Unpublish" : "Publish"} ${service.name}`}
                          />
                          <span
                            className={cn(
                              "text-xs font-semibold",
                              service.published
                                ? "text-success"
                                : "text-muted dark:text-gray-400"
                            )}
                          >
                            {service.published ? "Live" : "Hidden"}
                          </span>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setEditing(service)}>
                          <Pencil className="size-3.5" aria-hidden />
                          Edit
                        </Button>
                        {service.published && (
                          <a
                            href={serviceLiveHref(service.division, service.slug)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-semibold text-ink hover:underline dark:text-white"
                          >
                            <ExternalLink className="size-3.5" aria-hidden />
                            View live
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </Card>
            </section>
          );
        })
      )}

      <ServiceEditDialog
        service={editing}
        onClose={() => setEditing(null)}
        onSaved={(updated) => {
          applyUpdate(updated);
          setEditing(null);
        }}
      />
    </div>
  );
}

/** Full editor dialog: name, excerpt, hero image, body with live preview. */
function ServiceEditDialog({
  service,
  onClose,
  onSaved,
}: {
  service: ServiceDTO | null;
  onClose: () => void;
  onSaved: (service: ServiceDTO) => void;
}) {
  // Keyed remount resets the form whenever a different service opens.
  if (!service) return null;
  return (
    <ServiceEditForm key={service.id} service={service} onClose={onClose} onSaved={onSaved} />
  );
}

function ServiceEditForm({
  service,
  onClose,
  onSaved,
}: {
  service: ServiceDTO;
  onClose: () => void;
  onSaved: (service: ServiceDTO) => void;
}) {
  const [name, setName] = useState(service.name);
  const [excerpt, setExcerpt] = useState(service.excerpt);
  const [heroImage, setHeroImage] = useState(service.heroImage ?? "");
  const [body, setBody] = useState(service.body);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; excerpt?: string; body?: string }>({});

  async function save() {
    const errs: typeof fieldErrors = {};
    if (name.trim().length < 2) errs.name = "Name must be at least 2 characters.";
    if (excerpt.trim().length < 10) errs.excerpt = "Excerpt must be at least 10 characters.";
    if (excerpt.trim().length > 500) errs.excerpt = "Keep the excerpt under 500 characters.";
    if (body.trim().length < 20) errs.body = "Body must be at least 20 characters.";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setError("Fix the highlighted fields and try again.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const result = await apiFetch<{ service: ServiceDTO }>(`/api/admin/services/${service.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          excerpt: excerpt.trim(),
          body,
          heroImage: heroImage.trim() || null,
        }),
      });
      onSaved(result.service);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save the service.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} title={`Edit: ${service.name}`} className="max-w-5xl">
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* Left: form */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="service-name" required>
              Name
            </Label>
            <Input
              id="service-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={fieldErrors.name ? true : undefined}
            />
            <FieldError message={fieldErrors.name} />
          </div>

          <div>
            <Label htmlFor="service-excerpt" required>
              Excerpt
            </Label>
            <Textarea
              id="service-excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              maxLength={500}
              aria-invalid={fieldErrors.excerpt ? true : undefined}
              aria-describedby="service-excerpt-count"
            />
            <p id="service-excerpt-count" className="mt-1 text-xs text-muted dark:text-gray-400">
              {excerpt.length}/500 characters — shown on the division listing page.
            </p>
            <FieldError message={fieldErrors.excerpt} />
          </div>

          <ImageField
            id="service-hero"
            label="Hero image"
            value={heroImage}
            onChange={setHeroImage}
          />

          <div>
            <Label htmlFor="service-body" required>
              Body
            </Label>
            <Textarea
              id="service-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[260px] font-mono text-sm leading-relaxed"
              aria-invalid={fieldErrors.body ? true : undefined}
              aria-describedby="service-body-hint"
            />
            <p id="service-body-hint" className="mt-1 text-xs text-muted dark:text-gray-400">
              {BODY_HELP}
            </p>
            <FieldError message={fieldErrors.body} />
          </div>

          <p className="rounded-xl bg-black/[0.03] px-3 py-2 text-xs text-muted dark:bg-white/[0.06] dark:text-gray-400">
            Slug <code className="font-mono">{service.slug}</code> and division are locked — the
            public URL and site navigation are built from them.
          </p>
        </div>

        {/* Right: live preview */}
        <div className="overflow-hidden rounded-xl border border-line dark:border-night-line">
          <p className="flex items-center gap-2 border-b border-line px-4 py-2.5 text-sm font-semibold text-ink dark:border-night-line dark:text-white">
            <Eye className="size-4 text-muted" aria-hidden />
            Live preview
          </p>
          <div className="max-h-[55vh] overflow-y-auto p-4">
            <h3 className="display text-xl text-ink dark:text-white">
              {name.trim() || service.name}
            </h3>
            <div className="mt-3 dark:[&_h2]:text-white dark:[&_h3]:text-white dark:[&_h4]:text-white dark:[&_li]:text-gray-300 dark:[&_p]:text-gray-300">
              {body.trim() ? (
                <RichBody text={body} />
              ) : (
                <p className="text-sm text-muted dark:text-gray-400">
                  Start typing in the body field to preview the page.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={save} loading={saving}>
          Save changes
        </Button>
      </div>
    </Dialog>
  );
}
