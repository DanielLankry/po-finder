import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { getPlanByDays } from "@/lib/plans-server";
import { createSignedCheckoutUrl } from "@/lib/hyp";
import { BRAND_NAME } from "@/lib/site-config";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  planDays: z.number().int().positive(),
  businessId: z.string().uuid().optional(),
});

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

  const body = await req.json().catch(() => ({}));
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const plan = await getPlanByDays(parsed.data.planDays);
  if (!plan) {
    return NextResponse.json({ error: "invalid plan" }, { status: 400 });
  }

  // If renewing, verify the business belongs to the user.
  if (parsed.data.businessId) {
    const { data: biz } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", parsed.data.businessId)
      .eq("owner_id", user.id)
      .single();
    if (!biz) {
      return NextResponse.json({ error: "business not found" }, { status: 404 });
    }
  }

  const admin = adminClient();
  const { data: attempt, error: insertErr } = await admin
    .from("payment_attempts")
    .insert({
      user_id: user.id,
      business_id: parsed.data.businessId ?? null,
      plan_days: plan.days,
      amount_agorot: plan.price,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertErr || !attempt) {
    console.error("[/api/payments/checkout] insert failed:", insertErr);
    // 200 + ok:false so a Cloudflare/edge proxy in front of the origin
    // doesn't replace our JSON with its own 5xx HTML page (which the FE
    // would then fail to JSON.parse and surface as a content-free alert).
    return NextResponse.json(
      { ok: false, error: "internal error", detail: insertErr?.message ?? "could not record attempt" },
      { status: 200 }
    );
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;

  try {
    const url = await createSignedCheckoutUrl({
      amount: Math.round(plan.price / 100), // HYP expects whole shekels
      // Plain hyphen — HYP's downstream description field uses windows-1255
      // and renders an em-dash as "?" on the hosted payment page.
      info: `${BRAND_NAME} - ${plan.label}`,
      order: attempt.id,
      email: "",
      firstName: "",
      lastName: "",
      successUrl: `${origin}/api/payments/return`,
      errorUrl: `${origin}/api/payments/return`,
      cancelUrl: `${origin}/api/payments/cancel`,
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
      { ok: false, error: "payment provider error", detail: message },
      { status: 200 }
    );
  }
}
