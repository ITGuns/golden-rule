import type { NextRequest } from "next/server";
import { z } from "zod";
import { verifyLogin, createSession, audit } from "@/lib/auth";

/**
 * POST /api/auth/login — { email, password }
 * Rate-limited to 5 attempts per minute per IP (tiny in-memory limiter —
 * intentionally local to this route).
 */

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  // Opportunistic cleanup so the map never grows unbounded.
  if (attempts.size > 500) {
    for (const [key, stamps] of attempts) {
      if (stamps.every((t) => now - t >= WINDOW_MS)) attempts.delete(key);
    }
  }
  const recent = (attempts.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  attempts.set(ip, recent);
  return recent.length > MAX_ATTEMPTS;
}

const loginSchema = z.object({
  email: z.string().email().max(160),
  password: z.string().min(1).max(200),
});

const GENERIC_ERROR = "Invalid email or password.";

export async function POST(req: NextRequest) {
  const ip =
    (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "local";
  if (isRateLimited(ip)) {
    return Response.json(
      { error: "Too many login attempts. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    // fall through — treated as invalid credentials below
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const user = await verifyLogin(parsed.data.email, parsed.data.password);
  if (!user) {
    return Response.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  await createSession(user);
  await audit(user.id, "LOGIN", "User", user.id);
  return Response.json({ user });
}
