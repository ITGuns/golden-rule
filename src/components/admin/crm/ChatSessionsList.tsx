"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn, formatDateTime, timeAgo } from "@/lib/utils";
import { Badge, Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { CrmEmptyState } from "./Bits";
import type { ChatMessageDTO } from "./types";
import { Bot, Loader2, MessageCircle, UserRound } from "lucide-react";

export type ChatSessionListItem = {
  id: string;
  visitorId: string | null;
  leadId: string | null;
  createdAt: string;
  preview: string | null;
  messageCount: number;
};

export function ChatSessionsList({ initialSessions }: { initialSessions: ChatSessionListItem[] }) {
  const [openSession, setOpenSession] = useState<ChatSessionListItem | null>(null);
  const leadCount = initialSessions.filter((s) => s.leadId).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display text-2xl text-ink dark:text-white">Chatbot</h1>
          <p className="text-sm text-muted">
            {initialSessions.length} conversation{initialSessions.length === 1 ? "" : "s"} ·{" "}
            {leadCount} turned into leads
          </p>
        </div>
      </div>

      {initialSessions.length === 0 ? (
        <CrmEmptyState
          icon={<Bot className="size-6" />}
          title="No chat conversations yet"
          hint="Conversations with the website chat assistant will appear here, including any leads it captures."
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted dark:border-night-line">
                <th className="px-4 py-3 font-semibold">Started</th>
                <th className="px-4 py-3 font-semibold">First message</th>
                <th className="px-4 py-3 font-semibold">Messages</th>
                <th className="px-4 py-3 font-semibold">Lead</th>
                <th className="px-4 py-3 font-semibold">
                  <span className="sr-only">View</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {initialSessions.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-line/60 last:border-0 hover:bg-paper dark:border-night-line/60 dark:hover:bg-white/5"
                >
                  <td className="px-4 py-3 text-muted" title={formatDateTime(s.createdAt)}>
                    {timeAgo(s.createdAt)}
                  </td>
                  <td className="max-w-md px-4 py-3">
                    <p className="truncate text-body dark:text-gray-300">
                      {s.preview || <span className="text-muted">No visitor message</span>}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-muted">
                      <MessageCircle className="size-3.5" aria-hidden /> {s.messageCount}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {s.leadId ? (
                      <Link href={`/admin/leads/${s.leadId}`}>
                        <Badge tone="gold">Lead captured</Badge>
                      </Link>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setOpenSession(s)}
                      className="text-xs font-semibold text-ink underline-offset-2 hover:underline dark:text-white"
                    >
                      View transcript
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {openSession && (
        <TranscriptDialog
          key={openSession.id}
          session={openSession}
          onClose={() => setOpenSession(null)}
        />
      )}
    </div>
  );
}

function TranscriptDialog({
  session,
  onClose,
}: {
  session: ChatSessionListItem;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessageDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/chat-sessions?id=${encodeURIComponent(session.id)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { session?: { messages: ChatMessageDTO[] } };
        if (!cancelled) setMessages(data.session?.messages ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this transcript. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [session.id]);

  return (
    <Dialog open onClose={onClose} title="Chat transcript" className="max-w-xl">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>Started {formatDateTime(session.createdAt)}</span>
        {session.leadId && (
          <Link
            href={`/admin/leads/${session.leadId}`}
            className="font-semibold text-ink underline-offset-2 hover:underline dark:text-white"
          >
            View captured lead
          </Link>
        )}
      </div>

      {error ? (
        <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      ) : messages === null ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted" role="status">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Loading transcript…
        </div>
      ) : messages.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">This conversation has no messages.</p>
      ) : (
        <ol className="max-h-[50vh] space-y-3 overflow-y-auto pr-1" aria-label="Chat messages">
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <li key={m.id} className={cn("flex gap-2", isUser && "flex-row-reverse")}>
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full",
                    isUser
                      ? "bg-gold text-ink"
                      : "bg-black/5 text-muted dark:bg-white/10 dark:text-gray-300"
                  )}
                  aria-hidden
                >
                  {isUser ? <UserRound className="size-4" /> : <Bot className="size-4" />}
                </span>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap",
                    isUser
                      ? "rounded-tr-sm bg-gold-soft text-ink dark:bg-gold/20 dark:text-white"
                      : "rounded-tl-sm bg-black/5 text-body dark:bg-white/10 dark:text-gray-200"
                  )}
                >
                  <span className="sr-only">{isUser ? "Visitor: " : "Assistant: "}</span>
                  {m.content}
                  <span className="mt-1 block text-[10px] text-muted">
                    {formatDateTime(m.createdAt)}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Dialog>
  );
}
