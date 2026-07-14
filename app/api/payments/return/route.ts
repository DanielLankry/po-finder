import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { verifyReturnSignature } from "@/lib/hyp";
import {
  getHypAuthCode,
  getHypCardMask,
  getHypResponseCode,
  getHypTransactionId,
  getPaymentAttemptId,
  isSuccessfulHypReturn,
} from "@/lib/payment-state";

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
  return settlePaymentReturn(req, req.nextUrl.searchParams);
}

export async function POST(req: NextRequest) {
  return settlePaymentReturn(req, await readPostReturnParams(req));
}

async function readPostReturnParams(req: NextRequest): Promise<URLSearchParams> {
  const params = new URLSearchParams(req.nextUrl.searchParams);
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const bodyParams = new URLSearchParams(await req.text());
    for (const [key, value] of bodyParams.entries()) params.append(key, value);
    return params;
  }

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    for (const [key, value] of form.entries()) {
      if (typeof value === "string") params.append(key, value);
    }
    return params;
  }

  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    if (body) {
      for (const [key, value] of Object.entries(body)) {
        if (typeof value === "string") params.append(key, value);
      }
    }
  }

  return params;
}

async function settlePaymentReturn(req: NextRequest, params: URLSearchParams) {
  const order = getPaymentAttemptId(params);
  const responseCode = getHypResponseCode(params);
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;

  if (!order) {
    return NextResponse.redirect(`${origin}/pricing?payment=cancelled`);
  }

  const admin = adminClient();
  const { data: attempt } = await admin
    .from("payment_attempts")
    .select("id, business_id, plan_days, amount_agorot, status, kind")
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
    const { error } = await admin
      .from("payment_attempts")
      .update({
        status: "failed",
        hyp_response_code: responseCode ?? "verify_failed",
        raw_return: rawReturn,
        completed_at: new Date().toISOString(),
      })
      .eq("id", attempt.id);
    if (error) {
      console.error("[/api/payments/return] failed to record verify failure:", error);
    }
    return NextResponse.redirect(`${origin}/pricing?payment=cancelled`);
  }

  if (!isSuccessfulHypReturn(params)) {
    const { error } = await admin
      .from("payment_attempts")
      .update({
        status: "failed",
        hyp_response_code: responseCode ?? "unknown",
        raw_return: rawReturn,
        completed_at: new Date().toISOString(),
      })
      .eq("id", attempt.id);
    if (error) {
      console.error("[/api/payments/return] failed to record declined payment:", error);
    }
    return NextResponse.redirect(`${origin}/pricing?payment=cancelled`);
  }

  // Success — settle the attempt and bump the relevant business expiry.
  const { error: settleError } = await admin
    .from("payment_attempts")
    .update({
      status: "succeeded",
      hyp_transaction_id: getHypTransactionId(params),
      hyp_auth_code: getHypAuthCode(params),
      hyp_card_mask: getHypCardMask(params),
      hyp_response_code: responseCode,
      raw_return: rawReturn,
      completed_at: new Date().toISOString(),
    })
    .eq("id", attempt.id);
  if (settleError) {
    console.error("[/api/payments/return] failed to mark attempt succeeded:", settleError);
  }

  if (attempt.business_id) {
    // Extend from now() OR existing expiry (whichever is later).
    // listing → expires_at; boost → boost_expires_at.
    const column = attempt.kind === "boost" ? "boost_expires_at" : "expires_at";
    const { data: biz } = await admin
      .from("businesses")
      .select("expires_at, boost_expires_at")
      .eq("id", attempt.business_id)
      .single();

    const current =
      attempt.kind === "boost" ? biz?.boost_expires_at : biz?.expires_at;
    const baseMs = current
      ? Math.max(Date.parse(current), Date.now())
      : Date.now();
    const newExpiry = new Date(
      baseMs + attempt.plan_days * 24 * 60 * 60 * 1000
    ).toISOString();

    const { error: businessError } = await admin
      .from("businesses")
      .update({ [column]: newExpiry })
      .eq("id", attempt.business_id);
    if (businessError) {
      console.error("[/api/payments/return] failed to extend business expiry:", businessError);
    }
  }
  // If no business_id (listing pre-pay), the trigger
  // consume_payment_for_business() picks this credit up when the user
  // creates their business. Boosts always carry business_id (checkout
  // enforces it).

  return NextResponse.redirect(`${origin}/dashboard/billing?payment=success`);
}
