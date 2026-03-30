import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";
import { sendNewBusinessAlert } from "@/lib/email";

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

  const supabase = await createClient();

  // Idempotence: check if this event was already processed
  const { data: existing } = await supabase
    .from("processed_webhook_events")
    .select("event_id")
    .eq("event_id", event.id)
    .maybeSingle();

  if (existing) {
    // Already processed — return 200 to prevent Stripe retries
    return NextResponse.json({ received: true });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata ?? {};

    if (meta.payment_type === "business_listing") {
      const userId = meta.supabase_user_id;
      const months = parseInt(meta.months ?? "1", 10);

      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + months);

      // Find user's pending business (is_active = false)
      const { data: biz } = await supabase
        .from("businesses")
        .select("id, name, category, phone")
        .eq("owner_id", userId)
        .eq("is_active", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (biz) {
        await supabase
          .from("businesses")
          .update({ expires_at: expiresAt.toISOString() })
          .eq("id", biz.id);

        // Notify admin
        try {
          const { data: userData } = await supabase
            .from("users")
            .select("email")
            .eq("id", userId)
            .single();

          await sendNewBusinessAlert({
            id: biz.id,
            name: biz.name,
            category: biz.category,
            phone: biz.phone,
            owner_email: userData?.email ?? session.customer_email ?? "",
          });
        } catch (e) {
          console.error("Email error:", e);
        }
      }
    }
  }

  // Mark event as processed
  await supabase
    .from("processed_webhook_events")
    .insert({ event_id: event.id });

  return NextResponse.json({ ok: true });
}
