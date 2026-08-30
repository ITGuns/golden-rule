import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { createLead } from "@/lib/leads";
import { chatMessageSchema } from "@/lib/validation";
import { COMPANY } from "@/lib/site";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are the "Golden Rule Comfort Assistant" — the friendly HVAC assistant for Golden Rule Air Conditioning & Heating, a full-service air conditioning and heating mechanical contractor in Houston, Texas (founded 2007, Texas License TACLA27294C, phone 281-500-7874, address 9306 Thomasville Dr., Houston, TX 77064).

Service area: Houston, Cypress, Spring, Tomball, Katy, and Sugar Land, TX.
Divisions: Residential, Commercial, and New Construction.
Residential services: air conditioning, air ducts, duct sealing, ductless systems, gas furnaces, heat pumps, indoor air quality, maintenance, zone control systems, energy efficiency consultations.
Commercial services: air balancing, chilled water systems, cooling, heating, kitchen equipment, maintenance, refrigeration.
Programs: GoldStandard™ planned maintenance (test, inspect, monitor, clean, adjust), DARE™ installation process, Gold Plated Guarantees (Best Price, Critical Component, 100% Money Back Satisfaction, Polite Installers, 24-Hour Hotel), financing through Wells Fargo, referral program.

Your job:
- Answer general HVAC questions and explain HVAC terminology accurately and simply.
- Explain our services, maintenance program, and indoor air quality.
- Help visitors figure out which service fits their situation.
- Encourage scheduling: point people to the Request Service page (/request-service) or the phone line 281-500-7874.
- When a visitor is ready to be contacted, collect their name, phone, and what they need, then call the capture_lead tool.

