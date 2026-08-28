import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "./db";

const COOKIE = "gr_session";
const secret = () =>
  new TextEncoder().encode(
    process.env.AUTH_SECRET || "dev-only-secret-change-me-in-production"
  );

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export const ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "DISPATCHER",
  "TECHNICIAN",
  "MARKETING",
  "CONTENT_EDITOR",
] as const;

/** Roles allowed to modify settings/users. */
export const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];
/** Roles allowed to edit content. */
export const CONTENT_ROLES = ["SUPER_ADMIN", "ADMIN", "MARKETING", "CONTENT_EDITOR"];

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret());
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

/** For API routes: returns the session user or throws a 401 Response. */
export async function requireSession(roles?: string[]): Promise<SessionUser> {
  const user = await getSession();
  if (!user) throw Response.json({ error: "Unauthorized" }, { status: 401 });
  if (roles && !roles.includes(user.role))
    throw Response.json({ error: "Forbidden" }, { status: 403 });
  return user;
}

export async function verifyLogin(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.active) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function audit(
  userId: string | null,
  action: string,
  entity: string,
  entityId?: string,
  oldValue?: unknown,
  newValue?: unknown
) {
  await db.auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      oldValue: oldValue === undefined ? null : JSON.stringify(oldValue),
      newValue: newValue === undefined ? null : JSON.stringify(newValue),
    },
  });
}
