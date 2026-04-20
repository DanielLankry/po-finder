import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
const STRIPE_SK = process.env.STRIPE_SECRET_KEY!;

/**
 * GET /api/stripe/invoices
 * Returns the authenticated user's past successful Checkout Sessions
 * (we use one-time payments, not subscriptions, so "invoices" here means past sessions).
 */
export async function GET(_req: NextRequest) {
  try {
    if (!STRIPE_SK) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // List recent checkout sessions; filter on our side by metadata.
    // Stripe's list endpoint supports customer_email as a filter.
    const params = new URLSearchParams({
      limit: "50",
      ...(user.email ? { customer_details: "" } : {}),
    });

    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions?${params}`, {
      headers: { Authorization: `Bearer ${STRIPE_SK}` },
    });
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    type StripeSession = {
      id: string;
      amount_total: number | null;
      currency: string;
      created: number;
      payment_status: string;
      metadata?: Record<string, string>;
      payment_intent?: string;
    };

    const userSessions = (data.data as StripeSession[])
      .filter((s) => s.metadata?.supabase_user_id === user.id && s.payment_status === "paid")
      .map((s) => ({
        id: s.id,
        amount_total: s.amount_total,
        currency: s.currency,
        created: s.created,
        months: Number(s.metadata?.months ?? 1),
        payment_intent: s.payment_intent ?? null,
      }));

    return NextResponse.json({ sessions: userSessions });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
