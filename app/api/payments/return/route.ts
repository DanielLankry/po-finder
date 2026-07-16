import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { verifyReturnSignature } from "@/lib/hyp";
import {
  getHypAuthCode,
  getHypCardMask,
  getHypResponseCode,
  getHypTransactionId,
  getBoundPaymentAttemptId,
  getPaymentReturnAuditSnapshot,
  isSuccessfulHypReturn,
} from "@/lib/payment-state";

export const runtime = "nodejs";

/**
 * HYP redirects the buyer here after the hosted payment page completes.
 * Query params include: Id, CCode, Amount, ACode, Order (= our attempt id),
 * L4digit, signature, etc.
 *
 * We verify the signature with HYP, then settle the payment and entitlement in
 * one database transaction. This prevents a charged payment from being marked
 * complete without its listing/boost being applied.
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
  const parsedOrder = z.string().uuid().safeParse(getBoundPaymentAttemptId(params));
  const responseCode = getHypResponseCode(params);
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;

  if (!parsedOrder.success) {
    return NextResponse.redirect(`${origin}/pricing?payment=cancelled`);
  }
  const order = parsedOrder.data;

  const admin = adminClient();
  const { data: attempt } = await admin
    .from("payment_attempts")
    .select("id, business_id, product_code, amount_agorot, status, kind")
    .eq("id", order)
    .single();

  if (!attempt) {
    return NextResponse.redirect(`${origin}/pricing?payment=cancelled`);
  }

  // Idempotence — if we already settled this attempt, just route the user.
  if (attempt.status === "succeeded") {
    const successUrl = new URL("/dashboard/billing", origin);
    successUrl.searchParams.set("payment", "success");
    successUrl.searchParams.set("attempt", attempt.id);
    return NextResponse.redirect(successUrl);
  }
  if (attempt.status === "refunded" || attempt.status === "failed") {
    return NextResponse.redirect(`${origin}/pricing?payment=cancelled`);
  }

  // Keep a bounded diagnostic snapshot without retaining provider MACs, card
  // tokens, personal IDs, or arbitrary user-controlled callback metadata.
  const rawReturn = getPaymentReturnAuditSnapshot(params);

  let verified: boolean;
  try {
    verified = await verifyReturnSignature(params);
  } catch (err) {
    console.error("[/api/payments/return] verifier unavailable:", err);
    Sentry.captureException(err, {
      tags: {
        route: "payments-return",
        phase: "hyp-verify",
        attemptId: attempt.id,
      },
    });
    const { error } = await admin
      .from("payment_attempts")
      .update({
        hyp_response_code: responseCode ?? "verify_unavailable",
        raw_return: rawReturn,
      })
      .eq("id", attempt.id)
      .eq("status", "pending");
    if (error) {
      console.error("[/api/payments/return] failed to retain pending verification:", error);
    }
    return NextResponse.redirect(`${origin}/dashboard/billing?payment=processing`);
  }

  if (!verified) {
    const { error } = await admin
      .from("payment_attempts")
      .update({
        status: "failed",
        hyp_response_code: responseCode ?? "verify_failed",
        raw_return: rawReturn,
        completed_at: new Date().toISOString(),
      })
      .eq("id", attempt.id)
      .eq("status", "pending");
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
      .eq("id", attempt.id)
      .eq("status", "pending");
    if (error) {
      console.error("[/api/payments/return] failed to record declined payment:", error);
    }
    return NextResponse.redirect(`${origin}/pricing?payment=cancelled`);
  }

  const { error: settleError } = await admin.rpc("settle_payment_attempt", {
    p_attempt_id: attempt.id,
    p_hyp_transaction_id: getHypTransactionId(params) ?? "",
    p_hyp_auth_code: getHypAuthCode(params) ?? "",
    p_hyp_card_mask: getHypCardMask(params) ?? "",
    p_hyp_response_code: responseCode ?? "0",
    p_raw_return: rawReturn,
  });
  if (settleError) {
    console.error("[/api/payments/return] atomic settlement failed:", settleError);
    Sentry.captureMessage("HYP payment verified but entitlement settlement failed", {
      level: "error",
      tags: {
        route: "payments-return",
        attemptId: attempt.id,
        productCode: attempt.product_code,
      },
      extra: { error: settleError.message },
    });
    // Leave the attempt pending for safe reconciliation. Never label a verified
    // card charge as failed when entitlement application needs attention.
    return NextResponse.redirect(
      `${origin}/dashboard/billing?payment=processing`
    );
  }

  const successUrl = new URL("/dashboard/billing", origin);
  successUrl.searchParams.set("payment", "success");
  successUrl.searchParams.set("attempt", attempt.id);
  return NextResponse.redirect(successUrl);
}
