import { createHash, timingSafeEqual } from "node:crypto";

function getReturnValue(params: URLSearchParams, names: string[], fallback = ""): string {
  for (const name of names) {
    const value = params.get(name);
    if (value !== null) return value;
  }
  return fallback;
}

function getPaymentAttemptId(params: URLSearchParams): string {
  return getReturnValue(params, [
    "attempt",
    "paymentAttempt",
    "payment_attempt",
    "Order",
    "order",
    "uniqueid",
    "uniqueID",
    "uniqueId",
    "UniqueId",
  ]);
}

/**
 * HYP CreditGuard responseMac formula:
 * password + txId + errorCode(or 000) + cardToken + cardExp + personalId + uniqueId
 * then SHA-256 and Base64.
 */
export function buildCreditGuardResponseMac(
  params: URLSearchParams,
  merchantPassword: string,
): string {
  const txId = getReturnValue(params, ["txId", "txid"]);
  const errorCode = getReturnValue(params, ["errorCode", "errorcode"], "000") || "000";
  const cardToken = getReturnValue(params, ["cardToken", "cardtoken"]);
  const cardExp = getReturnValue(params, ["cardExp", "cardexp"]);
  const personalId = getReturnValue(params, ["personalId", "personalid"]);
  const uniqueId = getPaymentAttemptId(params);

  return createHash("sha256")
    .update(`${merchantPassword}${txId}${errorCode}${cardToken}${cardExp}${personalId}${uniqueId}`, "utf8")
    .digest("base64");
}

export function verifyCreditGuardResponseMac(
  params: URLSearchParams,
  merchantPassword: string,
): boolean {
  const expected = params.get("responseMac");
  if (!expected) return false;

  const actual = buildCreditGuardResponseMac(params, merchantPassword);
  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(actual, "utf8");
  if (expectedBuffer.length !== actualBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, actualBuffer);
}
