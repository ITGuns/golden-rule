"use client";

import { useMemo, useState } from "react";
import { Newspaper, Pencil, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Card, Badge } from "@/components/ui/Card";
import { EmptyState } from "@/components/admin/EmptyState";
import { articleSchema } from "@/lib/validation";
import { formatDate, timeAgo } from "@/lib/utils";
import { ArticleEditor } from "./ArticleEditor";
import { replaceQuery, type ArticleDTO } from "./shared";

const CATEGORIES = articleSchema.shape.category.options;

type EditorState = { mode: "new" } | { mode: "edit"; id: string } | null;

/**
 * Articles workspace: searchable/filterable list of published pieces and
 * drafts, with the two-pane editor swapped in for ?new=1 / ?edit=id.
 */
export function ArticlesManager({
  initialArticles,
  autoNew,
  autoEditId,
}: {
  initialArticles: ArticleDTO[];
  autoNew: boolean;
  autoEditId: string | null;
}) {
  const [articles, setArticles] = useState<ArticleDTO[]>(initialArticles);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [editor, setEditor] = useState<EditorState>(() => {
    if (autoNew) return { mode: "new" };
    if (autoEditId && initialArticles.some((a) => a.id === autoEditId)) {
      return { mode: "edit", id: autoEditId };
    }
    return null;
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      if (category !== "all" && a.category !== category) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q)
      );
    });
  }, [articles, query, category]);

  const publishedCount = articles.filter((a) => a.published).length;
  const draftCount = articles.length - publishedCount;

  function openNew() {
    setEditor({ mode: "new" });
    replaceQuery("new=1");
  }
  function openEdit(id: string) {
    setEditor({ mode: "edit", id });
    replaceQuery(`edit=${id}`);
  }
  function closeEditor() {
    setEditor(null);
    replaceQuery("");
  }

  function handleSaved(article: ArticleDTO) {
    setArticles((prev) => {
      const exists = prev.some((a) => a.id === article.id);
      const next = exists ? prev.map((a) => (a.id === article.id ? article : a)) : [article, ...prev];
      return [...next].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });
    // A freshly created article becomes the edit target so further saves PATCH it.
    setEditor({ mode: "edit", id: article.id });
    replaceQuery(`edit=${article.id}`);
  }

  function handleDeleted(id: string) {
    setArticles((prev) => prev.filter((a) => a.id !== id));
    closeEditor();
  }

  if (editor) {
    const article =
      editor.mode === "edit" ? articles.find((a) => a.id === editor.id) ?? null : null;
    return (
      <ArticleEditor
        key={editor.mode === "edit" ? editor.id : "new"}
        article={article}
        onBack={closeEditor}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Website</p>
          <h1 className="display text-2xl text-ink dark:text-white">Content</h1>
          <p className="mt-1 text-sm text-muted dark:text-gray-400">
            {publishedCount} published · {draftCount} draft{draftCount === 1 ? "" : "s"} — articles
            appear on the public News page.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="size-4" aria-hidden />
          New Article
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, slug or excerpt…"
            aria-label="Search articles"
            className="pl-10"
          />
        </div>
        <div className="sm:w-56">
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* List */}
      {articles.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="No articles yet"
          hint="Write your first article — it will show up on the public News page once published."
          action={
            <Button size="sm" onClick={openNew}>
              <Plus className="size-4" aria-hidden />
              New Article
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No articles match"
          hint="Try a different search term or category."
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted dark:border-night-line dark:text-gray-400">
                <th scope="col" className="px-4 py-3 font-semibold">
                  Article
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Category
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Published
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Updated
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-line last:border-0 hover:bg-black/[0.02] dark:border-night-line dark:hover:bg-white/[0.03]"
                >
                  <td className="max-w-[320px] px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openEdit(a.id)}
                      className="block max-w-full truncate text-left font-semibold text-ink hover:underline dark:text-white"
                    >
                      {a.title}
                    </button>
                    <span className="block truncate font-mono text-xs text-muted dark:text-gray-400">
                      /news/{a.slug}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="gold">{a.category}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={a.published ? "green" : "neutral"}>
                      {a.published ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-body dark:text-gray-300">
                    {a.publishedAt ? formatDate(a.publishedAt) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-body dark:text-gray-300">
                    {timeAgo(a.updatedAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="outline" size="sm" onClick={() => openEdit(a.id)}>
                      <Pencil className="size-3.5" aria-hidden />
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
