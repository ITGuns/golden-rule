import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { careerApiSchema } from "@/lib/validation";
import { limit, ipFromRequest, tooManyRequests } from "@/lib/rate-limit";

/** Public intake: the careers application form posts JSON here. */
export async function POST(req: NextRequest) {
  const ip = ipFromRequest(req);
  if (!limit(`careers:${ip}`, 5, 60_000)) return tooManyRequests();

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

  const parsed = careerApiSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check the highlighted fields and try again." },
      { status: 400 }
    );
  }
  const d = parsed.data;

  try {
    const application = await db.careerApplication.create({
      data: {
        name: d.name,
        email: d.email,
        phone: d.phone,
        position: d.position || null,
        coverLetter: d.coverLetter || null,
        resumePath: d.resumePath || null,
      },
    });

    await db.notification.create({
      data: {
        type: "CAREER",
        title: `Career application: ${d.name}`,
        body: d.position ? `Applying for ${d.position}` : "General application",
        link: "/admin/careers",
      },
    });

    return Response.json({ ok: true, applicationId: application.id });
  } catch (e) {
    console.error("[careers] create failed", e);
    return Response.json(
      { error: "Something went wrong sending your application. Please try again." },
      { status: 500 }
    );
  }
}
