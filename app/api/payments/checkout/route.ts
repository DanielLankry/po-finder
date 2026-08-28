import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { getPlanByCode } from "@/lib/plans-server";
import { PLAN_CODES } from "@/lib/plans";
import { createSignedCheckoutUrl } from "@/lib/hyp";
import { BRAND_NAME } from "@/lib/site-config";
import { ensurePublicUser } from "@/lib/user-profile";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  planCode: z.enum(PLAN_CODES),
  businessId: z.string().uuid(),
}).strict();

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`payments-checkout:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!user.email) {
    return NextResponse.json(
      { ok: false, error: "verified email required" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const plan = await getPlanByCode(parsed.data.planCode);
  if (!plan) {
    return NextResponse.json({ error: "invalid plan" }, { status: 400 });
  }

  const admin = adminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id, is_verified, is_active, expires_at")
    .eq("id", parsed.data.businessId)
    .eq("owner_id", user.id)
    .single();
  if (!business) {
    return NextResponse.json({ error: "business not found" }, { status: 404 });
  }
  if (!business.is_verified) {
    return NextResponse.json(
      { error: "business_not_verified" },
      { status: 409 }
    );
  }
  try {
    await ensurePublicUser(admin, user, "business_owner");
  } catch (err) {
    console.error("[/api/payments/checkout] ensure public user failed:", err);
    return NextResponse.json(
      { ok: false, error: "internal error" },
      { status: 200 }
    );
  }

  const { data: attempt, error: insertErr } = await admin
    .from("payment_attempts")
    .insert({
      user_id: user.id,
      business_id: parsed.data.businessId,
      product_code: plan.code,
      plan_days: plan.days,
      duration_months: plan.months,
      bonus_boost_days: plan.boostDays,
      amount_agorot: plan.price,
      kind: plan.kind,
      status: "pending",
    })
    .select("id, amount_agorot")
    .single();

  if (insertErr || !attempt) {
    console.error("[/api/payments/checkout] insert failed:", insertErr);
    // 200 + ok:false so a Cloudflare/edge proxy in front of the origin
    // doesn't replace our JSON with its own 5xx HTML page (which the FE
    // would then fail to JSON.parse and surface as an empty alert).
    return NextResponse.json(
      { ok: false, error: "internal error" },
      { status: 200 }
    );
  }

  // The database trigger snapshots the authoritative catalog price. Refuse to
  // charge if a concurrent admin edit or unapplied migration made it differ
  // from the price shown to the buyer.
  if (
    attempt.amount_agorot !== plan.price ||
    !Number.isInteger(attempt.amount_agorot) ||
    attempt.amount_agorot <= 0 ||
    attempt.amount_agorot % 100 !== 0
  ) {
    console.error("[/api/payments/checkout] catalog price mismatch", {
      attemptId: attempt.id,
      requestedPlan: plan.code,
    });
    await admin
      .from("payment_attempts")
      .update({ status: "failed", completed_at: new Date().toISOString() })
      .eq("id", attempt.id)
      .eq("status", "pending");
    return NextResponse.json(
      { ok: false, error: "pricing configuration unavailable" },
      { status: 409 }
    );
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;
  const returnUrl = new URL("/api/payments/return", origin);
  returnUrl.searchParams.set("attempt", attempt.id);
  const cancelUrl = new URL("/api/payments/cancel", origin);
  cancelUrl.searchParams.set("attempt", attempt.id);

  try {
    const { data: profile } = await admin
      .from("users")
      .select("name")
      .eq("id", user.id)
      .maybeSingle();
    const nameParts = (profile?.name ?? "").trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts.shift() ?? "";
    const lastName = nameParts.join(" ");

    const url = await createSignedCheckoutUrl({
      amount: attempt.amount_agorot / 100, // HYP expects whole shekels
      // Plain hyphen — HYP's downstream description field uses windows-1255
      // and renders an em-dash as "?" on the hosted payment page.
      info: `${BRAND_NAME} - ${plan.label}`,
      order: attempt.id,
      email: user.email,
      firstName,
      lastName,
      successUrl: returnUrl.toString(),
      errorUrl: returnUrl.toString(),
      cancelUrl: cancelUrl.toString(),
    });

    return NextResponse.json({ ok: true, id: attempt.id, url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/payments/checkout] HYP sign failed:", message);
    Sentry.captureException(err, {
      tags: { route: "payments-checkout", phase: "hyp-sign" },
      extra: {
        hypMasofPresent: !!process.env.HYP_MASOF,
        hypPasspPresent: !!process.env.HYP_PASSP,
        hypApiKeyPresent: !!process.env.HYP_API_KEY,
        siteUrlPresent: !!process.env.NEXT_PUBLIC_SITE_URL,
      },
    });
    await admin
      .from("payment_attempts")
      .update({ status: "failed", completed_at: new Date().toISOString() })
      .eq("id", attempt.id);
    // 200 + ok:false — see comment above. Real-world: Cloudflare in front
    // of pokarov.co.il was rewriting our 502 JSON to its own HTML page,
    // breaking the FE's res.json() and producing a detail-less alert.
    return NextResponse.json(
      { ok: false, error: "payment provider error" },
      { status: 200 }
    );
  }
}
