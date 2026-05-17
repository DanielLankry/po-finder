import test from "node:test";
import assert from "node:assert/strict";

import {
  getPaymentAttemptId,
  hasPaidSubscriptionStatus,
  toHypVerificationParams,
} from "../lib/payment-state.ts";

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
});

test("HYP verification params exclude local-only callback params", () => {
  const params = new URLSearchParams("attempt=local-id&Order=hyp-order&CCode=0&signature=abc");
  const verifiable = toHypVerificationParams(params);

  assert.equal(verifiable.get("attempt"), null);
  assert.equal(verifiable.get("Order"), "hyp-order");
  assert.equal(verifiable.get("CCode"), "0");
  assert.equal(verifiable.get("signature"), "abc");
});
