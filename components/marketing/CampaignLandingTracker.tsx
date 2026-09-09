"use client";

import { useEffect } from "react";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { trackPostHogEvent } from "@/lib/posthog";

/** Records a campaign landing view after the matching offer is confirmed open. */
export default function CampaignLandingTracker({ campaignCode }: { campaignCode: string }) {
  useEffect(() => {
    trackMetaEvent("ViewContent", {
      content_name: campaignCode,
      content_category: "launch_promotion_landing",
    });
    trackPostHogEvent("launch_promotion_landing_viewed", {
      campaign_code: campaignCode,
    });
  }, [campaignCode]);

  return null;
}
