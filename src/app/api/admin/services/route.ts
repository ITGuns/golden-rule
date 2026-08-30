import { requireSession, CONTENT_ROLES } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/admin/services — every service (all divisions, published and hidden),
 * ordered the way the public pages list them.
 */
export async function GET() {
  try {
    await requireSession(CONTENT_ROLES);
    const items = await db.service.findMany({
      orderBy: [{ division: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    });
    return Response.json({ items });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Failed to load services." }, { status: 500 });
  }
}
