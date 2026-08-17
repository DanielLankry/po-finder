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
};

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

export async function reconcileHypPaymentAttempt(
  admin: SupabaseClient,
  attempt: PaymentAttempt,
  inquirePayment: InquiryFn,
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
    return {
      attemptId: attempt.id,
      status: "pending",
      reason: caught instanceof Error ? caught.message : "inquiry_unavailable",
    };
  }

  if (inquiry.outcome === "charged") {
    if (
      inquiry.amountAgorot !== null &&
      inquiry.amountAgorot !== attempt.amount_agorot
    ) {
      return {
        attemptId: attempt.id,
        status: "error",
        reason: "amount_mismatch",
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
      return { attemptId: attempt.id, status: "pending", reason: error.message };
    }

    return { attemptId: attempt.id, status: "settled", reason: "charged" };
  }

  if (inquiry.outcome === "not_charged") {
    const { error } = await failPendingPaymentAttempt(admin, attempt.id, {
      status: "failed",
      hyp_response_code: inquiry.hypResponseCode || "not_charged",
      raw_return: rawInquiryJson(inquiry),
      completed_at: new Date().toISOString(),
    });
    if (error) {
      return { attemptId: attempt.id, status: "error", reason: error.message };
    }

    return { attemptId: attempt.id, status: "failed", reason: "not_charged" };
  }

  return { attemptId: attempt.id, status: "pending", reason: inquiry.outcome };
}
