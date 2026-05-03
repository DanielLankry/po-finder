import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { verifyReturnSignature } from "@/lib/hyp";

export const runtime = "nodejs";

/**
 * HYP redirects the buyer here after the hosted payment page completes.
 * Query params include: Id, CCode, Amount, ACode, Order (= our attempt id),
 * L4digit, signature, etc.
 *
 * We verify the signature with HYP, then idempotently mark the attempt
 * succeeded/failed and apply the plan_days to the user's business.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const order = params.get("Order");
  const ccode = params.get("CCode");
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;

  if (!order) {
    return NextResponse.redirect(`${origin}/pricing?payment=cancelled`);
  }

  const admin = adminClient();
  const { data: attempt } = await admin
    .from("payment_attempts")
    .select("id, user_id, business_id, plan_days, amount_agorot, status")
    .eq("id", order)
    .single();

  if (!attempt) {
    return NextResponse.redirect(`${origin}/pricing?payment=cancelled`);
  }

  // Idempotence — if we already settled this attempt, just route the user.
  if (attempt.status === "succeeded") {
    return NextResponse.redirect(`${origin}/dashboard/billing?payment=success`);
  }
  if (attempt.status === "refunded" || attempt.status === "failed") {
    return NextResponse.redirect(`${origin}/pricing?payment=cancelled`);
  }

  const verified = await verifyReturnSignature(params).catch((err) => {
    console.error("[/api/payments/return] verify threw:", err);
    return false;
  });

  // Fold the redirect query into a JSON snapshot for support / debugging.
  const rawReturn: Record<string, string> = {};
  for (const [k, v] of params.entries()) rawReturn[k] = v;

  if (!verified) {
    await admin
      .from("payment_attempts")
      .update({
        status: "failed",
        hyp_response_code: ccode ?? "verify_failed",
        raw_return: rawReturn,
        completed_at: new Date().toISOString(),
      })
      .eq("id", attempt.id);
    return NextResponse.redirect(`${origin}/pricing?payment=cancelled`);
  }

  if (ccode !== "0") {
    await admin
      .from("payment_attempts")
      .update({
        status: "failed",
        hyp_response_code: ccode ?? "unknown",
        raw_return: rawReturn,
        completed_at: new Date().toISOString(),
      })
      .eq("id", attempt.id);
    return NextResponse.redirect(`${origin}/pricing?payment=cancelled`);
  }

  // Success — settle the attempt, flip subscription, bump expires_at.
  await admin
    .from("payment_attempts")
    .update({
      status: "succeeded",
      hyp_transaction_id: params.get("Id"),
      hyp_auth_code: params.get("ACode"),
      hyp_card_mask: params.get("L4digit"),
      hyp_response_code: ccode,
      raw_return: rawReturn,
      completed_at: new Date().toISOString(),
    })
    .eq("id", attempt.id);

  await admin
    .from("users")
    .update({ subscription_status: "active" })
    .eq("id", attempt.user_id);

  if (attempt.business_id) {
    // Renewal — extend from now() OR existing expires_at (whichever is later).
    const { data: biz } = await admin
      .from("businesses")
      .select("expires_at")
      .eq("id", attempt.business_id)
      .single();

    const baseMs = biz?.expires_at
      ? Math.max(Date.parse(biz.expires_at), Date.now())
      : Date.now();
    const newExpiry = new Date(
      baseMs + attempt.plan_days * 24 * 60 * 60 * 1000
    ).toISOString();

    await admin
      .from("businesses")
      .update({ expires_at: newExpiry })
      .eq("id", attempt.business_id);
  }
  // If no business_id, the trigger consume_payment_for_business() in
  // migration 017 will pick this credit up when the user creates their
  // business.

  return NextResponse.redirect(`${origin}/dashboard/billing?payment=success`);
}
