import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { sendSms } from "@/lib/leads";

const messageSchema = z.object({
  body: z.string().min(1).max(2000),
  channel: z.enum(["SMS", "EMAIL"]).optional(),
});

/** Admin: send an outbound message (SMS via the mock adapter, EMAIL logged). */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireSession();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Message text is required (max 2000 chars)." }, { status: 400 });
  }
  const channel = parsed.data.channel || "SMS";
  const text = parsed.data.body.trim();

  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) return Response.json({ error: "Lead not found." }, { status: 404 });

  if (channel === "SMS" && !lead.phone) {
    return Response.json({ error: "This lead has no phone number on file." }, { status: 400 });
  }
  if (channel === "EMAIL" && !lead.email) {
    return Response.json({ error: "This lead has no email address on file." }, { status: 400 });
  }

  try {
    let status = "MOCKED";
    if (channel === "SMS" && lead.phone) {
      // leadId null: we create the Message row ourselves so we can return it.
      const result = await sendSms(null, lead.phone, text);
      status = result.mocked ? "MOCKED" : "SENT";
    }

    const message = await db.message.create({
      data: { leadId: id, direction: "OUTBOUND", channel, body: text, status },
    });

    await db.leadActivity.create({
      data: {
        leadId: id,
        type: channel === "SMS" ? "SMS_SENT" : "EMAIL_SENT",
        description:
          channel === "SMS"
            ? `SMS sent to ${lead.phone}`
            : `Email sent to ${lead.email}`,
        meta: JSON.stringify({ messageId: message.id }),
        userId: user.id,
      },
    });

    return Response.json({ ok: true, message }, { status: 201 });
  } catch (e) {
    console.error("[api/leads/:id/messages] send failed", e);
    return Response.json({ error: "Failed to send the message." }, { status: 500 });
  }
}
