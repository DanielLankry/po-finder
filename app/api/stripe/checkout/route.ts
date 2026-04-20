import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSafeOrigin } from "@/lib/get-origin";
import { getPriceForMonths } from "@/lib/plans";
import { z } from "zod";

export const runtime = "nodejs";
const STRIPE_SK = process.env.STRIPE_SECRET_KEY!;

const checkoutSchema = z.object({
  months: z.number().int().min(1).max(24).optional().default(1),
});

async function stripePost(path: string, body: Record<string, string>) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${STRIPE_SK}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    if (!STRIPE_SK) return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rawBody = await req.json().catch(() => ({}));
    const parsed = checkoutSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const months = parsed.data.months;
    const price = getPriceForMonths(months);
    const origin = getSafeOrigin(req);

    const monthLabel = months === 1 ? "חודש" : months === 12 ? "שנה" : `${months} חודשים`;

    const session = await stripePost("/checkout/sessions", {
      mode: "payment",
      "payment_method_types[0]": "card",
      "line_items[0][price_data][currency]": "ils",
      "line_items[0][price_data][product_data][name]": `פוקרוב — ${monthLabel}`,
      "line_items[0][price_data][product_data][description]": `הופעה על המפה למשך ${monthLabel}`,
      "line_items[0][price_data][unit_amount]": String(price),
      "line_items[0][quantity]": "1",
      success_url: `${origin}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?payment=cancelled`,
      customer_email: user.email ?? "",
      "metadata[supabase_user_id]": user.id,
      "metadata[months]": String(months),
      "metadata[payment_type]": "business_listing",
    });

    if (session.error) return NextResponse.json({ error: session.error.message }, { status: 500 });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
