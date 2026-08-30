"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PhoneCall, CalendarPlus, MessageCircle } from "lucide-react";
import { COMPANY } from "@/lib/site";
import { track } from "@/lib/analytics-client";

/** Sticky bottom bar on mobile: CALL · REQUEST SERVICE · CHAT. */
export function MobileCTABar() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
      role="navigation"
      aria-label="Quick actions"
    >
      <div className="grid grid-cols-3">
        <a
          href={COMPANY.phoneHref}
          onClick={() => track("phone_click", { label: "mobile-bar" })}
          className="flex flex-col items-center gap-0.5 py-2.5 text-xs font-bold text-ink"
        >
          <PhoneCall className="size-5 text-gold-deep" aria-hidden />
          Call
        </a>
        <Link
          href="/request-service"
          onClick={() => track("cta_click", { cta: "mobile-bar-request" })}
          className="flex flex-col items-center gap-0.5 border-x border-line bg-gold py-2.5 text-xs font-bold text-ink"
        >
          <CalendarPlus className="size-5" aria-hidden />
          Request Service
        </Link>
        <button
          onClick={() => {
            track("cta_click", { cta: "mobile-bar-chat" });
            window.dispatchEvent(new CustomEvent("gr:open-chat"));
          }}
          className="flex flex-col items-center gap-0.5 py-2.5 text-xs font-bold text-ink"
        >
          <MessageCircle className="size-5 text-gold-deep" aria-hidden />
          Chat
        </button>
      </div>
    </div>
  );
}
