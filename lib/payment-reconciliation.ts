import type { SupabaseClient } from "@supabase/supabase-js";

type HypPaymentInquiry = {
  outcome: "charged" | "not_charged" | "not_found" | "unknown";
  hypTransactionId: string;
  hypAuthCode: string;
  hypCardMask: string;
  hypResponseCode: string;
  amountAgorot: number | null;
  rawXml: string;
};

type PaymentAttempt = {
  id: string;
  status: string;
  amount_agorot: number;
  reconciliation_attempt_count?: number;
};

export const DEFAULT_RECONCILIATION_MAX_ATTEMPTS = 5;
export const DEFAULT_RECONCILIATION_LEASE_SECONDS = 10 * 60;

export type ReconciliationStatus =
  | "settled"
  | "failed"
  | "pending"
  | "skipped"
  | "error";

export type ReconciliationResult = {
  attemptId: string;
  status: ReconciliationStatus;
  reason: string;
};

type InquiryFn = (attemptId: string) => Promise<HypPaymentInquiry>;

type ReconciliationRetryDisposition = {
  nextRetryAt: string | null;
  escalated: boolean;
};

export async function claimHypPaymentAttempts(
  admin: SupabaseClient,
  options: {
    createdBefore: string;
    limit: number;
    maxAttempts: number;
    leaseSeconds: number;
  },
): Promise<PaymentAttempt[]> {
  const { data, error } = await admin.rpc(
    "claim_payment_attempts_for_reconciliation",
    {
      p_created_before: options.createdBefore,
      p_limit: options.limit,
      p_max_attempts: options.maxAttempts,
      p_lease_seconds: options.leaseSeconds,
    },
  );
  if (error) throw new Error(error.message);
  return (data ?? []) as PaymentAttempt[];
}

export function getReconciliationRetryDisposition(
  attemptNumber: number,
  maxAttempts: number,
  now = new Date(),
): ReconciliationRetryDisposition {
  if (attemptNumber >= maxAttempts) {
    return { nextRetryAt: null, escalated: true };
  }

  const delayMinutes = Math.min(15 * 4 ** Math.max(attemptNumber - 1, 0), 24 * 60);
  return {
    nextRetryAt: new Date(now.getTime() + delayMinutes * 60_000).toISOString(),
    escalated: false,
  };
}

function failPendingPaymentAttempt(
  admin: SupabaseClient,
  attemptId: string,
  update: {
    status: "failed";
    hyp_response_code: string;
    raw_return: Record<string, string>;
    completed_at: string;
  },
) {
  return admin
    .from("payment_attempts")
    .update(update)
    .eq("id", attemptId)
    .eq("status", "pending");
}

function rawInquiryJson(inquiry: HypPaymentInquiry): Record<string, string> {
  return {
    reconciliation: "hyp_inquiry",
    outcome: inquiry.outcome,
    hypTransactionId: inquiry.hypTransactionId,
    hypResponseCode: inquiry.hypResponseCode,
    amountAgorot: inquiry.amountAgorot === null ? "" : String(inquiry.amountAgorot),
  };
}

async function recordReconciliationOutcome(
  admin: SupabaseClient,
  attempt: PaymentAttempt,
  outcome: string,
  reason: string,
  disposition: ReconciliationRetryDisposition,
): Promise<string | null> {
  const { error } = await admin.rpc("record_payment_reconciliation_outcome", {
    p_attempt_id: attempt.id,
    p_attempt_number: attempt.reconciliation_attempt_count ?? 1,
    p_outcome: outcome,
    p_reason: reason,
    p_next_retry_at: disposition.nextRetryAt,
    p_escalated: disposition.escalated,
  });
  return error?.message ?? null;
}

async function leavePendingForRetry(
  admin: SupabaseClient,
  attempt: PaymentAttempt,
  outcome: string,
  reason: string,
  maxAttempts: number,
): Promise<ReconciliationResult> {
  const disposition = getReconciliationRetryDisposition(
    attempt.reconciliation_attempt_count ?? 1,
    maxAttempts,
  );
  const auditError = await recordReconciliationOutcome(
    admin,
    attempt,
    outcome,
    reason,
    disposition,
  );
  if (auditError) {
    return {
      attemptId: attempt.id,
      status: "error",
      reason: `audit_failed:${auditError}`,
    };
  }
  if (disposition.escalated) {
    return {
      attemptId: attempt.id,
      status: "error",
      reason: `retry_exhausted:${reason}`,
    };
  }
  return { attemptId: attempt.id, status: "pending", reason };
}

