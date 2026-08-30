import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

/**
 * Admin: chatbot sessions, newest first, each with a first-user-message
 * preview and a message count. Pass ?id= to fetch one full transcript.
 */
export async function GET(req: NextRequest) {
  try {
    await requireSession();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const id = req.nextUrl.searchParams.get("id");

  try {
    if (id) {
      const session = await db.chatSession.findUnique({
        where: { id },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
      if (!session) return Response.json({ error: "Chat session not found." }, { status: 404 });
      return Response.json({ session });
    }

    const sessions = await db.chatSession.findMany({
      include: { messages: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return Response.json({
      sessions: sessions.map((s) => {
        const firstUser = s.messages.find((m) => m.role === "user");
        return {
          id: s.id,
          visitorId: s.visitorId,
          leadId: s.leadId,
          createdAt: s.createdAt,
          preview: firstUser ? firstUser.content.slice(0, 160) : null,
          messageCount: s.messages.length,
        };
      }),
    });
  } catch (e) {
    console.error("[api/admin/chat-sessions] list failed", e);
    return Response.json({ error: "Failed to load chat sessions." }, { status: 500 });
  }
}
