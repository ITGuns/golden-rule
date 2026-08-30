import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit, requireSession } from "@/lib/auth";
import { createLead } from "@/lib/leads";
import type { Prisma } from "@prisma/client";

const manualLeadSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(160).optional().nullable().or(z.literal("")),
  phone: z.string().max(25).optional().nullable(),
  service: z.string().max(120).optional().nullable(),
  customerType: z.enum(["RESIDENTIAL", "COMMERCIAL", "NEW_CONSTRUCTION"]).optional(),
  message: z.string().max(4000).optional().nullable(),
  source: z
    .enum([
      "WEBSITE",
      "CHATBOT",
      "PHONE",
      "MISSED_CALL",
      "CONTACT_FORM",
      "SERVICE_REQUEST",
      "ESTIMATE_REQUEST",
      "FINANCING",
      "REFERRAL",
      "ORGANIC",
      "PAID",
      "SOCIAL",
      "OTHER",
    ])
    .optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "EMERGENCY"]).optional(),
  value: z.number().nonnegative().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
});

/** Admin: list leads with filters + pagination, newest first. */
export async function GET(req: NextRequest) {
  try {
    await requireSession();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const take = Math.min(200, Math.max(1, Number(sp.get("take")) || 50));

  const where: Prisma.LeadWhereInput = {};
  const status = sp.get("status");
  const source = sp.get("source");
  const service = sp.get("service");
  const assignedToId = sp.get("assignedToId");
  const q = sp.get("q");
  const from = sp.get("from");
  const to = sp.get("to");

  if (status) where.status = status;
  if (source) where.source = source;
  if (service) where.service = service;
  if (assignedToId) where.assignedToId = assignedToId === "unassigned" ? null : assignedToId;
  if (q) {
    where.OR = [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }];
  }
  if (from || to) {
    where.createdAt = {};
    if (from) {
      const d = new Date(from);
      if (!Number.isNaN(d.getTime())) where.createdAt.gte = d;
    }
    if (to) {
      const d = new Date(to);
      if (!Number.isNaN(d.getTime())) where.createdAt.lte = d;
    }
  }

  try {
    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        include: {
          customer: true,
          assignedTo: { select: { id: true, name: true, role: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * take,
        take,
      }),
      db.lead.count({ where }),
    ]);
    return Response.json({ leads, total, page, take });
  } catch (e) {
    console.error("[api/leads] list failed", e);
    return Response.json({ error: "Failed to load leads." }, { status: 500 });
  }
}

/** Admin: create a lead manually (walk-in, phone call, referral...). */
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

  const parsed = manualLeadSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Please check the lead fields and try again." }, { status: 400 });
  }
  const d = parsed.data;

  try {
    const lead = await createLead({
      name: d.name,
      email: d.email || null,
      phone: d.phone || null,
      service: d.service || null,
      customerType: d.customerType || "RESIDENTIAL",
      message: d.message || null,
      source: d.source || "PHONE",
      priority: d.priority || "NORMAL",
    });

    // createLead handles the core record; layer on the admin-only extras.
    const extras: Prisma.LeadUpdateInput = {};
    if (d.value !== undefined && d.value !== null) extras.value = d.value;
    if (d.assignedToId) extras.assignedTo = { connect: { id: d.assignedToId } };
    const finalLead =
      Object.keys(extras).length > 0
        ? await db.lead.update({
            where: { id: lead.id },
            data: extras,
            include: {
              customer: true,
              assignedTo: { select: { id: true, name: true, role: true, title: true } },
            },
          })
        : await db.lead.findUniqueOrThrow({
            where: { id: lead.id },
            include: {
              customer: true,
              assignedTo: { select: { id: true, name: true, role: true, title: true } },
            },
          });

    await audit(user.id, "CREATE", "Lead", lead.id, undefined, {
      name: d.name,
      source: d.source || "PHONE",
      service: d.service || null,
      priority: d.priority || "NORMAL",
    });

    return Response.json({ ok: true, lead: finalLead }, { status: 201 });
  } catch (e) {
    console.error("[api/leads] create failed", e);
    return Response.json({ error: "Failed to create the lead." }, { status: 500 });
  }
}
