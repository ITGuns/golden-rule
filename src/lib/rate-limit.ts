/**
 * Tiny in-memory rate limiter for the public intake API routes.
 * Good enough for a single-node deployment; swap for Redis/Upstash
 * behind the same signature when scaling horizontally.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Drop expired buckets occasionally so the map cannot grow unbounded. */
function prune(now: number) {
  if (buckets.size < 1000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Returns true when the call is allowed, false when the key has exceeded
 * `max` calls within the rolling window of `windowMs` milliseconds.
 *
 *   if (!limit(`contact:${ip}`, 5, 60_000)) return tooManyRequests();
 */
export function limit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  prune(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}

/** Best-effort client IP for rate-limit keys (proxy-aware, never throws). */
export function ipFromRequest(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Standard 429 response shared by the intake routes. */
export function tooManyRequests(): Response {
  return Response.json(
    { error: "Too many requests. Please wait a minute and try again, or call us instead." },
    { status: 429 }
  );
}
