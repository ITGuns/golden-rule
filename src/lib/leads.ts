import { db } from "./db";

export type UTM = {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  landingPage?: string | null;
  referrer?: string | null;
};

export type NewLead = UTM & {
  name: string;
  email?: string | null;
  phone?: string | null;
  service?: string | null;
  customerType?: string;
  message?: string | null;
  source: string;
  priority?: string;
};

/**
 * Central lead intake: every conversion path (wizard, chat, contact form,
 * estimate, missed call) funnels through here so leads always get an
 * activity trail and an admin notification.
 */
export async function createLead(input: NewLead) {
  const [firstName, ...rest] = input.name.trim().split(/\s+/);
  const lastName = rest.join(" ") || "—";

  // Reuse an existing customer when the email or phone matches.
  let customer = null;
  if (input.email || input.phone) {
    customer = await db.customer.findFirst({
      where: {
        OR: [
          input.email ? { email: input.email } : undefined,
          input.phone ? { phone: input.phone } : undefined,
        ].filter(Boolean) as object[],
      },
    });
  }
  if (!customer) {
    customer = await db.customer.create({
      data: {
        firstName,
        lastName,
        email: input.email || null,
        phone: input.phone || null,
        type: input.customerType || "RESIDENTIAL",
      },
    });
  }

  const lead = await db.lead.create({
    data: {
      customerId: customer.id,
      name: input.name.trim(),
      email: input.email || null,
      phone: input.phone || null,
      service: input.service || null,
      customerType: input.customerType || "RESIDENTIAL",
      message: input.message || null,
      source: input.source,
      priority: input.priority || "NORMAL",
      utmSource: input.utmSource || null,
      utmMedium: input.utmMedium || null,
      utmCampaign: input.utmCampaign || null,
      utmTerm: input.utmTerm || null,
      utmContent: input.utmContent || null,
      landingPage: input.landingPage || null,
      referrer: input.referrer || null,
    },
  });

  await db.leadActivity.create({
    data: {
      leadId: lead.id,
      type: "CREATED",
      description: `Lead created from ${input.source.toLowerCase().replace(/_/g, " ")}`,
    },
  });

  await db.notification.create({
    data: {
      type: "NEW_LEAD",
      title: `New lead: ${lead.name}`,
      body: `${lead.service || "General inquiry"} — ${input.source.replace(/_/g, " ").toLowerCase()}`,
      link: `/admin/leads/${lead.id}`,
    },
  });

  return lead;
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.setting.findUnique({ where: { key } });
  if (!row) return fallback;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

export async function setSetting(key: string, value: unknown) {
  await db.setting.upsert({
    where: { key },
    update: { value: JSON.stringify(value) },
    create: { key, value: JSON.stringify(value) },
  });
}

/**
 * Mock SMS adapter. When a real provider (Twilio etc.) is configured via
 * SMS_API_KEY, replace the body of this function — the call sites won't change.
 */
export async function sendSms(leadId: string | null, to: string, body: string) {
  const configured = Boolean(process.env.SMS_API_KEY);
  if (leadId) {
    await db.message.create({
      data: {
        leadId,
        direction: "OUTBOUND",
        channel: "SMS",
        body,
        status: configured ? "SENT" : "MOCKED",
      },
    });
  }
  if (!configured) {
    console.log(`[sms:mock] to=${to}: ${body}`);
  }
  return { ok: true, mocked: !configured };
}