export async function reconcileHypPaymentAttempt(
  admin: SupabaseClient,
  attempt: PaymentAttempt,
  inquirePayment: InquiryFn,
  maxAttempts = DEFAULT_RECONCILIATION_MAX_ATTEMPTS,
): Promise<ReconciliationResult> {
  if (attempt.status === "succeeded") {
    return { attemptId: attempt.id, status: "skipped", reason: "already_succeeded" };
  }
  if (attempt.status !== "pending") {
    return { attemptId: attempt.id, status: "skipped", reason: `terminal_${attempt.status}` };
  }

  let inquiry: HypPaymentInquiry;
  try {
    inquiry = await inquirePayment(attempt.id);
  } catch (caught) {
    return leavePendingForRetry(
      admin,
      attempt,
      "transport_error",
      caught instanceof Error ? caught.message : "inquiry_unavailable",
      maxAttempts,
    );
  }

  if (inquiry.outcome === "charged") {
    if (
      inquiry.amountAgorot !== null &&
      inquiry.amountAgorot !== attempt.amount_agorot
    ) {
      const auditError = await recordReconciliationOutcome(
        admin,
        attempt,
        "amount_mismatch",
        "amount_mismatch",
        { nextRetryAt: null, escalated: true },
      );
      return {
        attemptId: attempt.id,
        status: "error",
        reason: auditError ? `audit_failed:${auditError}` : "amount_mismatch",
      };
    }

    const { error } = await admin.rpc("settle_payment_attempt", {
      p_attempt_id: attempt.id,
      p_hyp_transaction_id: inquiry.hypTransactionId,
      p_hyp_auth_code: inquiry.hypAuthCode,
      p_hyp_card_mask: inquiry.hypCardMask,
      p_hyp_response_code: inquiry.hypResponseCode || "000",
      p_raw_return: rawInquiryJson(inquiry),
    });
    if (error) {
      return leavePendingForRetry(
        admin,
        attempt,
        "settlement_error",
        error.message,
        maxAttempts,
      );
    }

    const auditError = await recordReconciliationOutcome(
      admin,
      attempt,
      "charged",
      "charged",
      { nextRetryAt: null, escalated: false },
    );
    if (auditError) {
      return {
        attemptId: attempt.id,
        status: "error",
        reason: `audit_failed:${auditError}`,
      };
    }

    return { attemptId: attempt.id, status: "settled", reason: "charged" };
  }

  if (inquiry.outcome === "not_charged") {
    const { data: failedAttempt, error } = await failPendingPaymentAttempt(admin, attempt.id, {
      status: "failed",
      hyp_response_code: inquiry.hypResponseCode || "not_charged",
      raw_return: rawInquiryJson(inquiry),
      completed_at: new Date().toISOString(),
    })
      .select("id")
      .maybeSingle();
    if (error) {
      return { attemptId: attempt.id, status: "error", reason: error.message };
    }

    if (!failedAttempt) {
      const auditError = await recordReconciliationOutcome(
        admin,
        attempt,
        "skipped_terminal",
        "status_changed_during_reconciliation",
        { nextRetryAt: null, escalated: false },
      );
      return {
        attemptId: attempt.id,
        status: auditError ? "error" : "skipped",
        reason: auditError
          ? `audit_failed:${auditError}`
          : "status_changed_during_reconciliation",
      };
    }

    const auditError = await recordReconciliationOutcome(
      admin,
      attempt,
      "not_charged",
      "not_charged",
      { nextRetryAt: null, escalated: false },
    );
    if (auditError) {
      return {
        attemptId: attempt.id,
        status: "error",
        reason: `audit_failed:${auditError}`,
      };
    }

    return { attemptId: attempt.id, status: "failed", reason: "not_charged" };
  }

  return leavePendingForRetry(
    admin,
    attempt,
    inquiry.outcome,
    inquiry.outcome,
    maxAttempts,
  );
}
