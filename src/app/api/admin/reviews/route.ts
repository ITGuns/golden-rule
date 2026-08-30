import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit, requireSession } from "@/lib/auth";

const patchSchema = z.object({
  id: z.string().min(1),
  published: z.boolean().optional(),
  response: z.string().max(4000).optional().nullable(),
});

/** Admin: reviews + review-request pipeline stats. */
export async function GET() {
  try {
    await requireSession();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  try {
    const [reviews, reviewRequests, requested, sent, completed] = await Promise.all([
      db.review.findMany({ orderBy: { createdAt: "desc" } }),
      db.reviewRequest.findMany({
        include: { lead: { select: { id: true, name: true, phone: true } } },
        orderBy: { createdAt: "desc" },
      }),
      db.reviewRequest.count(),
      // "sent" = anything that left PENDING (completed/declined requests were sent too)
      db.reviewRequest.count({ where: { status: { not: "PENDING" } } }),
      db.reviewRequest.count({ where: { status: "COMPLETED" } }),
    ]);

    return Response.json({
      reviews,
      reviewRequests,
      stats: {
        requested,
        sent,
        completed,
        responseRate: sent > 0 ? completed / sent : 0,
      },
    });
  } catch (e) {
    console.error("[api/admin/reviews] list failed", e);
    return Response.json({ error: "Failed to load reviews." }, { status: 500 });
  }
}

/** Admin: publish/unpublish a review or record an owner response. */
export async function PATCH(req: NextRequest) {
  let user;
  try {
    user = await requireSession();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid review update." }, { status: 400 });
  }
  const d = parsed.data;

  const existing = await db.review.findUnique({ where: { id: d.id } });
  if (!existing) return Response.json({ error: "Review not found." }, { status: 404 });

  const data: { published?: boolean; response?: string | null } = {};
  if (d.published !== undefined) data.published = d.published;
  if (d.response !== undefined) data.response = d.response?.trim() || null;

  if (Object.keys(data).length === 0) {
    return Response.json({ ok: true, review: existing });
  }

  try {
    const review = await db.review.update({ where: { id: d.id }, data });
    await audit(
      user.id,
      "UPDATE",
      "Review",
      d.id,
      { published: existing.published, response: existing.response },
      data
    );
    return Response.json({ ok: true, review });
  } catch (e) {
    console.error("[api/admin/reviews] update failed", e);
    return Response.json({ error: "Failed to update the review." }, { status: 500 });
  }
}
