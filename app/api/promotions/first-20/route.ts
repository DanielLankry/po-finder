import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  FIRST_BUSINESSES_PROMOTION_CODE,
  toLaunchPromotionStatus,
} from "@/lib/launch-promotion";

export const dynamic = "force-dynamic";

/** Returns campaign eligibility and its fixed cap without exposing live claims. */
export async function GET() {
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
  }

  return NextResponse.json(
    { promotion: data ? toLaunchPromotionStatus(data) : null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
