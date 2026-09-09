import { NextRequest, NextResponse } from "next/server";
import { dispatchPaymentEmails } from "@/lib/payment-email-outbox";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "cron_not_configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await dispatchPaymentEmails();
  return NextResponse.json(result, { status: result.failed ? 503 : 200 });
}
