import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata ?? {};

      // ── Spot one-time payment ──────────────────────────────────────────
      if (meta.type === "spot" && meta.owner_id) {
        const durationDays = parseInt(meta.duration_days ?? "1", 10);
        const startsAt = new Date();
        const expiresAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

        await supabase.from("spots").insert({
          owner_id: meta.owner_id,
          name: meta.name,
          description: meta.description || null,
          category: meta.category,
          address: meta.address,
          lat: parseFloat(meta.lat),
          lng: parseFloat(meta.lng),
          phone: meta.phone || null,
          photo_url: meta.photo_url || null,
          duration_days: durationDays,
          starts_at: startsAt.toISOString(),
          expires_at: expiresAt.toISOString(),
          stripe_payment_intent_id: session.payment_intent as string | null,
          amount_paid: session.amount_total ?? 0,
          status: "pending", // awaits admin approval
        });
        break;
      }

      // ── Regular subscription ───────────────────────────────────────────
      const userId = meta.supabase_user_id;
      if (userId && session.subscription) {
        await supabase
          .from("users")
          .update({
            subscription_status: "active",
            stripe_subscription_id: session.subscription as string,
          })
          .eq("id", userId);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (user) {
        await supabase
          .from("users")
          .update({
            subscription_status: subscription.status,
          })
          .eq("id", user.id);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (user) {
        await supabase
          .from("users")
          .update({
            subscription_status: "canceled",
            stripe_subscription_id: null,
          })
          .eq("id", user.id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
