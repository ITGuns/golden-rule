"use client";
/* eslint-disable @next/next/no-img-element -- admin preview of arbitrary library images */

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ExternalLink, Eye, EyeOff, Globe, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/Field";
import { Card, Badge } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { RichBody } from "@/components/content/RichBody";
import { articleSchema } from "@/lib/validation";
import { readTimeMinutes } from "@/lib/utils";
import { apiFetch, slugify, type ArticleDTO } from "./shared";
import { ImageField } from "./MediaPicker";

const CATEGORIES = articleSchema.shape.category.options;

const BODY_HELP =
  "Plain text with light formatting: ## Heading and ### Subheading, **bold**, *italic*, " +
  "- bulleted lists, 1. numbered lists, --- for a divider. Separate paragraphs with a blank line.";

type FieldErrors = Partial<Record<"slug" | "title" | "excerpt" | "body" | "category", string>>;

/**
 * Two-pane article editor: form on the left, live RichBody preview on the
 * right — exactly what /news/[slug] will render.
 */
export function ArticleEditor({
  article,
  onBack,
  onSaved,
  onDeleted,
}: {
  /** null = creating a new article. */
  article: ArticleDTO | null;
  onBack: () => void;
  onSaved: (article: ArticleDTO) => void;
  onDeleted: (id: string) => void;
}) {
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [title, setTitle] = useState(article?.title ?? "");
  const [category, setCategory] = useState(article?.category ?? CATEGORIES[0]);
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [heroImage, setHeroImage] = useState(article?.heroImage ?? "");
  const [body, setBody] = useState(article?.body ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(article));

  const [saving, setSaving] = useState<null | "save" | "toggle" | "delete">(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [savedFlash, setSavedFlash] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-sync the form when switching to a different article.
  const articleId = article?.id ?? null;
  useEffect(() => {
    if (!article) return;
    setSlug(article.slug);
    setTitle(article.title);
    setCategory(article.category);
    setExcerpt(article.excerpt);
    setHeroImage(article.heroImage ?? "");
    setBody(article.body);
    setSlugTouched(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  const isPublished = article?.published ?? false;
  const slugLocked = Boolean(article?.publishedAt);

  function handleTitleChange(next: string) {
    setTitle(next);
    if (!article && !slugTouched) setSlug(slugify(next));
  }

  function flashSaved() {
    setSavedFlash(true);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setSavedFlash(false), 2500);
  }

  async function save(published: boolean, kind: "save" | "toggle") {
    setError(null);
    const payload = {
      slug,
      title: title.trim(),
      excerpt: excerpt.trim(),
      body,
      category,
      heroImage: heroImage.trim() || null,
      published,
    };
    const parsed = articleSchema.safeParse(payload);
    if (!parsed.success) {
      const errs: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (key && !errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      setError("Fix the highlighted fields and try again.");
      return;
    }
    setFieldErrors({});
    setSaving(kind);
    try {
      const result = article
        ? await apiFetch<{ article: ArticleDTO }>(`/api/admin/articles/${article.id}`, {
            method: "PATCH",
            body: JSON.stringify(parsed.data),
          })
        : await apiFetch<{ article: ArticleDTO }>("/api/admin/articles", {
            method: "POST",
            body: JSON.stringify(parsed.data),
          });
      onSaved(result.article);
      flashSaved();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong.";
      setError(message);
      if (/slug/i.test(message)) setFieldErrors({ slug: message });
    } finally {
      setSaving(null);
    }
  }

  async function remove() {
    if (!article) return;
    setSaving("delete");
    setError(null);
    try {
      await apiFetch<{ ok: true }>(`/api/admin/articles/${article.id}`, { method: "DELETE" });
      setConfirmDelete(false);
      onDeleted(article.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete the article.");
      setConfirmDelete(false);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="size-4" aria-hidden />
            All articles
          </Button>
          <Badge tone={isPublished ? "green" : "neutral"}>
            {isPublished ? "Published" : "Draft"}
          </Badge>
          {savedFlash && (
            <span className="text-sm font-medium text-success" role="status">
              Saved
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {article && isPublished && (
            <a
              href={`/news/${article.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-ink hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
            >
              <ExternalLink className="size-4" aria-hidden />
              View live
            </a>
          )}
          {article && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              disabled={saving !== null}
            >
              <Trash2 className="size-4" aria-hidden />
              Delete
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            loading={saving === "toggle"}
            disabled={saving !== null && saving !== "toggle"}
            onClick={() => save(!isPublished, "toggle")}
          >
            {isPublished ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Globe className="size-4" aria-hidden />
            )}
            {isPublished ? "Unpublish" : "Publish"}
          </Button>
          <Button
            size="sm"
            loading={saving === "save"}
            disabled={saving !== null && saving !== "save"}
            onClick={() => save(isPublished, "save")}
          >
            <Save className="size-4" aria-hidden />
            {isPublished ? "Save changes" : "Save draft"}
          </Button>
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

      <div className="grid items-start gap-6 xl:grid-cols-2">
        {/* Left: form */}
        <Card className="space-y-5 p-6">
          <div>
            <Label htmlFor="article-title" required>
              Title
            </Label>
            <Input
              id="article-title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. How to prep your AC for a Houston summer"
              aria-invalid={fieldErrors.title ? true : undefined}
              aria-describedby={fieldErrors.title ? "article-title-error" : undefined}
            />
            <FieldError id="article-title-error" message={fieldErrors.title} />
          </div>

          <div>
            <Label htmlFor="article-slug" required>
              Slug
            </Label>
            <Input
              id="article-slug"
              value={slug}
              disabled={slugLocked}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              placeholder="auto-generated-from-title"
              aria-invalid={fieldErrors.slug ? true : undefined}
              aria-describedby={`article-slug-hint${fieldErrors.slug ? " article-slug-error" : ""}`}
              className="font-mono text-sm"
            />
            <p id="article-slug-hint" className="mt-1 text-xs text-muted dark:text-gray-400">
              {slugLocked
                ? "Locked after publishing so the public URL stays stable."
                : `Public URL: /news/${slug || "your-slug"}`}
            </p>
            <FieldError id="article-slug-error" message={fieldErrors.slug} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="article-category" required>
                Category
              </Label>
              <Select
                id="article-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              <FieldError message={fieldErrors.category} />
            </div>
            <ImageField
              id="article-hero"
              label="Hero image"
              value={heroImage}
              onChange={setHeroImage}
            />
          </div>

          <div>
            <Label htmlFor="article-excerpt" required>
              Excerpt
            </Label>
            <Textarea
              id="article-excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="One or two sentences shown on the news listing and in search results."
              aria-invalid={fieldErrors.excerpt ? true : undefined}
              aria-describedby={`article-excerpt-count${fieldErrors.excerpt ? " article-excerpt-error" : ""}`}
            />
            <p id="article-excerpt-count" className="mt-1 text-xs text-muted dark:text-gray-400">
              {excerpt.length}/500 characters
            </p>
            <FieldError id="article-excerpt-error" message={fieldErrors.excerpt} />
          </div>

          <div>
            <Label htmlFor="article-body" required>
              Body
            </Label>
            <Textarea
              id="article-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[340px] font-mono text-sm leading-relaxed"
              placeholder={"## A heading\n\nA paragraph with **bold** and *italic* text.\n\n- A bullet point\n1. A numbered step"}
              aria-invalid={fieldErrors.body ? true : undefined}
              aria-describedby={`article-body-hint${fieldErrors.body ? " article-body-error" : ""}`}
            />
            <p id="article-body-hint" className="mt-1 text-xs text-muted dark:text-gray-400">
              {BODY_HELP}
            </p>
            <FieldError id="article-body-error" message={fieldErrors.body} />
          </div>
        </Card>

        {/* Right: live preview */}
        <Card className="self-start overflow-hidden xl:sticky xl:top-6">
          <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-3 dark:border-night-line">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink dark:text-white">
              <Eye className="size-4 text-muted" aria-hidden />
              Live preview
            </p>
            {body.trim() && (
              <p className="text-xs text-muted dark:text-gray-400">
                {readTimeMinutes(body)} min read
              </p>
            )}
          </div>
          <div className="max-h-[70vh] overflow-y-auto p-6">
            <Badge tone="gold">{category}</Badge>
            <h2 className="display mt-3 text-2xl text-ink dark:text-white">
              {title.trim() || "Untitled article"}
            </h2>
            {excerpt.trim() && (
              <p className="mt-2 text-[15px] font-medium text-muted dark:text-gray-400">
                {excerpt}
              </p>
            )}
            {heroImage.trim() && (
              <img
                src={heroImage}
                alt=""
                className="mt-4 aspect-video w-full rounded-xl object-cover"
              />
            )}
            <div className="mt-5 dark:[&_h2]:text-white dark:[&_h3]:text-white dark:[&_h4]:text-white dark:[&_li]:text-gray-300 dark:[&_p]:text-gray-300">
              {body.trim() ? (
                <RichBody text={body} />
              ) : (
                <p className="text-sm text-muted dark:text-gray-400">
                  Start typing in the body field to see the article exactly as readers will.
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Delete confirmation */}
      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this article?"
      >
        <p className="text-sm text-body dark:text-gray-300">
          &ldquo;{article?.title}&rdquo; will be permanently removed
          {isPublished ? " and its public page will stop working" : ""}. This can&rsquo;t be
          undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={saving === "delete"}>
            Cancel
          </Button>
          <Button variant="danger" onClick={remove} loading={saving === "delete"}>
            Delete article
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
