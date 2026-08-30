import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { audit, requireSession } from "@/lib/auth";
import { getSetting, sendSms } from "@/lib/leads";
import { leadPatchSchema } from "@/lib/validation";
import { COMPANY } from "@/lib/site";

const FULL_INCLUDE = {
  customer: true,
  assignedTo: { select: { id: true, name: true, role: true, title: true } },
  activities: {
    include: { user: { select: { id: true, name: true, role: true, title: true } } },
    orderBy: { createdAt: "desc" as const },
  },
  appointments: {
    include: { technician: { select: { id: true, name: true, role: true, title: true } } },
    orderBy: { start: "desc" as const },
  },
  estimates: { orderBy: { createdAt: "desc" as const } },
  messages: { orderBy: { createdAt: "asc" as const } },
  reviewRequests: { orderBy: { createdAt: "desc" as const } },
  serviceRequests: { orderBy: { createdAt: "desc" as const } },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { id } = await params;
  const lead = await db.lead.findUnique({ where: { id }, include: FULL_INCLUDE });
  if (!lead) return Response.json({ error: "Lead not found." }, { status: 404 });
  return Response.json({ lead });
}

type ReviewsSetting = { channel: "SMS" | "EMAIL"; message: string };

const DEFAULT_REVIEWS_SETTING: ReviewsSetting = {
  channel: "SMS",
  message: `Hi {name}, thank you for choosing ${COMPANY.shortName}. Would you take a moment to leave us a quick review about your experience? It helps our team a lot.`,
};

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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = leadPatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid lead update." }, { status: 400 });
  }
  const d = parsed.data;

  const existing = await db.lead.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: "Lead not found." }, { status: 404 });

  try {
    const data: {
      status?: string;
      priority?: string;
      assignedToId?: string | null;
      value?: number | null;
    } = {};
    if (d.status !== undefined && d.status !== existing.status) data.status = d.status;
    if (d.priority !== undefined && d.priority !== existing.priority) data.priority = d.priority;
    if (d.assignedToId !== undefined && d.assignedToId !== existing.assignedToId)
      data.assignedToId = d.assignedToId;
    if (d.value !== undefined && d.value !== existing.value) data.value = d.value;

    if (Object.keys(data).length > 0) {
      await db.lead.update({ where: { id }, data });
    }

    // Status change: activity trail + (maybe) the review-request flow.
    if (data.status) {
      await db.leadActivity.create({
        data: {
          leadId: id,
          type: "STATUS_CHANGE",
          description: `Status changed from ${existing.status} to ${data.status}`,
          meta: JSON.stringify({ from: existing.status, to: data.status }),
          userId: user.id,
        },
      });

      if (data.status === "REVIEW_REQUESTED") {
        const settings = await getSetting<ReviewsSetting>("reviews", DEFAULT_REVIEWS_SETTING);
        const channel = settings.channel === "EMAIL" ? "EMAIL" : "SMS";
        const message = (settings.message || DEFAULT_REVIEWS_SETTING.message).replace(
          /\{name\}/g,
          existing.name.split(/\s+/)[0] || existing.name
        );

        const canSend = channel === "SMS" && Boolean(existing.phone);
        const request = await db.reviewRequest.create({
          data: {
            leadId: id,
            channel,
            status: canSend ? "SENT" : "PENDING",
            sentAt: canSend ? new Date() : null,
          },
        });
        if (canSend && existing.phone) {
          await sendSms(id, existing.phone, message);
        }
        await db.leadActivity.create({
          data: {
            leadId: id,
            type: "REVIEW_REQUEST",
            description: canSend
              ? `Review request sent by ${channel} to ${existing.phone}`
              : `Review request created (${channel}) — pending send`,
            meta: JSON.stringify({ reviewRequestId: request.id, channel }),
            userId: user.id,
          },
        });
      }
    }

    // Assignment change: system activity naming the assignee.
    if (data.assignedToId !== undefined) {
      let description = "Lead unassigned";
      if (data.assignedToId) {
        const assignee = await db.user.findUnique({
          where: { id: data.assignedToId },
          select: { name: true },
        });
        description = `Assigned to ${assignee?.name ?? "team member"}`;
      }
      await db.leadActivity.create({
        data: { leadId: id, type: "SYSTEM", description, userId: user.id },
      });
    }

    // Freeform note from the detail view.
    if (d.note && d.note.trim().length > 0) {
      await db.leadActivity.create({
        data: { leadId: id, type: "NOTE", description: d.note.trim(), userId: user.id },
      });
    }

    if (Object.keys(data).length > 0) {
      await audit(
        user.id,
        "UPDATE",
        "Lead",
        id,
        {
          status: existing.status,
          priority: existing.priority,
          assignedToId: existing.assignedToId,
          value: existing.value,
        },
        data
      );
    }

    const lead = await db.lead.findUniqueOrThrow({ where: { id }, include: FULL_INCLUDE });
    return Response.json({ ok: true, lead });
  } catch (e) {
    console.error("[api/leads/:id] update failed", e);
    return Response.json({ error: "Failed to update the lead." }, { status: 500 });
  }
}
