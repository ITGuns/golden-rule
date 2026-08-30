import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createLead } from "@/lib/leads";
import { estimateRequestSchema } from "@/lib/validation";
import { limit, ipFromRequest, tooManyRequests } from "@/lib/rate-limit";

/** Public intake: the estimate-request form posts here. */
export async function POST(req: NextRequest) {
  const ip = ipFromRequest(req);
  if (!limit(`estimate:${ip}`, 5, 60_000)) return tooManyRequests();

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

  const parsed = estimateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check the highlighted fields and try again." },
      { status: 400 }
    );
  }
  const d = parsed.data;

  try {
    const lead = await createLead({
      name: d.name,
      email: d.email,
      phone: d.phone,
      service: d.service,
      customerType: d.customerType,
      message: d.details || null,
      source: "ESTIMATE_REQUEST",
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
        type: "ESTIMATE_REQUEST",
        title: `Estimate request: ${d.service}`,
        body: `${d.name} — ${d.customerType.replace(/_/g, " ").toLowerCase()}`,
        link: `/admin/leads/${lead.id}`,
      },
    });

    return Response.json({ ok: true });
  } catch (e) {
    console.error("[estimate] create failed", e);
    return Response.json(
      { error: "Something went wrong saving your request. Please try again or call us." },
      { status: 500 }
    );
  }
}
