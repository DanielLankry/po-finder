import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { getPaymentAttemptId } from "@/lib/payment-state";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;
  const attemptId = getPaymentAttemptId(req.nextUrl.searchParams);

  if (attemptId) {
    const { error } = await adminClient()
      .from("payment_attempts")
      .update({
        status: "failed",
        hyp_response_code: "cancelled",
        completed_at: new Date().toISOString(),
      })
      .eq("id", attemptId)
      .eq("status", "pending");

    if (error) {
      console.error("[/api/payments/cancel] failed to mark attempt cancelled:", error);
    }
  }

  return NextResponse.redirect(`${origin}/pricing?payment=cancelled`);
}
