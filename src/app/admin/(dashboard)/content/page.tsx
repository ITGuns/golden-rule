import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CONTENT_ROLES } from "@/lib/auth";
import { requirePageSession, AccessDenied } from "@/components/admin/cms/guard";
import { ArticlesManager } from "@/components/admin/cms/ArticlesManager";
import type { ArticleDTO } from "@/components/admin/cms/shared";

export const metadata: Metadata = {
  title: "Content",
  alternates: { canonical: "/admin/content" },
};

export const dynamic = "force-dynamic";

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePageSession(CONTENT_ROLES);
  if (!user) return <AccessDenied roles={CONTENT_ROLES} />;

  const sp = await searchParams;
  const autoNew = sp?.new === "1";
  const autoEditId = typeof sp?.edit === "string" ? sp.edit : null;

  const articles = await db.article.findMany({ orderBy: { updatedAt: "desc" } });
  const items: ArticleDTO[] = articles.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    body: a.body,
    category: a.category,
    heroImage: a.heroImage,
    published: a.published,
    publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  return <ArticlesManager initialArticles={items} autoNew={autoNew} autoEditId={autoEditId} />;
}
