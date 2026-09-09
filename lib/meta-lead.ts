"use client";

import { trackMetaEvent } from "@/lib/meta-pixel";

/** Tracks a real business draft in Pixel and mirrors it to CAPI with one event ID. */
export function trackMetaBusinessLead({
  businessId,
  category,
}: {
  businessId: string;
  category: string;
}): boolean {
  const eventID = `business-${businessId}`;
  const browserQueued = trackMetaEvent(
    "Lead",
    {
      content_name: "business_draft",
      content_category: category,
    },
    { eventID },
  );

  if (!browserQueued) return false;

  void fetch("/api/meta/lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ businessId, consent: true }),
    keepalive: true,
  }).catch((error) => {
    console.error("Failed to mirror Meta Lead event:", error);
  });

  return true;
}
