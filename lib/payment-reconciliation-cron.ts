import type { SupabaseClient } from "@supabase/supabase-js";

type PendingPaymentAttempt = {
  id: string;
  status: string;
  amount_agorot: number;
  reconciliation_attempt_count?: number;
};

type ReconciliationResult = {
  attemptId: string;
  status: "settled" | "failed" | "pending" | "skipped" | "error";
  reason: string;
};

type ClaimOptions = {
  createdBefore: string;
  limit: number;
  maxAttempts: number;
  leaseSeconds: number;
};

type CronRequest = {
  authorization: string | null;
  cronSecret: string | undefined;
  requestedLimit: string | null;
  configuredLimit: string | undefined;
  configuredMinAgeMinutes: string | undefined;
  configuredMaxAttempts: string | undefined;
  configuredLeaseSeconds: string | undefined;
};

type CronDependencies = {
  assertHypEnterpriseConfigured: () => unknown;
  getAdminClient: () => SupabaseClient;
  claimAttempts: (
    admin: SupabaseClient,
    options: ClaimOptions,
  ) => Promise<PendingPaymentAttempt[]>;
  reconcileAttempt: (
    admin: SupabaseClient,
    attempt: PendingPaymentAttempt,
    maxAttempts: number,
  ) => Promise<ReconciliationResult>;
  captureError: (result: ReconciliationResult) => void;
  defaultMaxAttempts: number;
  defaultLeaseSeconds: number;
  now?: () => number;
};

type CronResponse = {
  status: number;
  body: Record<string, unknown>;
};

const DEFAULT_MIN_AGE_MINUTES = 15;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export async function handlePaymentReconciliationCron(
  request: CronRequest,
  dependencies: CronDependencies,
): Promise<CronResponse> {
  if (!request.cronSecret) {
    return { status: 503, body: { error: "cron_not_configured" } };
  }
  if (request.authorization !== `Bearer ${request.cronSecret}`) {
    return { status: 401, body: { error: "unauthorized" } };
  }

  try {
    dependencies.assertHypEnterpriseConfigured();
  } catch (caught) {
    return {
      status: 503,
      body: {
        error: "hyp_inquiry_not_configured",
        detail: caught instanceof Error ? caught.message : String(caught),
      },
    };
  }

  const minAgeMinutes = positiveInteger(
    request.configuredMinAgeMinutes,
    DEFAULT_MIN_AGE_MINUTES,
  );
  const requestedLimit = Number(request.requestedLimit);
  const limit = Math.min(
    Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.floor(requestedLimit)
      : positiveInteger(request.configuredLimit, DEFAULT_LIMIT),
    MAX_LIMIT,
  );
  const createdBefore = new Date(
    (dependencies.now?.() ?? Date.now()) - minAgeMinutes * 60_000,
  ).toISOString();
  const maxAttempts = positiveInteger(
    request.configuredMaxAttempts,
    dependencies.defaultMaxAttempts,
  );
  const leaseSeconds = positiveInteger(
    request.configuredLeaseSeconds,
    dependencies.defaultLeaseSeconds,
  );

  const admin = dependencies.getAdminClient();
  let attempts: PendingPaymentAttempt[];
  try {
    attempts = await dependencies.claimAttempts(admin, {
      createdBefore,
      limit,
      maxAttempts,
      leaseSeconds,
    });
  } catch (caught) {
    return {
      status: 500,
      body: {
        error: "payment_claim_failed",
        detail: caught instanceof Error ? caught.message : String(caught),
      },
    };
  }

  const results: ReconciliationResult[] = [];
  for (const attempt of attempts) {
    const result = await dependencies.reconcileAttempt(
      admin,
      attempt,
      maxAttempts,
    );
    results.push(result);

    if (result.status === "error") {
      dependencies.captureError(result);
    }
  }

  return {
    status: 200,
    body: {
      ok: true,
      checked: results.length,
      settled: results.filter((result) => result.status === "settled").length,
      failed: results.filter((result) => result.status === "failed").length,
      pending: results.filter((result) => result.status === "pending").length,
      errors: results.filter((result) => result.status === "error").length,
      results,
    },
  };
}
