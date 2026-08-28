"use client";

/**
 * Lightweight first-party analytics. Events land in the AnalyticsEvent table
 * and power the admin analytics dashboard. No third-party trackers.
 */

let sessionId: string | null = null;

function getSessionId() {
  if (sessionId) return sessionId;
  try {
    sessionId = sessionStorage.getItem("gr_sid");
    if (!sessionId) {
      sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("gr_sid", sessionId);
    }
  } catch {
    sessionId = "anon";
  }
  return sessionId;
}

export function getUtmParams(): Record<string, string | null> {
  if (typeof window === "undefined") return {};
  try {
    const stored = sessionStorage.getItem("gr_utm");
    if (stored) return JSON.parse(stored);
    const p = new URLSearchParams(window.location.search);
    const utm = {
      utmSource: p.get("utm_source"),
      utmMedium: p.get("utm_medium"),
      utmCampaign: p.get("utm_campaign"),
      utmTerm: p.get("utm_term"),
      utmContent: p.get("utm_content"),
      landingPage: window.location.pathname,
      referrer: document.referrer || null,
    };
    if (utm.utmSource || utm.referrer) sessionStorage.setItem("gr_utm", JSON.stringify(utm));
    return utm;
  } catch {
    return {};
  }
}

export function track(
  type:
    | "page_view"
    | "phone_click"
    | "form_start"
    | "form_complete"
    | "chat_start"
    | "chat_lead"
    | "cta_click",
  meta?: Record<string, unknown>
) {
  try {
    const payload = JSON.stringify({
      type,
      path: window.location.pathname,
      sessionId: getSessionId(),
      meta,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics/track", new Blob([payload], { type: "application/json" }));
    } else {
      fetch("/api/analytics/track", { method: "POST", body: payload, keepalive: true });
    }
  } catch {
    // analytics must never break the page
  }
}
