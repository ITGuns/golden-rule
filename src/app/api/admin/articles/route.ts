import type { NextRequest } from "next/server";
import { requireSession, audit, CONTENT_ROLES } from "@/lib/auth";
import { db } from "@/lib/db";
import { articleSchema } from "@/lib/validation";

/**
 * GET  /api/admin/articles — every article, drafts included (newest edits first).
 * POST /api/admin/articles — create an article (publishedAt stamped when created published).
 */

export async function GET() {
  try {
    await requireSession(CONTENT_ROLES);
    const items = await db.article.findMany({ orderBy: { updatedAt: "desc" } });
    return Response.json({ items });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Failed to load articles." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession(CONTENT_ROLES);

    let body: unknown = null;
    try {
      body = await req.json();
    } catch {
      // handled by schema below
    }
    const parsed = articleSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return Response.json(
        { error: issue ? `${issue.path.join(".") || "body"}: ${issue.message}` : "Invalid article." },
        { status: 400 }
      );
    }
    const d = parsed.data;

    const existing = await db.article.findUnique({ where: { slug: d.slug } });
    if (existing) {
      return Response.json(
        { error: "An article with this slug already exists — pick a different slug." },
        { status: 409 }
      );
    }

    const published = d.published ?? false;
    const article = await db.article.create({
      data: {
        slug: d.slug,
        title: d.title,
        excerpt: d.excerpt,
        body: d.body,
        category: d.category,
        heroImage: d.heroImage || null,
        published,
        publishedAt: published ? new Date() : null,
      },
    });

    await audit(user.id, "create", "Article", article.id, undefined, {
      slug: article.slug,
      title: article.title,
      category: article.category,
      published: article.published,
    });

    return Response.json({ article }, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Failed to create the article." }, { status: 500 });
  }
}
