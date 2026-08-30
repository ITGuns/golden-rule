import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit, requireSession } from "@/lib/auth";

// NOTE: the public intake endpoint lives at /api/service-requests.
// This admin-only route handles triage: listing + status changes.

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["NEW", "REVIEWED", "SCHEDULED", "CLOSED"]),
});

/** Admin: list service requests, newest first. Optional ?status= filter. */
export async function GET(req: NextRequest) {
  try {
    await requireSession();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const status = req.nextUrl.searchParams.get("status");
  try {
    const requests = await db.serviceRequest.findMany({
      where: status ? { status } : undefined,
      include: {
        lead: { select: { id: true, name: true, status: true } },
        customer: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ requests });
  } catch (e) {
    console.error("[api/admin/service-requests] list failed", e);
    return Response.json({ error: "Failed to load service requests." }, { status: 500 });
  }
}

/** Admin: move a service request through NEW → REVIEWED → SCHEDULED → CLOSED. */
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
    return Response.json({ error: "Invalid service-request update." }, { status: 400 });
  }
  const d = parsed.data;

  const existing = await db.serviceRequest.findUnique({ where: { id: d.id } });
  if (!existing) return Response.json({ error: "Service request not found." }, { status: 404 });

  try {
    const request = await db.serviceRequest.update({
      where: { id: d.id },
      data: { status: d.status },
      include: {
        lead: { select: { id: true, name: true, status: true } },
        customer: true,
      },
    });

    if (existing.leadId && d.status !== existing.status) {
      await db.leadActivity.create({
        data: {
          leadId: existing.leadId,
          type: "SYSTEM",
          description: `Service request marked ${d.status.toLowerCase()}`,
          meta: JSON.stringify({ serviceRequestId: d.id }),
          userId: user.id,
        },
      });
    }

    await audit(
      user.id,
      "UPDATE",
      "ServiceRequest",
      d.id,
      { status: existing.status },
      { status: d.status }
    );

    return Response.json({ ok: true, request });
  } catch (e) {
    console.error("[api/admin/service-requests] update failed", e);
    return Response.json({ error: "Failed to update the service request." }, { status: 500 });
  }
}
