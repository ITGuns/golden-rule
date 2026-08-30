import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/admin/notifications — latest 20 notifications + unread count.
 * PATCH /api/admin/notifications — { ids?: string[], all?: true } mark read.
 */

export async function GET() {
  try {
    await requireSession();
    const [items, unread] = await Promise.all([
      db.notification.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
      db.notification.count({ where: { read: false } }),
    ]);
    return Response.json({ items, unread });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Failed to load notifications" }, { status: 500 });
  }
}

const patchSchema = z.object({
  ids: z.array(z.string().max(60)).max(100).optional(),
  all: z.literal(true).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    await requireSession();
    let body: unknown = null;
    try {
      body = await req.json();
    } catch {
      // handled by schema below
    }
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }
    const { ids, all } = parsed.data;
    if (all) {
      await db.notification.updateMany({ where: { read: false }, data: { read: true } });
    } else if (ids && ids.length > 0) {
      await db.notification.updateMany({ where: { id: { in: ids } }, data: { read: true } });
    } else {
      return Response.json({ error: "Provide ids or all: true" }, { status: 400 });
    }
    const unread = await db.notification.count({ where: { read: false } });
    return Response.json({ ok: true, unread });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