Strict rules:
- NEVER diagnose potentially dangerous equipment problems with certainty (gas smells, carbon monoxide concerns, electrical burning smells, sparking). For anything urgent or safety-related, tell them to stop using the equipment if appropriate and contact Golden Rule directly at 281-500-7874 right away ("Talk to a Comfort Specialist").
- Never invent prices, warranties, availability, discounts, or business claims. If you don't know, say so and offer the phone number.
- Never claim a technician is dispatched or an appointment is booked — only the office confirms appointments.
- Keep answers short (2-5 sentences), warm, and practical.`;

const captureLead = {
  name: "capture_lead",
  description:
    "Save the visitor as a lead for the Golden Rule office to follow up with. Use only after the visitor has shared their name and phone number (email optional) and what they need.",
  input_schema: {
    type: "object" as const,
    properties: {
      name: { type: "string", description: "Visitor's full name" },
      phone: { type: "string", description: "Visitor's phone number" },
      email: { type: "string", description: "Visitor's email, if given" },
      service: {
        type: "string",
        description:
          "What they need, e.g. AC Repair, Heating, Maintenance, Indoor Air Quality, Commercial, New Construction, Other",
      },
      summary: { type: "string", description: "One-sentence summary of the request" },
    },
    required: ["name", "phone", "service"],
    additionalProperties: false,
  },
};

/** Keyword fallback when no AI key is configured — still useful, never fabricates. */
function ruleBasedReply(message: string): string {
  const m = message.toLowerCase();
  if (/(gas|smell|carbon|monoxide|burning|smoke|spark)/.test(m))
    return `That could be a safety issue — please stop using the equipment and talk to a Comfort Specialist right away at ${COMPANY.phone}. If you suspect a gas leak or carbon monoxide, leave the building first.`;
  if (/(emergency|urgent|asap|right now)/.test(m))
    return `For urgent problems, the fastest path is calling us directly at ${COMPANY.phone} (281-500-RUSH) — emergency service is available. You can also submit a request at /request-service and mark it urgent.`;
  if (/(price|cost|how much|quote|estimate)/.test(m))
    return `Pricing depends on your system and situation, so I can't quote a number here — but you can request a free estimate at /request-estimate or call ${COMPANY.phone}. We also offer financing through Wells Fargo and a Best Price Guarantee on DARE™ installations.`;
  if (/(maintenance|tune.?up|checkup|goldstandard)/.test(m))
    return `Our GoldStandard™ planned maintenance program covers testing, inspecting, monitoring, cleaning, and adjusting your system — like an oil change for your HVAC. Members save up to 15% on repairs and get priority service. See /maintenance or request a visit at /request-service.`;
  if (/(air quality|iaq|allerg|dust|filter)/.test(m))
    return `Indoor air quality matters — filters, filtration systems, and duct sealing all help with dust and allergens. We offer IAQ assessments and solutions; read more at /residential/indoor-air-quality or request a visit at /request-service.`;
  if (/(area|serve|location|where|houston|cypress|spring|tomball|katy|sugar)/.test(m))
    return `We serve the Greater Houston area: Houston, Cypress, Spring, Tomball, Katy, and Sugar Land, TX. If you're nearby, reach out anyway — call ${COMPANY.phone} and we'll see how we can help.`;
  if (/(heat pump|furnace|heating|cold|warm air)/.test(m))
    return `We service, repair, and install furnaces and heat pumps across Greater Houston. If your heating isn't keeping up, a technician can diagnose it properly — request a visit at /request-service or call ${COMPANY.phone}.`;
  if (/(ac|a\/c|air condition|cool|hot air|not cooling)/.test(m))
    return `Sounds like an air conditioning issue — common causes range from filters to refrigerant to electrical components, and a technician can pin it down safely. Request service at /request-service or call ${COMPANY.phone}. `;
  if (/(hour|open|when)/.test(m))
    return `The fastest way to reach us is ${COMPANY.phone} — emergency service is available. You can also request service online any time at /request-service.`;
  return `Thanks for reaching out! I can help with questions about air conditioning, heating, maintenance, indoor air quality, or our services. For anything specific to your system, the experts are at ${COMPANY.phone} — or use the "Leave your info" button and we'll contact you.`;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = chatMessageSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid message" }, { status: 400 });
  }
  const { sessionId, message } = parsed.data;

  // load or create the session
  const existing = sessionId
    ? await db.chatSession.findUnique({
        where: { id: sessionId },
        include: { messages: { orderBy: { createdAt: "asc" }, take: 30 } },
      })
    : null;
  let session: { id: string; messages: { role: string; content: string }[] };
  if (existing) {
    session = existing;
  } else {
    const created = await db.chatSession.create({ data: {} });
    session = { id: created.id, messages: [] };
  }

  await db.chatMessage.create({
    data: { sessionId: session.id, role: "user", content: message },
  });

  const apiKey = process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY;
  let reply: string;
  let leadCaptured = false;

  if (apiKey) {
    try {
      const client = new Anthropic({ apiKey });
      const history: Anthropic.MessageParam[] = [
        ...session.messages.map((m) => ({
          role: m.role === "user" ? ("user" as const) : ("assistant" as const),
          content: m.content,
        })),
        { role: "user", content: message },
      ];

      let response = await client.messages.create({
        model: "claude-opus-5",
        max_tokens: 1024,
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        tools: [captureLead],
        messages: history,
      });

      // handle a single capture_lead round-trip
      if (response.stop_reason === "tool_use") {
        const toolUse = response.content.find(
          (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
        );
        if (toolUse && toolUse.name === "capture_lead") {
          const input = toolUse.input as {
            name: string;
            phone: string;
            email?: string;
            service: string;
            summary?: string;
          };
          const lead = await createLead({
            name: input.name,
            phone: input.phone,
            email: input.email || null,
            service: input.service,
            message: input.summary || `Captured by chat assistant`,
            source: "CHATBOT",
          });
          await db.chatSession.update({
            where: { id: session.id },
            data: { leadId: lead.id },
          });
          leadCaptured = true;
          response = await client.messages.create({
            model: "claude-opus-5",
            max_tokens: 512,
            system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
            tools: [captureLead],
            messages: [
              ...history,
              { role: "assistant", content: response.content },
              {
                role: "user",
                content: [
                  {
                    type: "tool_result",
                    tool_use_id: toolUse.id,
                    content:
                      "Lead saved. The Golden Rule office will follow up. Confirm this warmly to the visitor and remind them they can call 281-500-7874 for anything urgent.",
                  },
                ],
              },
            ],
          });
        }
      }

      reply =
        response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim() || ruleBasedReply(message);
    } catch (err) {
      console.error("chat AI error:", err);
      reply = ruleBasedReply(message);
    }
  } else {
    reply = ruleBasedReply(message);
  }

  await db.chatMessage.create({
    data: { sessionId: session.id, role: "assistant", content: reply },
  });

  return Response.json({ sessionId: session.id, reply, leadCaptured });
}
