import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata ?? {};

    // Only handle spot payments
    if (meta.spot_type !== "spot") return NextResponse.json({ ok: true });

    const supabase = await createClient();

    const durationDays = parseInt(meta.duration_days ?? "1", 10);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 86400 * 1000);

    const { error } = await supabase.from("spots").insert({
      owner_id: meta.supabase_user_id,
      name: meta.spot_name,
      category: meta.spot_category,
      address: meta.spot_address,
      lat: parseFloat(meta.spot_lat ?? "32.0853"),
      lng: parseFloat(meta.spot_lng ?? "34.7818"),
      phone: meta.spot_phone ?? null,
      description: meta.spot_description ?? null,
      photo_url: meta.spot_photo_url ?? null,
      stripe_payment_id: session.payment_intent as string ?? null,
      duration_days: durationDays,
      amount_paid: session.amount_total ?? 0,
      starts_at: null,    // set on admin approval
      expires_at: null,   // set on admin approval
      is_approved: false,
      is_active: true,
    });

    if (error) {
      console.error("spot insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
