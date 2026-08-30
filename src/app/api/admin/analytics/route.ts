import type { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { getAnalyticsSummary } from "@/lib/admin-stats";

/**
 * GET /api/admin/analytics?from=&to= — first-party analytics summary:
 * events by type/day, top paths, phone clicks, form starts vs completes,
 * chat starts/leads and lead traffic sources (utmSource grouping).
 */

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const params = req.nextUrl.searchParams;
    const fromRaw = params.get("from");
    const toRaw = params.get("to");

    let to = toRaw ? new Date(toRaw) : new Date();
    if (Number.isNaN(to.getTime())) to = new Date();
    let from = fromRaw
      ? new Date(fromRaw)
      : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (Number.isNaN(from.getTime())) {
      from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    if (from.getTime() > to.getTime()) [from, to] = [to, from];

    const summary = await getAnalyticsSummary(from, to);
    return Response.json(summary);
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
