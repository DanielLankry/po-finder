import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-session";
import { adminClient } from "@/lib/supabase/admin";
import { refundTransaction } from "@/lib/hyp";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = adminClient();

  const { data: attempt, error } = await admin
    .from("payment_attempts")
    .select("id, status, hyp_transaction_id, business_id, product_code")
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

  // Validate that the entitlement can be rolled back before money is returned.
  // Duration renewals are refunded newest-first so the exact saved expiry can
  // be restored without month-end date drift.
  const { error: preflightError } = await admin.rpc(
    "preflight_refund_payment_entitlement",
    { p_attempt_id: attempt.id }
  );
  if (preflightError) {
    return NextResponse.json(
      {
        error: "refund requires a newer entitlement to be refunded first",
        detail: preflightError.message,
      },
      { status: 409 }
    );
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

  const { error: entitlementError } = await admin.rpc(
    "refund_payment_entitlement",
    { p_attempt_id: attempt.id }
  );
  if (entitlementError) {
    console.error(
      "[/api/admin/payments/refund] provider refund succeeded but entitlement rollback failed:",
      entitlementError
    );
    return NextResponse.json(
      {
        error: "provider refund succeeded; entitlement rollback needs support",
        detail: entitlementError.message,
        raw,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, raw });
}
