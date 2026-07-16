const PAID_SUBSCRIPTION_STATUSES = new Set(["active", "past_due"]);

const LOCAL_PAYMENT_ATTEMPT_PARAM_NAMES = [
  "attempt",
  "paymentAttempt",
  "payment_attempt",
];

const PROVIDER_PAYMENT_ATTEMPT_PARAM_NAMES = [
  "Order",
  "order",
  "uniqueid",
  "uniqueID",
  "uniqueId",
  "UniqueId",
];

const PAYMENT_ATTEMPT_PARAM_NAMES = [
  ...LOCAL_PAYMENT_ATTEMPT_PARAM_NAMES,
  ...PROVIDER_PAYMENT_ATTEMPT_PARAM_NAMES,
];

const LOCAL_ONLY_RETURN_PARAMS = new Set([
  "attempt",
  "paymentAttempt",
  "payment_attempt",
]);

const HYP_RETURN_SIGNAL_PARAM_NAMES = [
  "CCode",
  "ccode",
  "errorCode",
  "errorcode",
  "status",
  "result",
  "responseMac",
  "Id",
  "id",
  "txId",
  "txid",
  "cgUid",
  "cguid",
  "tranId",
  "transactionId",
  "ACode",
  "authNumber",
  "authNo",
  "L4digit",
  "cardMask",
  "cardmask",
];

const PAYMENT_RETURN_AUDIT_PARAM_NAMES = new Set([
  ...PAYMENT_ATTEMPT_PARAM_NAMES,
  "CCode",
  "ccode",
  "errorCode",
  "errorcode",
  "status",
  "result",
  "Id",
  "id",
  "txId",
  "txid",
  "cgUid",
  "cguid",
  "tranId",
  "transactionId",
  "L4digit",
  "cardMask",
  "cardmask",
  "Amount",
  "amount",
  "Coin",
  "currency",
]);

const MAX_PAYMENT_AUDIT_VALUE_LENGTH = 256;
const CARD_MASK_PARAM_NAMES = new Set(["L4digit", "cardMask", "cardmask"]);

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

/** Returns the order identifier carried by HYP rather than our return URL. */
export function getProviderPaymentAttemptId(params: URLSearchParams): string | null {
  for (const name of PROVIDER_PAYMENT_ATTEMPT_PARAM_NAMES) {
    const value = params.get(name)?.trim();
    if (value) return value;
  }
  return null;
}

/**
 * Binds the local return URL to HYP's signed order identifier. Every supplied
 * alias (including duplicate query keys) must agree, and a provider alias is
 * required, so a valid callback cannot be replayed against another attempt.
 */
export function getBoundPaymentAttemptId(params: URLSearchParams): string | null {
  const providerId = getProviderPaymentAttemptId(params);
  if (!providerId) return null;

  const suppliedIds = PAYMENT_ATTEMPT_PARAM_NAMES.flatMap((name) =>
    params.getAll(name).map((value) => value.trim()).filter(Boolean)
  );
  return suppliedIds.every((value) => value === providerId) ? providerId : null;
}

/**
 * Detects HYP completion redirects that landed on a page route instead of the
 * payment API so proxy.ts can forward them into the normal settlement handler.
 */
export function hasHypPaymentReturnParams(params: URLSearchParams): boolean {
  if (!getPaymentAttemptId(params)) return false;
  return HYP_RETURN_SIGNAL_PARAM_NAMES.some((name) => params.has(name));
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
  const value = firstParam(params, ["L4digit", "cardMask", "cardmask"]);
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits ? digits.slice(-4) : null;
}

/**
 * Keeps only bounded, non-secret fields for payment support diagnostics.
 * Provider MACs, card tokens, personal IDs, expiries, and arbitrary callback
 * metadata are deliberately excluded after they have served verification.
 */
export function getPaymentReturnAuditSnapshot(
  params: URLSearchParams,
): Record<string, string> {
  const snapshot: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    if (!PAYMENT_RETURN_AUDIT_PARAM_NAMES.has(key)) continue;
    if (CARD_MASK_PARAM_NAMES.has(key)) {
      const lastFour = getHypCardMask(new URLSearchParams([[key, value]]));
      if (lastFour) snapshot[key] = lastFour;
      continue;
    }
    snapshot[key] = value.slice(0, MAX_PAYMENT_AUDIT_VALUE_LENGTH);
  }
  return snapshot;
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
