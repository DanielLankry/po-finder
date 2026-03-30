"use client";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export default function ViewTracker({ businessId }: { businessId: string }) {
  useEffect(() => {
    trackEvent(businessId, "view");
  }, [businessId]);
  return null;
}
