import type { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

/**
 * GET /api/admin/search?q= — global admin search across leads, customers,
 * appointments, articles, services and reviews. Grouped results with hrefs.
 */

type SearchItem = { id: string; label: string; href: string };

const EMPTY = {
  leads: [] as SearchItem[],
  customers: [] as SearchItem[],
  appointments: [] as SearchItem[],
  articles: [] as SearchItem[],
  services: [] as SearchItem[],
  reviews: [] as SearchItem[],
};

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const q = (req.nextUrl.searchParams.get("q") || "").trim();
    if (q.length < 2) return Response.json(EMPTY);

    const [leads, customers, appointments, articles, services, reviews] = await Promise.all([
      db.lead.findMany({
        where: {
          OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }],
        },
        select: { id: true, name: true, service: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.customer.findMany({
        where: {
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { email: { contains: q } },
            { phone: { contains: q } },
          ],
        },
        select: { id: true, firstName: true, lastName: true, city: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.appointment.findMany({
        where: { service: { contains: q } },
        select: { id: true, service: true, start: true },
        orderBy: { start: "desc" },
        take: 5,
      }),
      db.article.findMany({
        where: { title: { contains: q } },
        select: { id: true, title: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.service.findMany({
        where: { name: { contains: q } },
        select: { id: true, name: true, division: true },
        orderBy: { sortOrder: "asc" },
        take: 5,
      }),
      db.review.findMany({
        where: { OR: [{ title: { contains: q } }, { customerName: { contains: q } }] },
        select: { id: true, title: true, customerName: true, rating: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    return Response.json({
      leads: leads.map((l) => ({
        id: l.id,
        label: l.service ? `${l.name} — ${l.service}` : l.name,
        href: `/admin/leads/${l.id}`,
      })),
      customers: customers.map((c) => ({
        id: c.id,
        label: c.city ? `${c.firstName} ${c.lastName} — ${c.city}` : `${c.firstName} ${c.lastName}`,
        href: `/admin/customers?focus=${c.id}`,
      })),
      appointments: appointments.map((a) => ({
        id: a.id,
        label: `${a.service} — ${formatDateTime(a.start)}`,
        href: "/admin/appointments",
      })),
      articles: articles.map((a) => ({
        id: a.id,
        label: a.title,
        href: `/admin/content?edit=${a.id}`,
      })),
      services: services.map((s) => ({
        id: s.id,
        label: `${s.name} — ${s.division.replace(/_/g, " ").toLowerCase()}`,
        href: "/admin/services",
      })),
      reviews: reviews.map((r) => ({
        id: r.id,
        label: `${r.customerName}${r.title ? ` — ${r.title}` : ""} (${r.rating}★)`,
        href: "/admin/reviews",
      })),
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
