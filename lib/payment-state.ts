const PAID_SUBSCRIPTION_STATUSES = new Set(["active", "past_due"]);

const PAYMENT_ATTEMPT_PARAM_NAMES = [
  "attempt",
  "paymentAttempt",
  "payment_attempt",
  "Order",
  "order",
  "uniqueid",
  "uniqueID",
  "uniqueId",
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

function firstParam(params: URLSearchParams, names: string[]): string | null {
  for (const name of names) {
    const value = params.get(name)?.trim();
    if (value) return value;
  }
  return null;
}

export function getHypResponseCode(params: URLSearchParams): string | null {
  return firstParam(params, ["CCode", "ccode", "errorCode", "errorcode", "status", "result"]);
}

export function getHypTransactionId(params: URLSearchParams): string | null {
  return firstParam(params, ["Id", "id", "txId", "txid", "cgUid", "cguid", "tranId", "transactionId"]);
}

export function getHypAuthCode(params: URLSearchParams): string | null {
  return firstParam(params, ["ACode", "authNumber", "authNo"]);
}

export function getHypCardMask(params: URLSearchParams): string | null {
  return firstParam(params, ["L4digit", "cardMask", "cardmask"]);
}

export function isSuccessfulHypReturn(params: URLSearchParams): boolean {
  const legacyCode = params.get("CCode") ?? params.get("ccode");
  if (legacyCode !== null) return legacyCode === "0";

  const modernCode = params.get("errorCode") ?? params.get("errorcode");
  if (modernCode !== null) return modernCode === "" || modernCode === "000" || modernCode === "0";

  const status = params.get("status") ?? params.get("result");
  if (status !== null) return status === "000" || status === "0";

  // CreditGuard redirects to successUrl after a successful payment. Some
  // success redirects include responseMac but omit errorCode entirely.
  return params.has("responseMac");
}

export function toHypVerificationParams(returnQuery: URLSearchParams): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of returnQuery.entries()) {
    if (LOCAL_ONLY_RETURN_PARAMS.has(key)) continue;
    params.append(key, value);
  }
  return params;
}
