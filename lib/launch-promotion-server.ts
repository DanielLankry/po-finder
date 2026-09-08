import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  FIRST_BUSINESSES_PROMOTION_CODE,
  type LaunchPromotionStatus,
  toLaunchPromotionStatus,
} from "@/lib/launch-promotion";

/** Loads the public launch-offer status while keeping live claim counts private. */
export async function getFirstBusinessesPromotionStatus(): Promise<LaunchPromotionStatus | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("promotion_campaigns")
    .select(
      "code, capacity, claimed_count, duration_months, starts_at, enrollment_ends_at, is_active",
    )
    .eq("code", FIRST_BUSINESSES_PROMOTION_CODE)
    .maybeSingle();

  if (error) {
    console.error("Failed to load launch promotion status:", error.message);
    return null;
  }

  return data ? toLaunchPromotionStatus(data) : null;
}
