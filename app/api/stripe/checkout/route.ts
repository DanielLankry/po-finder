import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSafeOrigin } from "@/lib/get-origin";

export const runtime = "nodejs";

const STRIPE_SK = process.env.STRIPE_SECRET_KEY!;

async function stripePost(path: string, body: Record<string, string>) {
  const encoded = new URLSearchParams(body).toString();
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SK}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: encoded,
  });
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    if (!STRIPE_SK) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const origin = getSafeOrigin(req);

    // Get or create Stripe customer
    const { data: userData } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    let customerId = userData?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripePost("/customers", {
        email: user.email ?? "",
        "metadata[supabase_user_id]": user.id,
      });

      if (customer.error) {
        return NextResponse.json({ error: customer.error.message }, { status: 500 });
      }

      customerId = customer.id;
      await supabase
        .from("users")
        .upsert({ id: user.id, email: user.email ?? "", stripe_customer_id: customerId }, { onConflict: "id" });
    }

    // Create checkout session
    const session = await stripePost("/checkout/sessions", {
      customer: customerId,
      mode: "subscription",
      "payment_method_types[0]": "card",
      "line_items[0][price_data][currency]": "ils",
      "line_items[0][price_data][product_data][name]": "עסק בפה קרוב — מנוי חודשי",
      "line_items[0][price_data][product_data][description]": "הופעה על המפה, פרופיל עסק מלא, ניהול שעות ותמונות",
      "line_items[0][price_data][unit_amount]": "2500",
      "line_items[0][price_data][recurring][interval]": "month",
      "line_items[0][quantity]": "1",
      success_url: `${origin}/dashboard?payment=success`,
      cancel_url: `${origin}/pricing?payment=cancelled`,
      "metadata[supabase_user_id]": user.id,
    });

    if (session.error) {
      return NextResponse.json({ error: session.error.message }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Stripe checkout error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
