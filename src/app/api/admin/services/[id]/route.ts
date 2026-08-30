import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireSession, audit, CONTENT_ROLES } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET   /api/admin/services/[id] — one service.
 * PATCH /api/admin/services/[id] — edit name / excerpt / body / heroImage /
 *       published / sortOrder. Slug and division are locked: the public URLs
 *       and navigation are built from them.
 */

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    await requireSession(CONTENT_ROLES);
    const { id } = await params;
    const service = await db.service.findUnique({ where: { id } });
    if (!service) return Response.json({ error: "Service not found." }, { status: 404 });
    return Response.json({ service });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Failed to load the service." }, { status: 500 });
  }
}

const patchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  excerpt: z.string().min(10).max(500).optional(),
  body: z.string().min(20).optional(),
  heroImage: z.string().max(300).nullable().optional(),
  published: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireSession(CONTENT_ROLES);
    const { id } = await params;

    const existing = await db.service.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: "Service not found." }, { status: 404 });

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

    const service = await db.service.update({
      where: { id },
      data: {
        ...(d.name !== undefined ? { name: d.name } : {}),
        ...(d.excerpt !== undefined ? { excerpt: d.excerpt } : {}),
        ...(d.body !== undefined ? { body: d.body } : {}),
        ...(d.heroImage !== undefined ? { heroImage: d.heroImage || null } : {}),
        ...(d.published !== undefined ? { published: d.published } : {}),
        ...(d.sortOrder !== undefined ? { sortOrder: d.sortOrder } : {}),
      },
    });

    const changedKeys = Object.keys(d) as (keyof typeof d)[];
    const oldValue: Record<string, unknown> = {};
    for (const key of changedKeys) oldValue[key] = existing[key];
    await audit(user.id, "update", "Service", service.id, oldValue, d);

    return Response.json({ service });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Failed to update the service." }, { status: 500 });
  }
}
