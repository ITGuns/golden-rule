import type { NextRequest } from "next/server";
import { requireSession, audit, CONTENT_ROLES } from "@/lib/auth";
import { db } from "@/lib/db";
import { articleSchema } from "@/lib/validation";

/**
 * GET    /api/admin/articles/[id] — one article.
 * PATCH  /api/admin/articles/[id] — partial update (slug locked once published;
 *        publishedAt stamped the first time the article goes live).
 * DELETE /api/admin/articles/[id] — permanent delete.
 */

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    await requireSession(CONTENT_ROLES);
    const { id } = await params;
    const article = await db.article.findUnique({ where: { id } });
    if (!article) return Response.json({ error: "Article not found." }, { status: 404 });
    return Response.json({ article });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Failed to load the article." }, { status: 500 });
  }
}

const patchSchema = articleSchema.partial();

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireSession(CONTENT_ROLES);
    const { id } = await params;

    const existing = await db.article.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: "Article not found." }, { status: 404 });

    let body: unknown = null;
    try {
      body = await req.json();
    } catch {
      // handled by schema below
    }
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return Response.json(
        { error: issue ? `${issue.path.join(".") || "body"}: ${issue.message}` : "Invalid update." },
        { status: 400 }
      );
    }
    const d = parsed.data;
    if (Object.keys(d).length === 0) {
      return Response.json({ error: "Nothing to update." }, { status: 400 });
    }

    if (d.slug && d.slug !== existing.slug) {
      if (existing.publishedAt) {
        return Response.json(
          { error: "The slug is locked once an article has been published." },
          { status: 400 }
        );
      }
      const clash = await db.article.findUnique({ where: { slug: d.slug } });
      if (clash) {
        return Response.json(
          { error: "An article with this slug already exists — pick a different slug." },
          { status: 409 }
        );
      }
    }

    const article = await db.article.update({
      where: { id },
      data: {
        ...(d.slug !== undefined ? { slug: d.slug } : {}),
        ...(d.title !== undefined ? { title: d.title } : {}),
        ...(d.excerpt !== undefined ? { excerpt: d.excerpt } : {}),
        ...(d.body !== undefined ? { body: d.body } : {}),
        ...(d.category !== undefined ? { category: d.category } : {}),
        ...(d.heroImage !== undefined ? { heroImage: d.heroImage || null } : {}),
        ...(d.published !== undefined ? { published: d.published } : {}),
        // First time this article goes live: stamp the publish date.
        ...(d.published === true && !existing.publishedAt ? { publishedAt: new Date() } : {}),
      },
    });

    const changedKeys = Object.keys(d) as (keyof typeof d)[];
    const oldValue: Record<string, unknown> = {};
    for (const key of changedKeys) oldValue[key] = existing[key];
    await audit(user.id, "update", "Article", article.id, oldValue, d);

    return Response.json({ article });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Failed to update the article." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireSession(CONTENT_ROLES);
    const { id } = await params;

    const existing = await db.article.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: "Article not found." }, { status: 404 });

    await db.article.delete({ where: { id } });
    await audit(user.id, "delete", "Article", id, {
      slug: existing.slug,
      title: existing.title,
      published: existing.published,
    });

    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Failed to delete the article." }, { status: 500 });
  }
}
