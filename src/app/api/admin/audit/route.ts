import type { NextRequest } from "next/server";
import { requireSession, ADMIN_ROLES } from "@/lib/auth";
import { db } from "@/lib/db";

/** GET /api/admin/audit?page=&entity= — paginated audit log (admins only). */

const PAGE_SIZE = 25;

export async function GET(req: NextRequest) {
  try {
    await requireSession(ADMIN_ROLES);
    const params = req.nextUrl.searchParams;
    const pageRaw = Number.parseInt(params.get("page") || "1", 10);
    const page = Number.isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;
    const entity = (params.get("entity") || "").trim();

    const where = entity ? { entity } : {};
    const [rows, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      db.auditLog.count({ where }),
    ]);

    return Response.json({
      rows,
      total,
      page,
      pageSize: PAGE_SIZE,
      pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Failed to load audit log" }, { status: 500 });
  }
}
