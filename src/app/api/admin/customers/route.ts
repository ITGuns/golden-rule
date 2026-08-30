import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit, requireSession } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

const patchSchema = z.object({
  id: z.string().min(1),
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  email: z.string().email().max(160).optional().nullable().or(z.literal("")),
  phone: z.string().max(25).optional().nullable(),
  street: z.string().max(160).optional().nullable(),
  city: z.string().max(80).optional().nullable(),
  state: z.string().max(30).optional().nullable(),
  zip: z.string().max(10).optional().nullable(),
  type: z.enum(["RESIDENTIAL", "COMMERCIAL", "NEW_CONSTRUCTION"]).optional(),
  notes: z.string().max(4000).optional().nullable(),
});

/** Admin: search customers with lead/appointment counts + recent records. */
export async function GET(req: NextRequest) {
  try {
    await requireSession();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const take = Math.min(200, Math.max(1, Number(sp.get("take")) || 100));

  const where: Prisma.CustomerWhereInput | undefined = q
    ? {
        OR: [
          { firstName: { contains: q } },
          { lastName: { contains: q } },
          { email: { contains: q } },
          { phone: { contains: q } },
          { city: { contains: q } },
        ],
      }
    : undefined;

  try {
    const [customers, total] = await Promise.all([
      db.customer.findMany({
        where,
        include: {
          _count: { select: { leads: true, appointments: true } },
          leads: {
            select: { id: true, name: true, status: true, service: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          appointments: {
            select: { id: true, service: true, start: true, status: true },
            orderBy: { start: "desc" },
            take: 5,
          },
        },
        orderBy: { createdAt: "desc" },
        take,
      }),
      db.customer.count({ where }),
    ]);
    return Response.json({ customers, total });
  } catch (e) {
    console.error("[api/admin/customers] list failed", e);
    return Response.json({ error: "Failed to load customers." }, { status: 500 });
  }
}

/** Admin: update a customer's basic fields. */
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
    return Response.json({ error: "Invalid customer update." }, { status: 400 });
  }
  const { id, ...fields } = parsed.data;

  const existing = await db.customer.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: "Customer not found." }, { status: 404 });

  const data: Prisma.CustomerUpdateInput = {};
  if (fields.firstName !== undefined) data.firstName = fields.firstName;
  if (fields.lastName !== undefined) data.lastName = fields.lastName;
  if (fields.email !== undefined) data.email = fields.email || null;
  if (fields.phone !== undefined) data.phone = fields.phone || null;
  if (fields.street !== undefined) data.street = fields.street || null;
  if (fields.city !== undefined) data.city = fields.city || null;
  if (fields.state !== undefined) data.state = fields.state || null;
  if (fields.zip !== undefined) data.zip = fields.zip || null;
  if (fields.type !== undefined) data.type = fields.type;
  if (fields.notes !== undefined) data.notes = fields.notes || null;

  if (Object.keys(data).length === 0) {
    return Response.json({ ok: true, customer: existing });
  }

  try {
    const customer = await db.customer.update({ where: { id }, data });
    await audit(
      user.id,
      "UPDATE",
      "Customer",
      id,
      {
        firstName: existing.firstName,
        lastName: existing.lastName,
        email: existing.email,
        phone: existing.phone,
        street: existing.street,
        city: existing.city,
        zip: existing.zip,
        type: existing.type,
      },
      data
    );
    return Response.json({ ok: true, customer });
  } catch (e) {
    console.error("[api/admin/customers] update failed", e);
    return Response.json({ error: "Failed to update the customer." }, { status: 500 });
  }
}
