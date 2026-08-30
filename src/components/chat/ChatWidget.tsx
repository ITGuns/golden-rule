"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, X, PhoneCall, UserRound } from "lucide-react";
import { COMPANY } from "@/lib/site";
import { track, getUtmParams } from "@/lib/analytics-client";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

type Msg = { role: "user" | "assistant"; content: string };

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Hi! I'm the Golden Rule Comfort Assistant. Ask me anything about air conditioning, heating, maintenance, or indoor air quality — or tell me what's going on with your system and I'll point you in the right direction.",
};

const QUICK_REPLIES = [
  "My AC isn't cooling",
  "What is GoldStandard™ maintenance?",
  "Do you serve my area?",
  "I need a free estimate",
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadDone, setLeadDone] = useState(false);
  const startedRef = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const openHandler = () => setOpen(true);
    window.addEventListener("gr:open-chat", openHandler);
    return () => window.removeEventListener("gr:open-chat", openHandler);
  }, []);

  useEffect(() => {
    if (open && !startedRef.current) {
      startedRef.current = true;
      track("chat_start");
    }
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy, showLeadForm]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: message }]);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message }),
      });
      if (!res.ok) throw new Error("bad response");
      const data = (await res.json()) as {
        sessionId: string;
        reply: string;
        leadCaptured: boolean;
      };
      setSessionId(data.sessionId);
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      if (data.leadCaptured) {
        setLeadDone(true);
        track("chat_lead");
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `Sorry — I hit a snag. Please call us at ${COMPANY.phone} or use the Request Service page.`,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function submitLead(form: FormData) {
    const payload = {
      sessionId,
      name: String(form.get("name") || ""),
      phone: String(form.get("phone") || ""),
      email: String(form.get("email") || ""),
      service: String(form.get("service") || "Other"),
      website: String(form.get("website") || ""),
      ...getUtmParams(),
    };
    const res = await fetch("/api/chat/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setShowLeadForm(false);
      setLeadDone(true);
      track("chat_lead");
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Got it — your info is with our team and we'll reach out shortly. For anything urgent, call 281-500-7874 any time.",
        },
      ]);
    }
  }

  return (
    <>
      {/* launcher */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="launcher"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={() => setOpen(true)}
            aria-label="Open chat with the Golden Rule Comfort Assistant"
            className="fixed bottom-20 right-4 z-[85] hidden size-14 place-items-center rounded-full border-2 border-ink bg-gold text-ink shadow-gold transition-transform hover:scale-105 lg:bottom-6 lg:right-6 lg:grid"
          >
            <MessageCircle className="size-6" aria-hidden />
          </motion.button>
        )}
      </AnimatePresence>

      {/* panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            role="dialog"
            aria-label="Golden Rule Comfort Assistant"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-3 bottom-20 z-[86] flex max-h-[70vh] flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-2xl sm:inset-x-auto sm:right-6 sm:w-[400px] lg:bottom-6"
          >
            {/* header */}
            <div className="flex items-center justify-between gap-3 bg-night px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-gold text-ink">
                  <MessageCircle className="size-4.5" aria-hidden />
                </span>
                <div className="leading-tight">
                  <p className="font-display text-sm font-bold text-white">
                    Golden Rule Comfort Assistant
                  </p>
                  <p className="text-xs text-white/50">HVAC questions · service help</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            {/* messages */}
            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    m.role === "user"
                      ? "ml-auto rounded-br-md bg-gold text-ink"
                      : "rounded-bl-md bg-paper text-body"
                  )}
                >
                  {m.content}
                </div>
              ))}
              {busy && (
                <div className="flex gap-1.5 rounded-2xl rounded-bl-md bg-paper px-4 py-3 w-fit" aria-label="Assistant is typing">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="size-1.5 rounded-full bg-muted"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1, delay: i * 0.18 }}
                    />
                  ))}
                </div>
              )}

              {messages.length === 1 && !busy && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {QUICK_REPLIES.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-body transition-colors hover:border-gold hover:bg-gold-soft"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {showLeadForm && (
                <form
                  className="space-y-2.5 rounded-2xl border border-line bg-paper p-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void submitLead(new FormData(e.currentTarget));
                  }}
                >
                  <p className="text-sm font-bold text-ink">Leave your info — we&apos;ll reach out</p>
                  <Input name="name" placeholder="Full name" required aria-label="Full name" />
                  <Input name="phone" type="tel" placeholder="Phone" required aria-label="Phone" />
                  <Input name="email" type="email" placeholder="Email (optional)" aria-label="Email" />
                  <Input name="service" placeholder="What do you need? e.g. AC repair" aria-label="What do you need?" />
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">
                      Send
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setShowLeadForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* footer actions */}
            <div className="border-t border-line px-4 py-3">
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void send(input);
                }}
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your system…"
                  aria-label="Chat message"
                  className="!py-2"
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  disabled={busy || !input.trim()}
                  className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-ink bg-gold text-ink transition-opacity disabled:opacity-40"
                >
                  <Send className="size-4" aria-hidden />
                </button>
              </form>
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <a
                  href={COMPANY.phoneHref}
                  onClick={() => track("phone_click", { label: "chat-widget" })}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-gold-deep hover:underline"
                >
                  <PhoneCall className="size-3.5" aria-hidden />
                  Talk to a Comfort Specialist
                </a>
                {!leadDone && (
                  <button
                    onClick={() => setShowLeadForm((v) => !v)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink"
                  >
                    <UserRound className="size-3.5" aria-hidden />
                    Leave your info
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
