import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit, requireSession } from "@/lib/auth";

const createEstimateSchema = z.object({
  title: z.string().min(2).max(160),
  amount: z.number().nonnegative().optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
});

const patchEstimateSchema = z.object({
  status: z.enum(["SENT", "ACCEPTED", "DECLINED"]),
});

/** Legal estimate status transitions. */
const TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SENT"],
  SENT: ["ACCEPTED", "DECLINED"],
  ACCEPTED: [],
  DECLINED: ["SENT"], // allow re-sending a revised estimate
};

/** Admin: create a draft estimate on a lead. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireSession();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = createEstimateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "An estimate title is required." }, { status: 400 });
  }
  const d = parsed.data;

  const lead = await db.lead.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!lead) return Response.json({ error: "Lead not found." }, { status: 404 });

  try {
    const estimate = await db.estimate.create({
      data: {
        leadId: id,
        title: d.title.trim(),
        amount: d.amount ?? null,
        notes: d.notes?.trim() || null,
        status: "DRAFT",
      },
    });

    await db.leadActivity.create({
      data: {
        leadId: id,
        type: "ESTIMATE",
        description: `Estimate drafted: ${estimate.title}`,
        meta: JSON.stringify({ estimateId: estimate.id, amount: estimate.amount }),
        userId: user.id,
      },
    });

    await audit(user.id, "CREATE", "Estimate", estimate.id, undefined, {
      leadId: id,
      title: estimate.title,
      amount: estimate.amount,
    });

    return Response.json({ ok: true, estimate }, { status: 201 });
  } catch (e) {
    console.error("[api/leads/:id/estimates] create failed", e);
    return Response.json({ error: "Failed to create the estimate." }, { status: 500 });
  }
}

/** Admin: move an estimate through DRAFT → SENT → ACCEPTED/DECLINED. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireSession();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { id } = await params;
  const estimateId = req.nextUrl.searchParams.get("estimateId");
  if (!estimateId) {
    return Response.json({ error: "estimateId query param is required." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = patchEstimateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid estimate status." }, { status: 400 });
  }
  const nextStatus = parsed.data.status;

  const estimate = await db.estimate.findUnique({ where: { id: estimateId } });
  if (!estimate || estimate.leadId !== id) {
    return Response.json({ error: "Estimate not found." }, { status: 404 });
  }

  const allowed = TRANSITIONS[estimate.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    return Response.json(
      { error: `An estimate in ${estimate.status} cannot move to ${nextStatus}.` },
      { status: 400 }
    );
  }

  try {
    const updated = await db.estimate.update({
      where: { id: estimateId },
      data: { status: nextStatus },
    });

    await db.leadActivity.create({
      data: {
        leadId: id,
        type: "ESTIMATE",
        description: `Estimate "${estimate.title}" marked ${nextStatus.toLowerCase()}`,
        meta: JSON.stringify({ estimateId, from: estimate.status, to: nextStatus }),
        userId: user.id,
      },
    });

    await audit(
      user.id,
      "UPDATE",
      "Estimate",
      estimateId,
      { status: estimate.status },
      { status: nextStatus }
    );

    return Response.json({ ok: true, estimate: updated });
  } catch (e) {
    console.error("[api/leads/:id/estimates] update failed", e);
    return Response.json({ error: "Failed to update the estimate." }, { status: 500 });
  }
}
