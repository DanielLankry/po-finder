"use client";
import { createClient } from "@/lib/supabase/client";

export type EventType = "view" | "call_click" | "whatsapp_click" | "directions_click";

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
    const supabase = createClient();
    await supabase.from("business_events").insert({
      business_id: businessId,
      event_type: eventType,
      session_id: getSessionId(),
    });
  } catch {
    // Silently fail — analytics should never break UX
  }
}
