import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSafeOrigin } from "@/lib/get-origin";
import { SPOT_DURATIONS } from "@/lib/types";

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
    if (!STRIPE_SK) return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { duration_days, spot_data } = body as {
      duration_days: number;
      spot_data: {
        name: string; category: string; address: string;
        lat: number; lng: number; phone?: string | null;
        description?: string | null; photo_url?: string | null;
      };
    };

    const duration = SPOT_DURATIONS.find((d) => d.days === duration_days);
    if (!duration) return NextResponse.json({ error: "Invalid duration" }, { status: 400 });

    const origin = getSafeOrigin(req);

    // Build metadata — Stripe metadata values must be strings
    const metadata: Record<string, string> = {
      spot_type: "spot",
      supabase_user_id: user.id,
      user_email: user.email ?? "",
      duration_days: String(duration_days),
      spot_name: spot_data.name,
      spot_category: spot_data.category,
      spot_address: spot_data.address,
      spot_lat: String(spot_data.lat),
      spot_lng: String(spot_data.lng),
    };
    if (spot_data.phone)       metadata.spot_phone       = spot_data.phone;
    if (spot_data.description) metadata.spot_description = spot_data.description;
    if (spot_data.photo_url)   metadata.spot_photo_url   = spot_data.photo_url;

    const session = await stripePost("/checkout/sessions", {
      mode: "payment",
      "payment_method_types[0]": "card",
      "line_items[0][price_data][currency]": "ils",
      "line_items[0][price_data][product_data][name]": `Spot — ${spot_data.name} (${duration.label})`,
      "line_items[0][price_data][product_data][description]": `רישום זמני ${duration.label} בפוקרוב`,
      "line_items[0][price_data][unit_amount]": String(duration.price),
      "line_items[0][quantity]": "1",
      success_url: `${origin}/spot/success`,
      cancel_url: `${origin}/spot`,
      "customer_email": user.email ?? "",
      ...Object.fromEntries(Object.entries(metadata).map(([k, v]) => [`metadata[${k}]`, v])),
    });

    if (session.error) return NextResponse.json({ error: session.error.message }, { status: 500 });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
