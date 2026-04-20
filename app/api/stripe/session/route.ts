import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
const STRIPE_SK = process.env.STRIPE_SECRET_KEY!;

/**
 * GET /api/stripe/session?id=cs_...
 * Returns a single checkout session — only if it belongs to the authenticated user.
 * Used by the payment-success page to display receipt details.
 */
export async function GET(req: NextRequest) {
  try {
    if (!STRIPE_SK) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = req.nextUrl.searchParams.get("id");
    if (!id || !id.startsWith("cs_")) {
      return NextResponse.json({ error: "Invalid session id" }, { status: 400 });
    }

    const res = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(id)}?expand[]=line_items`,
      { headers: { Authorization: `Bearer ${STRIPE_SK}` } }
    );
    const session = await res.json();

    if (session.error) {
      return NextResponse.json({ error: session.error.message }, { status: 404 });
    }

    // Authorization: only the payment owner may view
    if (session.metadata?.supabase_user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      id: session.id,
      amount_total: session.amount_total,
      currency: session.currency,
      payment_status: session.payment_status,
      created: session.created,
      customer_email: session.customer_email,
      months: Number(session.metadata?.months ?? 1),
      product_name: session.line_items?.data?.[0]?.description ?? null,
      receipt_url: session.payment_intent
        ? `https://dashboard.stripe.com/payments/${session.payment_intent}`
        : null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
