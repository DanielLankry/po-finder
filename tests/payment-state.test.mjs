import test from "node:test";
import assert from "node:assert/strict";

import {
  getBoundPaymentAttemptId,
  getPaymentAttemptId,
  getProviderPaymentAttemptId,
  getPaymentReturnAuditSnapshot,
  getHypAuthCode,
  getHypCardMask,
  getHypResponseCode,
  getHypTransactionId,
  hasPaidSubscriptionStatus,
  hasHypPaymentReturnParams,
  isSuccessfulHypReturn,
  toHypVerificationParams,
} from "../lib/payment-state.ts";
import { publicUserInsertFromAuthUser } from "../lib/user-profile.ts";

test("active and past_due subscription statuses grant paid access", () => {
  assert.equal(hasPaidSubscriptionStatus("active"), true);
  assert.equal(hasPaidSubscriptionStatus("past_due"), true);
  assert.equal(hasPaidSubscriptionStatus("inactive"), false);
  assert.equal(hasPaidSubscriptionStatus(null), false);
});

test("payment return attempt id can come from our callback URL or HYP aliases", () => {
  assert.equal(getPaymentAttemptId(new URLSearchParams("attempt=local-id")), "local-id");
  assert.equal(getPaymentAttemptId(new URLSearchParams("Order=hyp-order")), "hyp-order");
  assert.equal(getPaymentAttemptId(new URLSearchParams("order=lower-order")), "lower-order");
  assert.equal(getPaymentAttemptId(new URLSearchParams("uniqueid=hyp-unique")), "hyp-unique");
  assert.equal(getPaymentAttemptId(new URLSearchParams("uniqueID=hyp-modern")), "hyp-modern");
});

test("payment settlement requires one matching provider-bound attempt id", () => {
  assert.equal(
    getBoundPaymentAttemptId(
      new URLSearchParams("attempt=attempt-1&Order=attempt-1&uniqueid=attempt-1")
    ),
    "attempt-1",
  );
  assert.equal(getProviderPaymentAttemptId(new URLSearchParams("attempt=local&Order=signed")), "signed");
  assert.equal(getBoundPaymentAttemptId(new URLSearchParams("attempt=attempt-1")), null);
  assert.equal(
    getBoundPaymentAttemptId(new URLSearchParams("attempt=expensive&Order=cheap")),
    null,
  );
  assert.equal(
    getBoundPaymentAttemptId(new URLSearchParams("Order=attempt-1&Order=attempt-2")),
    null,
  );
});

test("HYP completion redirects can be detected when they land on a page route", () => {
  assert.equal(
    hasHypPaymentReturnParams(new URLSearchParams("uniqueID=attempt-1&responseMac=mac&txId=tx-1")),
    true,
  );
  assert.equal(
    hasHypPaymentReturnParams(new URLSearchParams("Order=attempt-2&CCode=0&Id=legacy-1")),
    true,
  );
  assert.equal(hasHypPaymentReturnParams(new URLSearchParams("reason=no_subscription")), false);
  assert.equal(hasHypPaymentReturnParams(new URLSearchParams("Order=sort-value")), false);
});

test("HYP verification params exclude local-only callback params", () => {
  const params = new URLSearchParams("attempt=local-id&Order=hyp-order&CCode=0&signature=abc");
  const verifiable = toHypVerificationParams(params);

  assert.equal(verifiable.get("attempt"), null);
  assert.equal(verifiable.get("Order"), "hyp-order");
  assert.equal(verifiable.get("CCode"), "0");
  assert.equal(verifiable.get("signature"), "abc");
});

test("HYP return helpers understand legacy and CreditGuard callback fields", () => {
  const legacy = new URLSearchParams("CCode=0&Id=legacy-trans&ACode=auth-1&L4digit=1234");
  assert.equal(isSuccessfulHypReturn(legacy), true);
  assert.equal(getHypResponseCode(legacy), "0");
  assert.equal(getHypTransactionId(legacy), "legacy-trans");
  assert.equal(getHypAuthCode(legacy), "auth-1");
  assert.equal(getHypCardMask(legacy), "1234");

  const modern = new URLSearchParams(
    "responseMac=mac&errorCode=000&txId=tx-1&authNumber=auth-2&cardMask=411111******1111",
  );
  assert.equal(isSuccessfulHypReturn(modern), true);
  assert.equal(getHypResponseCode(modern), "000");
  assert.equal(getHypTransactionId(modern), "tx-1");
  assert.equal(getHypAuthCode(modern), "auth-2");
  assert.equal(getHypCardMask(modern), "1111");

  assert.equal(isSuccessfulHypReturn(new URLSearchParams("CCode=1")), false);
  assert.equal(isSuccessfulHypReturn(new URLSearchParams("responseMac=mac&errorCode=101")), false);
  assert.equal(isSuccessfulHypReturn(new URLSearchParams("")), false);
});

test("payment audit snapshots exclude provider secrets and arbitrary metadata", () => {
  const params = new URLSearchParams({
    uniqueid: "attempt-1",
    txId: "transaction-1",
    errorCode: "000",
    cardMask: "4111111111111111",
    responseMac: "replayable-mac",
    cardToken: "provider-card-token",
    cardExp: "0129",
    personalId: "sensitive-id",
    ACode: "provider-auth-code",
    attackerControlled: "do-not-store",
  });

  assert.deepEqual(getPaymentReturnAuditSnapshot(params), {
    uniqueid: "attempt-1",
    txId: "transaction-1",
    errorCode: "000",
    cardMask: "1111",
  });
  assert.doesNotMatch(JSON.stringify(getPaymentReturnAuditSnapshot(params)), /4111111111111111/);
});

test("missing public profile can be created from an authenticated checkout user", () => {
  const row = publicUserInsertFromAuthUser(
    {
      id: "user-123",
      email: "owner@example.com",
      user_metadata: {
        full_name: "Owner Name",
      },
    },
    "business_owner",
  );

  assert.deepEqual(row, {
    id: "user-123",
    email: "owner@example.com",
    role: "business_owner",
    name: "Owner Name",
  });
});
