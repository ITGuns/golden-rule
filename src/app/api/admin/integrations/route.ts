import { requireSession, ADMIN_ROLES } from "@/lib/auth";

/**
 * GET /api/admin/integrations — configured-or-not booleans for the optional
 * provider keys. Only presence is reported; values never leave the server.
 */
export async function GET() {
  try {
    await requireSession(ADMIN_ROLES);
    return Response.json({
      ai: Boolean(process.env.AI_API_KEY),
      sms: Boolean(process.env.SMS_API_KEY),
      email: Boolean(process.env.EMAIL_API_KEY),
      maps: Boolean(process.env.MAPS_API_KEY),
      analytics: Boolean(process.env.ANALYTICS_ID),
      authSecret: Boolean(process.env.AUTH_SECRET),
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Failed to load integration status." }, { status: 500 });
  }
}
