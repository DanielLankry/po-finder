import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { adminClient } from "@/lib/supabase/admin";
import { inquirePaymentAttempt } from "@/lib/hyp";
import { getHypEnterpriseConfig } from "@/lib/hyp-enterprise-config";
import { handlePaymentReconciliationCron } from "@/lib/payment-reconciliation-cron";
import {
  claimHypPaymentAttempts,
  DEFAULT_RECONCILIATION_LEASE_SECONDS,
  DEFAULT_RECONCILIATION_MAX_ATTEMPTS,
  reconcileHypPaymentAttempt,
} from "@/lib/payment-reconciliation";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const response = await handlePaymentReconciliationCron(
    {
      authorization: request.headers.get("authorization"),
      cronSecret: process.env.CRON_SECRET,
      requestedLimit: request.nextUrl.searchParams.get("limit"),
      configuredLimit: process.env.HYP_RECONCILIATION_LIMIT,
      configuredMinAgeMinutes: process.env.HYP_RECONCILIATION_MIN_AGE_MINUTES,
      configuredMaxAttempts: process.env.HYP_RECONCILIATION_MAX_ATTEMPTS,
      configuredLeaseSeconds: process.env.HYP_RECONCILIATION_LEASE_SECONDS,
    },
    {
      assertHypEnterpriseConfigured: getHypEnterpriseConfig,
      getAdminClient: adminClient,
      claimAttempts: claimHypPaymentAttempts,
      reconcileAttempt: (admin, attempt, maxAttempts) =>
        reconcileHypPaymentAttempt(
          admin,
          attempt,
          inquirePaymentAttempt,
          maxAttempts,
        ),
      captureError: (result) => {
        Sentry.captureMessage("HYP payment reconciliation requires review", {
          level: "error",
          tags: {
            route: "payment-reconciliation",
            attemptId: result.attemptId,
            reason: result.reason,
          },
        });
      },
      defaultMaxAttempts: DEFAULT_RECONCILIATION_MAX_ATTEMPTS,
      defaultLeaseSeconds: DEFAULT_RECONCILIATION_LEASE_SECONDS,
    },
  );

  return NextResponse.json(response.body, { status: response.status });
}
