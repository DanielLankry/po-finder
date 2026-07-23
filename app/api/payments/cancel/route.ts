import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getPaymentAttemptId } from "@/lib/payment-state";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;
  const attemptId = getPaymentAttemptId(req.nextUrl.searchParams);
  const parsedAttemptId = z.string().uuid().safeParse(attemptId);

  if (parsedAttemptId.success) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // The provider cancel redirect is not signed. Only the verified owner may
    // mutate a pending attempt; knowing another attempt UUID is not authority.
    if (!user) {
      return NextResponse.redirect(`${origin}/pricing?payment=cancelled`);
    }

    const { error } = await adminClient()
      .from("payment_attempts")
      .update({
        status: "failed",
        hyp_response_code: "cancelled",
        completed_at: new Date().toISOString(),
      })
      .eq("id", parsedAttemptId.data)
      .eq("user_id", user.id)
      .eq("status", "pending");

    if (error) {
      console.error("[/api/payments/cancel] failed to mark attempt cancelled:", error);
    }
  }

  return NextResponse.redirect(`${origin}/pricing?payment=cancelled`);
}
