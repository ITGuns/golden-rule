import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { audit, requireSession } from "@/lib/auth";
import { appointmentSchema } from "@/lib/validation";
import { formatDateTime } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

const INCLUDE = {
  customer: true,
  technician: { select: { id: true, name: true, role: true, title: true } },
  lead: { select: { id: true, name: true, status: true } },
};

/** Admin: list appointments whose start falls within ?from&to. */
export async function GET(req: NextRequest) {
  try {
    await requireSession();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const sp = req.nextUrl.searchParams;
  const where: Prisma.AppointmentWhereInput = {};
  const from = sp.get("from");
  const to = sp.get("to");
  if (from || to) {
    where.start = {};
    if (from) {
      const d = new Date(from);
      if (!Number.isNaN(d.getTime())) where.start.gte = d;
    }
    if (to) {
      const d = new Date(to);
      if (!Number.isNaN(d.getTime())) where.start.lte = d;
    }
  }
  const technicianId = sp.get("technicianId");
  if (technicianId) where.technicianId = technicianId;

  try {
    const appointments = await db.appointment.findMany({
      where,
      include: INCLUDE,
      orderBy: { start: "asc" },
    });
    return Response.json({ appointments });
  } catch (e) {
    console.error("[api/appointments] list failed", e);
    return Response.json({ error: "Failed to load appointments." }, { status: 500 });
  }
}

/** Admin: schedule an appointment (end defaults to start + 2 hours). */
export async function POST(req: NextRequest) {
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

  const parsed = appointmentSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Please check the appointment fields." }, { status: 400 });
  }
  const d = parsed.data;

  const start = new Date(d.start);
  if (Number.isNaN(start.getTime())) {
    return Response.json({ error: "Invalid start date/time." }, { status: 400 });
  }
  let end = d.end ? new Date(d.end) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
  if (Number.isNaN(end.getTime()) || end <= start) {
    end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  }

  try {
    const appointment = await db.appointment.create({
      data: {
        leadId: d.leadId || null,
        customerId: d.customerId || null,
        technicianId: d.technicianId || null,
        service: d.service,
        start,
        end,
        status: d.status || "REQUESTED",
        location: d.location || null,
        notes: d.notes || null,
      },
      include: INCLUDE,
    });

    if (d.leadId) {
      await db.leadActivity.create({
        data: {
          leadId: d.leadId,
          type: "APPOINTMENT",
          description: `Appointment scheduled for ${formatDateTime(start)} — ${d.service}`,
          meta: JSON.stringify({ appointmentId: appointment.id }),
          userId: user.id,
        },
      });
    }

    const who =
      appointment.customer?.firstName || appointment.lead?.name || "Customer";
    await db.notification.create({
      data: {
        type: "APPOINTMENT",
        title: `Appointment scheduled: ${d.service}`,
        body: `${who} — ${formatDateTime(start)}`,
        link: d.leadId ? `/admin/leads/${d.leadId}` : "/admin/appointments",
      },
    });

    await audit(user.id, "CREATE", "Appointment", appointment.id, undefined, {
      service: d.service,
      start: start.toISOString(),
      end: end.toISOString(),
      leadId: d.leadId || null,
      technicianId: d.technicianId || null,
    });

    return Response.json({ ok: true, appointment }, { status: 201 });
  } catch (e) {
    console.error("[api/appointments] create failed", e);
    return Response.json({ error: "Failed to schedule the appointment." }, { status: 500 });
  }
}
