import { getSession, destroySession, audit } from "@/lib/auth";

/** POST /api/auth/logout — clears the session cookie. */
export async function POST() {
  const user = await getSession();
  await destroySession();
  if (user) {
    await audit(user.id, "LOGOUT", "User", user.id);
  }
  return Response.json({ ok: true });
}
