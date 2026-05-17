const PAID_SUBSCRIPTION_STATUSES = new Set(["active", "past_due"]);

const PAYMENT_ATTEMPT_PARAM_NAMES = [
  "attempt",
  "paymentAttempt",
  "payment_attempt",
  "Order",
  "order",
  "uniqueid",
  "UniqueId",
];

const LOCAL_ONLY_RETURN_PARAMS = new Set([
  "attempt",
  "paymentAttempt",
  "payment_attempt",
]);

export function hasPaidSubscriptionStatus(status: string | null | undefined): boolean {
  return PAID_SUBSCRIPTION_STATUSES.has(status ?? "");
}

export function getPaymentAttemptId(params: URLSearchParams): string | null {
  for (const name of PAYMENT_ATTEMPT_PARAM_NAMES) {
    const value = params.get(name)?.trim();
    if (value) return value;
  }
  return null;
}

export function toHypVerificationParams(returnQuery: URLSearchParams): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of returnQuery.entries()) {
    if (LOCAL_ONLY_RETURN_PARAMS.has(key)) continue;
    params.append(key, value);
  }
  return params;
}
