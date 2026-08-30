import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createLead } from "@/lib/leads";
import { requireSession } from "@/lib/auth";
import { serviceRequestApiSchema } from "@/lib/validation";
import { limit, ipFromRequest, tooManyRequests } from "@/lib/rate-limit";

/** Public intake: the service-request wizard posts here. */
export async function POST(req: NextRequest) {
  const ip = ipFromRequest(req);
  if (!limit(`service-requests:${ip}`, 5, 60_000)) return tooManyRequests();

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
    return Response.json({ ok: true, requestId: "received" });
  }

  const parsed = serviceRequestApiSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check the highlighted fields and try again." },
      { status: 400 }
    );
  }
  const d = parsed.data;

  try {
    const lead = await createLead({
      name: `${d.firstName} ${d.lastName}`,
      email: d.email,
      phone: d.phone,
      service: d.serviceType,
      customerType: d.customerType,
      message: d.description || null,
      source: "SERVICE_REQUEST",
      priority: "NORMAL",
      utmSource: d.utmSource,
      utmMedium: d.utmMedium,
      utmCampaign: d.utmCampaign,
      utmTerm: d.utmTerm,
      utmContent: d.utmContent,
      landingPage: d.landingPage,
      referrer: d.referrer,
    });

    const request = await db.serviceRequest.create({
      data: {
        leadId: lead.id,
        customerId: lead.customerId,
        serviceType: d.serviceType,
        customerType: d.customerType,
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email,
        phone: d.phone,
        street: d.street,
        city: d.city,
        zip: d.zip,
        preferredDate: d.preferredDate || null,
        preferredTime: d.preferredTime || null,
        description: d.description || null,
        attachments:
          d.attachments && d.attachments.length > 0 ? JSON.stringify(d.attachments) : null,
      },
    });

    await db.notification.create({
      data: {
        type: "SERVICE_REQUEST",
        title: `Service request: ${d.serviceType}`,
        body: `${d.firstName} ${d.lastName} — ${d.city}, TX ${d.zip}${
          d.preferredDate ? ` — prefers ${d.preferredDate}` : ""
        }`,
        link: `/admin/leads/${lead.id}`,
      },
    });

    return Response.json({ ok: true, requestId: request.id });
  } catch (e) {
    console.error("[service-requests] create failed", e);
    return Response.json(
      { error: "Something went wrong saving your request. Please try again or call us." },
      { status: 500 }
    );
  }
}

/** Admin: list service requests, newest first. Optional ?status= filter. */
export async function GET(req: NextRequest) {
  try {
    await requireSession();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const status = req.nextUrl.searchParams.get("status");
  const requests = await db.serviceRequest.findMany({
    where: status ? { status } : undefined,
    include: { lead: true, customer: true },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({
    requests: requests.map((r) => {
      let attachments: string[] = [];
      if (r.attachments) {
        try {
          const parsed: unknown = JSON.parse(r.attachments);
          if (Array.isArray(parsed)) attachments = parsed.filter((p): p is string => typeof p === "string");
        } catch {
          // corrupted JSON — treat as no attachments
        }
      }
      return { ...r, attachments };
    }),
  });
}
