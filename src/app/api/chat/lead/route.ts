import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createLead } from "@/lib/leads";
import { utmSchema } from "@/lib/validation";

const schema = z
  .object({
    sessionId: z.string().max(60).optional().nullable(),
    name: z.string().min(2).max(120),
    phone: z.string().min(7).max(25),
    email: z.string().email().max(160).optional().or(z.literal("")),
    service: z.string().min(2).max(120),
    website: z.string().max(0).optional(), // honeypot
  })
  .merge(utmSchema);

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Please check your name and phone number." }, { status: 400 });
  }
  const d = parsed.data;

  const lead = await createLead({
    name: d.name,
    phone: d.phone,
    email: d.email || null,
    service: d.service,
    message: "Contact info left via chat assistant",
    source: "CHATBOT",
    utmSource: d.utmSource,
    utmMedium: d.utmMedium,
    utmCampaign: d.utmCampaign,
    utmTerm: d.utmTerm,
    utmContent: d.utmContent,
    landingPage: d.landingPage,
    referrer: d.referrer,
  });

  if (d.sessionId) {
    await db.chatSession
      .update({ where: { id: d.sessionId }, data: { leadId: lead.id } })
      .catch(() => {});
  }

  return Response.json({ ok: true });
}
