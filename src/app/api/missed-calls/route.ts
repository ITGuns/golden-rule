import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createLead, getSetting, sendSms } from "@/lib/leads";
import { missedCallSchema } from "@/lib/validation";
import { limit, ipFromRequest, tooManyRequests } from "@/lib/rate-limit";

type MissedCallSettings = {
  enabled: boolean;
  message: string;
  businessHoursOnly: boolean;
  followUpMinutes: number;
};

/** Defaults mirror prisma/seed.ts — used when the Setting row is missing. */
const DEFAULT_SETTINGS: MissedCallSettings = {
  enabled: true,
  message:
    "Hi! This is Golden Rule Air Conditioning & Heating. We noticed we missed your call. How can we help?",
  businessHoursOnly: false,
  followUpMinutes: 30,
};

/**
 * Missed-call webhook (phone provider posts here when a call goes unanswered).
 * When the missed-call text-back automation is enabled, this logs the call,
 * opens a HIGH-priority lead, and auto-texts the caller.
 *
 * If MISSED_CALL_WEBHOOK_SECRET is set, callers must send the same value in
 * the x-webhook-secret header.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.MISSED_CALL_WEBHOOK_SECRET;
  if (secret && req.headers.get("x-webhook-secret") !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = ipFromRequest(req);
  if (!limit(`missed-calls:${ip}`, 30, 60_000)) return tooManyRequests();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = missedCallSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Expected { phone, callTime? }." }, { status: 400 });
  }
  const d = parsed.data;
  const callTime = d.callTime ? new Date(d.callTime) : new Date();

  try {
    const settings = await getSetting<MissedCallSettings>("missedCall", DEFAULT_SETTINGS);
    if (!settings.enabled) {
      return Response.json({ ok: true, enabled: false, message: "Missed-call automation is disabled." });
    }

    const created = await db.missedCall.create({
      data: { phone: d.phone, callTime },
    });

    const lead = await createLead({
      name: `Missed call ${d.phone}`,
      phone: d.phone,
      message: `Missed call received at ${callTime.toISOString()}`,
      source: "MISSED_CALL",
      priority: "HIGH",
    });

    const smsBody = settings.message || DEFAULT_SETTINGS.message;
    await sendSms(lead.id, d.phone, smsBody);

    const missedCall = await db.missedCall.update({
      where: { id: created.id },
      data: { leadId: lead.id, status: "TEXTED", smsBody },
    });

    await db.notification.create({
      data: {
        type: "MISSED_CALL",
        title: `Missed call from ${d.phone}`,
        body: "Auto-text sent — caller logged as a high-priority lead.",
        link: `/admin/leads/${lead.id}`,
      },
    });

    return Response.json({ ok: true, missedCall });
  } catch (e) {
    console.error("[missed-calls] webhook failed", e);
    return Response.json({ error: "Failed to process missed call." }, { status: 500 });
  }
}
