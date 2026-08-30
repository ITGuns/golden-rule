import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit, requireSession } from "@/lib/auth";

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["NEW", "TEXTED", "RESPONDED", "RESOLVED"]),
  note: z.string().max(2000).optional().nullable(),
});

/** Admin: missed-call log, newest call first. */
export async function GET(req: NextRequest) {
  try {
    await requireSession();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const status = req.nextUrl.searchParams.get("status");
  try {
    const calls = await db.missedCall.findMany({
      where: status ? { status } : undefined,
      include: { lead: { select: { id: true, name: true, status: true } } },
      orderBy: { callTime: "desc" },
    });
    return Response.json({ calls });
  } catch (e) {
    console.error("[api/admin/missed-calls] list failed", e);
    return Response.json({ error: "Failed to load missed calls." }, { status: 500 });
  }
}

/** Admin: update a missed call's status (+ optional note onto the linked lead). */
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
    return Response.json({ error: "Invalid missed-call update." }, { status: 400 });
  }
  const d = parsed.data;

  const existing = await db.missedCall.findUnique({ where: { id: d.id } });
  if (!existing) return Response.json({ error: "Missed call not found." }, { status: 404 });

  try {
    const respondedAt =
      ["RESPONDED", "RESOLVED"].includes(d.status) && !existing.respondedAt
        ? new Date()
        : existing.respondedAt;

    const call = await db.missedCall.update({
      where: { id: d.id },
      data: { status: d.status, respondedAt },
      include: { lead: { select: { id: true, name: true, status: true } } },
    });

    const note = d.note?.trim();
    if (note && existing.leadId) {
      await db.leadActivity.create({
        data: {
          leadId: existing.leadId,
          type: "CALL",
          description: `Missed call follow-up (${existing.phone}): ${note}`,
          meta: JSON.stringify({ missedCallId: existing.id }),
          userId: user.id,
        },
      });
    }

    await audit(
      user.id,
      "UPDATE",
      "MissedCall",
      d.id,
      { status: existing.status },
      { status: d.status, note: note || undefined }
    );

    return Response.json({ ok: true, call });
  } catch (e) {
    console.error("[api/admin/missed-calls] update failed", e);
    return Response.json({ error: "Failed to update the missed call." }, { status: 500 });
  }
}
