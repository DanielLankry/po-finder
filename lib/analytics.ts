"use client";
export type EventType = "view" | "call_click" | "whatsapp_click" | "directions_click";

function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("po-cookie-consent") === "accepted";
}

// Simple random session ID for anonymous tracking (per session)
function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem("po-sid");
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("po-sid", sid);
  }
  return sid;
}

export async function trackEvent(businessId: string, eventType: EventType) {
  try {
    if (!hasAnalyticsConsent()) return;

    await fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        businessId,
        eventType,
        sessionId: getSessionId(),
      }),
    });
  } catch {
    // Silently fail — analytics should never break UX
  }
}
