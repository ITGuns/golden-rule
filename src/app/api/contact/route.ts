import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createLead } from "@/lib/leads";
import { contactSchema } from "@/lib/validation";
import { limit, ipFromRequest, tooManyRequests } from "@/lib/rate-limit";

/** Public intake: the contact form posts here. */
export async function POST(req: NextRequest) {
  const ip = ipFromRequest(req);
  if (!limit(`contact:${ip}`, 5, 60_000)) return tooManyRequests();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Honeypot tripped — pretend success so bots learn nothing.
  if (
    typeof body === "object" &&
    body !== null &&
    typeof (body as Record<string, unknown>).website === "string" &&
    ((body as Record<string, unknown>).website as string).length > 0
  ) {
    return Response.json({ ok: true });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check the highlighted fields and try again." },
      { status: 400 }
    );
  }
  const d = parsed.data;

  try {
    const submission = await db.contactSubmission.create({
      data: {
        name: d.name,
        email: d.email,
        phone: d.phone || null,
        message: d.message,
      },
    });

    const lead = await createLead({
      name: d.name,
      email: d.email,
      phone: d.phone,
      message: d.message,
      source: "CONTACT_FORM",
      priority: "NORMAL",
      utmSource: d.utmSource,
      utmMedium: d.utmMedium,
      utmCampaign: d.utmCampaign,
      utmTerm: d.utmTerm,
      utmContent: d.utmContent,
      landingPage: d.landingPage,
      referrer: d.referrer,
    });

    await db.notification.create({
      data: {
        type: "CONTACT",
        title: `Contact form: ${d.name}`,
        body: d.message.length > 140 ? `${d.message.slice(0, 140)}…` : d.message,
        link: `/admin/leads/${lead.id}`,
      },
    });

    return Response.json({ ok: true, submissionId: submission.id });
  } catch (e) {
    console.error("[contact] create failed", e);
    return Response.json(
      { error: "Something went wrong sending your message. Please try again or call us." },
      { status: 500 }
    );
  }
}
