import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-session";
import { adminClient } from "@/lib/supabase/admin";
import { dispatchPaymentEmails } from "@/lib/payment-email-outbox";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await adminClient().from("payment_email_outbox")
    .select("id, attempt_id, event_type, recipient, status, attempts, next_attempt_at, last_error, provider_message_id, created_at, accepted_at")
    .order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: "לא ניתן לטעון את הודעות התשלום" }, { status: 500 });
  return NextResponse.json({ items: data }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // The admin cookie alone must not authorize a cross-site send request.
  if (req.headers.get("origin") !== req.nextUrl.origin) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  return NextResponse.json(await dispatchPaymentEmails());
}
