import { db } from "@/lib/db";
import {
  ChatSessionsList,
  type ChatSessionListItem,
} from "@/components/admin/crm/ChatSessionsList";

export const metadata = { title: "Chatbot" };
export const dynamic = "force-dynamic";

export default async function ChatbotPage() {
  const sessions = await db.chatSession.findMany({
    include: { messages: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const items: ChatSessionListItem[] = sessions.map((s) => {
    const firstUser = s.messages.find((m) => m.role === "user");
    return {
      id: s.id,
      visitorId: s.visitorId,
      leadId: s.leadId,
      createdAt: s.createdAt.toISOString(),
      preview: firstUser ? firstUser.content.slice(0, 160) : null,
      messageCount: s.messages.length,
    };
  });

  return <ChatSessionsList initialSessions={items} />;
}
