import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { adminClient } from "@/lib/supabase/admin";
import { inquirePaymentAttempt } from "@/lib/hyp";
import { reconcileHypPaymentAttempt } from "@/lib/payment-reconciliation";

export const runtime = "nodejs";

type PendingPaymentAttempt = {
  id: string;
  status: string;
  amount_agorot: number;
};

const DEFAULT_MIN_AGE_MINUTES = 15;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function numericEnv(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "cron_not_configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const minAgeMinutes = numericEnv(
    "HYP_RECONCILIATION_MIN_AGE_MINUTES",
    DEFAULT_MIN_AGE_MINUTES,
  );
  const requestedLimit = Number(request.nextUrl.searchParams.get("limit"));
  const limit = Math.min(
    Number.isFinite(requestedLimit) && requestedLimit > 0
      ? requestedLimit
      : numericEnv("HYP_RECONCILIATION_LIMIT", DEFAULT_LIMIT),
    MAX_LIMIT,
  );
  const createdBefore = new Date(
    Date.now() - minAgeMinutes * 60_000
  ).toISOString();

  const admin = adminClient();
  const { data, error } = await admin
    .from("payment_attempts")
    .select("id, status, amount_agorot")
    .eq("status", "pending")
    .lt("created_at", createdBefore)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    return NextResponse.json(
      { error: "payment_query_failed", detail: error.message },
      { status: 500 },
    );
  }

  const results = [];
  for (const attempt of (data ?? []) as PendingPaymentAttempt[]) {
    const result = await reconcileHypPaymentAttempt(
      admin,
      attempt,
      inquirePaymentAttempt,
    );
    results.push(result);

    if (result.status === "error") {
      Sentry.captureMessage("HYP payment reconciliation requires review", {
        level: "error",
        tags: {
          route: "payment-reconciliation",
          attemptId: result.attemptId,
          reason: result.reason,
        },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    checked: results.length,
    settled: results.filter((result) => result.status === "settled").length,
    failed: results.filter((result) => result.status === "failed").length,
    pending: results.filter((result) => result.status === "pending").length,
    errors: results.filter((result) => result.status === "error").length,
    results,
  });
}
