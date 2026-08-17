import type { SupabaseClient } from "@supabase/supabase-js";

type PaymentFailureUpdate = {
  status: "failed";
  hyp_response_code: string;
  raw_return: Record<string, string>;
  completed_at: string;
};

export function getValidPaymentAttemptId(value: string | null): string | null {
  if (!value) return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

/** A delayed negative callback or inquiry must never downgrade a terminal attempt. */
export function failPendingPaymentAttempt(
  admin: SupabaseClient,
  attemptId: string,
  update: PaymentFailureUpdate,
) {
  return admin
    .from("payment_attempts")
    .update(update)
    .eq("id", attemptId)
    .eq("status", "pending");
}
