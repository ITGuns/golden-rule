import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

/** Admin: lightweight active-user list for assignee/technician selects. */
export async function GET() {
  try {
    await requireSession();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  try {
    const users = await db.user.findMany({
      where: { active: true },
      select: { id: true, name: true, role: true, title: true },
      orderBy: { name: "asc" },
    });
    return Response.json({ users });
  } catch (e) {
    console.error("[api/admin/team-lite] list failed", e);
    return Response.json({ error: "Failed to load team members." }, { status: 500 });
  }
}
