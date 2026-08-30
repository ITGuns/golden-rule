import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit, requireSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";

const patchSchema = z.object({
  status: z
    .enum(["REQUESTED", "CONFIRMED", "RESCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"])
    .optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  technicianId: z.string().optional().nullable(),
  location: z.string().max(240).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

const INCLUDE = {
  customer: true,
  technician: { select: { id: true, name: true, role: true, title: true } },
  lead: { select: { id: true, name: true, status: true } },
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

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid appointment update." }, { status: 400 });
  }
  const d = parsed.data;

  const existing = await db.appointment.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: "Appointment not found." }, { status: 404 });

  const data: {
    status?: string;
    start?: Date;
    end?: Date;
    technicianId?: string | null;
    location?: string | null;
    notes?: string | null;
  } = {};

  if (d.start !== undefined) {
    const start = new Date(d.start);
    if (Number.isNaN(start.getTime())) {
      return Response.json({ error: "Invalid start date/time." }, { status: 400 });
    }
    data.start = start;
  }
  if (d.end !== undefined) {
    const end = new Date(d.end);
    if (Number.isNaN(end.getTime())) {
      return Response.json({ error: "Invalid end date/time." }, { status: 400 });
    }
    data.end = end;
  }
  // Keep the window coherent: if only start moved, slide end to preserve duration.
  if (data.start && !data.end) {
    const duration = existing.end.getTime() - existing.start.getTime();
    data.end = new Date(data.start.getTime() + Math.max(duration, 30 * 60 * 1000));
  }
  if (d.status !== undefined && d.status !== existing.status) data.status = d.status;
  if (d.technicianId !== undefined && d.technicianId !== existing.technicianId)
    data.technicianId = d.technicianId;
  if (d.location !== undefined) data.location = d.location;
  if (d.notes !== undefined) data.notes = d.notes;

  const timeChanged =
    (data.start && data.start.getTime() !== existing.start.getTime()) ||
    (data.end && data.end.getTime() !== existing.end.getTime());
  // A moved time without an explicit status becomes a reschedule.
  if (timeChanged && data.status === undefined && existing.status !== "RESCHEDULED") {
    data.status = "RESCHEDULED";
  }

  if (Object.keys(data).length === 0) {
    const unchanged = await db.appointment.findUniqueOrThrow({ where: { id }, include: INCLUDE });
    return Response.json({ ok: true, appointment: unchanged });
  }

  try {
    const appointment = await db.appointment.update({ where: { id }, data, include: INCLUDE });

    if (existing.leadId) {
      if (timeChanged) {
        await db.leadActivity.create({
          data: {
            leadId: existing.leadId,
            type: "APPOINTMENT",
            description: `Appointment rescheduled to ${formatDateTime(appointment.start)}`,
            meta: JSON.stringify({
              appointmentId: id,
              from: existing.start.toISOString(),
              to: appointment.start.toISOString(),
            }),
            userId: user.id,
          },
        });
      } else if (data.status) {
        await db.leadActivity.create({
          data: {
            leadId: existing.leadId,
            type: "APPOINTMENT",
            description: `Appointment marked ${data.status.toLowerCase().replace(/_/g, " ")}`,
            meta: JSON.stringify({ appointmentId: id, from: existing.status, to: data.status }),
            userId: user.id,
          },
        });
      }

      // Completing the visit moves the lead forward in the pipeline; the
      // review request itself is triggered manually from the lead detail.
      if (data.status === "COMPLETED") {
        const lead = await db.lead.findUnique({ where: { id: existing.leadId } });
        if (lead && !["COMPLETED", "REVIEW_REQUESTED", "CLOSED"].includes(lead.status)) {
          await db.lead.update({ where: { id: lead.id }, data: { status: "COMPLETED" } });
          await db.leadActivity.create({
            data: {
              leadId: lead.id,
              type: "STATUS_CHANGE",
              description: `Status changed from ${lead.status} to COMPLETED (appointment completed)`,
              meta: JSON.stringify({ from: lead.status, to: "COMPLETED", appointmentId: id }),
              userId: user.id,
            },
          });
        }
      }
    }

    await audit(
      user.id,
      "UPDATE",
      "Appointment",
      id,
      {
        status: existing.status,
        start: existing.start.toISOString(),
        end: existing.end.toISOString(),
        technicianId: existing.technicianId,
      },
      {
        status: appointment.status,
        start: appointment.start.toISOString(),
        end: appointment.end.toISOString(),
        technicianId: appointment.technicianId,
      }
    );

    return Response.json({ ok: true, appointment });
  } catch (e) {
    console.error("[api/appointments/:id] update failed", e);
    return Response.json({ error: "Failed to update the appointment." }, { status: 500 });
  }
}
