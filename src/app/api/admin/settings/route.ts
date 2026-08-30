import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireSession, audit, ADMIN_ROLES } from "@/lib/auth";
import { db } from "@/lib/db";
import { setSetting } from "@/lib/leads";

/**
 * GET /api/admin/settings — every Setting row, JSON-parsed into { key: value }.
 * PUT /api/admin/settings — { key, value } for a whitelisted key; the value is
 * shape-validated per key before being persisted, and old/new are audited.
 */

const companySchema = z.object({
  name: z.string().max(160),
  phone: z.string().max(40),
  email: z.string().max(160),
  street: z.string().max(160),
  city: z.string().max(80),
  state: z.string().max(40),
  zip: z.string().max(20),
  license: z.string().max(80),
  hours: z.string().max(200),
  emergencyService: z.boolean(),
});

const missedCallSchema = z.object({
  enabled: z.boolean(),
  message: z.string().min(1).max(320, "Keep the text-back under 320 characters."),
  businessHoursOnly: z.boolean(),
  followUpMinutes: z.number().int().min(0).max(1440),
});

const reviewsSchema = z.object({
  enabled: z.boolean(),
  delayHours: z.number().int().min(0).max(720),
  channel: z.enum(["SMS", "EMAIL"]),
  message: z.string().min(1).max(500, "Keep the request message under 500 characters."),
  destination: z
    .string()
    .max(300)
    .refine((v) => v === "" || /^https?:\/\/\S+$/.test(v), {
      message: "Must be a full URL (https://…) or left empty.",
    }),
});

const chatbotSchema = z.object({
  enabled: z.boolean(),
  name: z.string().min(1).max(60),
});

const SETTING_SCHEMAS = {
  company: companySchema,
  missedCall: missedCallSchema,
  reviews: reviewsSchema,
  chatbot: chatbotSchema,
} as const;

type SettingKey = keyof typeof SETTING_SCHEMAS;

function isSettingKey(key: unknown): key is SettingKey {
  return typeof key === "string" && key in SETTING_SCHEMAS;
}

export async function GET() {
  try {
    await requireSession(ADMIN_ROLES);
    const rows = await db.setting.findMany();
    const settings: Record<string, unknown> = {};
    for (const row of rows) {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = null;
      }
    }
    return Response.json({ settings });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Failed to load settings." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireSession(ADMIN_ROLES);

    let body: { key?: unknown; value?: unknown } | null = null;
    try {
      body = (await req.json()) as { key?: unknown; value?: unknown };
    } catch {
      // handled below
    }
    if (!body || !isSettingKey(body.key)) {
      return Response.json(
        { error: "Expected { key, value } with key one of: company, missedCall, reviews, chatbot." },
        { status: 400 }
      );
    }
    const key = body.key;

    const parsed = SETTING_SCHEMAS[key].safeParse(body.value);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return Response.json(
        { error: issue ? `${issue.path.join(".") || key}: ${issue.message}` : "Invalid value." },
        { status: 400 }
      );
    }

    const existing = await db.setting.findUnique({ where: { key } });
    let oldValue: unknown = null;
    if (existing) {
      try {
        oldValue = JSON.parse(existing.value);
      } catch {
        oldValue = existing.value;
      }
    }

    await setSetting(key, parsed.data);
    await audit(user.id, "update", "Setting", key, oldValue, parsed.data);

    return Response.json({ ok: true, key, value: parsed.data });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Failed to save the setting." }, { status: 500 });
  }
}
