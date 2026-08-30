import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { analyticsEventSchema } from "@/lib/validation";
import { limit, ipFromRequest } from "@/lib/rate-limit";

const MAX_META_BYTES = 2048; // 2KB cap on serialized meta

function noContent() {
  return new Response(null, { status: 204 });
}

/**
 * First-party analytics beacon (see src/lib/analytics-client.ts).
 * Always returns 204 — analytics must never break a page. Bodies may arrive
 * as application/json or text/plain (navigator.sendBeacon), so we read text
 * and parse manually.
 */
export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    if (!raw || raw.length > 10_000) return noContent();

    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return noContent();
    }

    const parsed = analyticsEventSchema.safeParse(body);
    if (!parsed.success) return noContent();
    const { type, path, sessionId, meta } = parsed.data;

    // Silently drop floods rather than erroring.
    const ip = ipFromRequest(req);
    if (!limit(`analytics:${ip}`, 120, 60_000)) return noContent();

    let metaStr: string | null = null;
    if (meta && Object.keys(meta).length > 0) {
      const serialized = JSON.stringify(meta);
      if (serialized.length <= MAX_META_BYTES) metaStr = serialized;
    }

    await db.analyticsEvent.create({
      data: {
        type,
        path: path ? path.slice(0, 300) : null,
        sessionId: sessionId || null,
        meta: metaStr,
      },
    });
  } catch {
    // Swallow everything — a failed analytics write must never surface.
  }
  return noContent();
}
