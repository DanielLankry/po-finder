import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSafeOrigin } from "@/lib/get-origin";
import { SPOT_PLANS } from "@/lib/types";

export const runtime = "nodejs";

const STRIPE_SK = process.env.STRIPE_SECRET_KEY!;

async function stripePost(path: string, body: Record<string, string>) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SK}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  });
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, description, category, address, lat, lng, phone, photo_url, duration_days } = body;

    // Validate required fields
    if (!name || !category || !address || !lat || !lng || !duration_days) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const plan = SPOT_PLANS.find((p) => p.days === Number(duration_days));
    if (!plan) return NextResponse.json({ error: "Invalid duration" }, { status: 400 });

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
      customerId = customer.id;
      await supabase
        .from("users")
        .upsert({ id: user.id, email: user.email ?? "", stripe_customer_id: customerId }, { onConflict: "id" });
    }

    // Encode spot data in metadata (Stripe metadata values must be strings ≤500 chars)
    const spotMeta = {
      owner_id: user.id,
      name: name.slice(0, 100),
      description: (description ?? "").slice(0, 200),
      category,
      address: address.slice(0, 200),
      lat: String(lat),
      lng: String(lng),
      phone: phone ?? "",
      photo_url: photo_url ?? "",
      duration_days: String(duration_days),
    };

    const session = await stripePost("/checkout/sessions", {
      customer: customerId,
      mode: "payment",
      "payment_method_types[0]": "card",
      "line_items[0][price_data][currency]": "ils",
      "line_items[0][price_data][product_data][name]": `Spot: ${name}`,
      "line_items[0][price_data][product_data][description]": `${plan.label} — הופעה בולטת על המפה`,
      "line_items[0][price_data][unit_amount]": String(plan.price),
      "line_items[0][quantity]": "1",
      success_url: `${origin}/dashboard/spots?payment=success`,
      cancel_url: `${origin}/dashboard/spots?payment=cancelled`,
      "metadata[type]": "spot",
      ...Object.fromEntries(Object.entries(spotMeta).map(([k, v]) => [`metadata[${k}]`, v])),
    });

    if (session.error) {
      return NextResponse.json({ error: session.error.message }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Spot checkout error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
