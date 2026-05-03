import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { refundTransaction } from "@/lib/hyp";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = req.cookies.get("admin_session")?.value;
  if (session !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = adminClient();

  const { data: attempt, error } = await admin
    .from("payment_attempts")
    .select("id, status, hyp_transaction_id, business_id, user_id, plan_days")
    .eq("id", id)
    .single();

  if (error || !attempt) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (attempt.status !== "succeeded") {
    return NextResponse.json(
      { error: `cannot refund a ${attempt.status} attempt` },
      { status: 400 }
    );
  }
  if (!attempt.hyp_transaction_id) {
    return NextResponse.json({ error: "missing hyp transaction id" }, { status: 400 });
  }

  const { ok, raw } = await refundTransaction(attempt.hyp_transaction_id);

  if (!ok) {
    // HYP refused — common when Masof isn't enabled for cancelTrans. The
    // admin should void the charge in the HYP merchant console manually.
    return NextResponse.json(
      { error: "hyp refund failed; cancel manually in merchant console", raw },
      { status: 502 }
    );
  }

  // Mark attempt refunded. Roll back expires_at on the linked business and
  // flip subscription_status if this was the user's only paid attempt.
  await admin
    .from("payment_attempts")
    .update({ status: "refunded" })
    .eq("id", attempt.id);

  if (attempt.business_id) {
    const { data: biz } = await admin
      .from("businesses")
      .select("expires_at")
      .eq("id", attempt.business_id)
      .single();

    if (biz?.expires_at) {
      const rolled = Math.max(
        Date.parse(biz.expires_at) - attempt.plan_days * 24 * 60 * 60 * 1000,
        Date.now()
      );
      // If the rollback puts the listing in the past, just deactivate it.
      const newExpiry = rolled <= Date.now() ? null : new Date(rolled).toISOString();
      await admin
        .from("businesses")
        .update({ expires_at: newExpiry, ...(newExpiry === null ? { is_active: false } : {}) })
        .eq("id", attempt.business_id);
    }
  }

  // If user has no other succeeded attempts, knock subscription back to canceled.
  const { count } = await admin
    .from("payment_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", attempt.user_id)
    .eq("status", "succeeded");

  if (!count || count === 0) {
    await admin
      .from("users")
      .update({ subscription_status: "canceled" })
      .eq("id", attempt.user_id);
  }

  return NextResponse.json({ ok: true, raw });
}
