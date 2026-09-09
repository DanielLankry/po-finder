import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { isAdminRequest } from "@/lib/admin-session";

async function checkAdmin(req: NextRequest) {
  return isAdminRequest(req);
}

export async function GET(req: NextRequest) {
  if (!(await checkAdmin(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await adminClient()
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!(await checkAdmin(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // The legacy table cannot reserve a code against a payment attempt or
  // release quota safely after cancellation/refund, so issuance stays blocked
  // until an atomic redemption model is designed and migrated.
  return NextResponse.json(
    {
      error: "coupon_checkout_not_enabled",
      message: "Coupon creation is disabled until checkout redemption is implemented atomically.",
    },
    { status: 409 }
  );
}
