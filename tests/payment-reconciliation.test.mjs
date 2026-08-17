import test from "node:test";
import assert from "node:assert/strict";

import { parseHypPaymentInquiry } from "../lib/hyp-inquiry.ts";
import { reconcileHypPaymentAttempt } from "../lib/payment-reconciliation.ts";

const ATTEMPT_ID = "34a33035-4275-42f8-9963-ea59adcf9445";

test("charged payment without browser return is settled from HYP inquiry", async () => {
  const admin = createAdminClient();
  const attempt = pendingAttempt();
  const inquiry = parseHypPaymentInquiry(successInquiryXml());

  const result = await reconcileHypPaymentAttempt(admin, attempt, async () => inquiry);

  assert.deepEqual(result, {
    attemptId: ATTEMPT_ID,
    status: "settled",
    reason: "charged",
  });
  assert.equal(admin.rpcCalls.length, 1);
  assert.equal(admin.rpcCalls[0].name, "settle_payment_attempt");
  assert.equal(admin.rpcCalls[0].args.p_attempt_id, ATTEMPT_ID);
  assert.equal(admin.rpcCalls[0].args.p_hyp_transaction_id, "tx-123");
  assert.equal(admin.rpcCalls[0].args.p_hyp_auth_code, "4760370");
  assert.equal(admin.rpcCalls[0].args.p_hyp_card_mask, "411111******1111");
});

test("negative HYP inquiry fails only the matching pending attempt", async () => {
  const row = pendingAttempt();
  const admin = createAdminClient(row);

  const result = await reconcileHypPaymentAttempt(admin, row, async () => ({
    outcome: "not_charged",
    hypTransactionId: "tx-123",
    hypAuthCode: "",
    hypCardMask: "",
    hypResponseCode: "003",
    amountAgorot: 1500,
    rawXml: "<ashrait />",
  }));

  assert.deepEqual(result, {
    attemptId: ATTEMPT_ID,
    status: "failed",
    reason: "not_charged",
  });
  assert.equal(row.status, "failed");
  assert.equal(row.hyp_response_code, "003");
  assert.equal(admin.rpcCalls.length, 0);
});

test("transient HYP inquiry failure leaves pending attempt retryable", async () => {
  const row = pendingAttempt();
  const admin = createAdminClient(row);

  const result = await reconcileHypPaymentAttempt(admin, row, async () => {
    throw new Error("HYP inquiry HTTP 503");
  });

  assert.deepEqual(result, {
    attemptId: ATTEMPT_ID,
    status: "pending",
    reason: "HYP inquiry HTTP 503",
  });
  assert.equal(row.status, "pending");
  assert.equal(admin.rpcCalls.length, 0);
});

test("duplicate reconciliation skips already-succeeded attempts", async () => {
  const admin = createAdminClient();
  let inquiryCalls = 0;

  const result = await reconcileHypPaymentAttempt(
    admin,
    { ...pendingAttempt(), status: "succeeded" },
    async () => {
      inquiryCalls += 1;
      throw new Error("should not inquire");
    },
  );

  assert.deepEqual(result, {
    attemptId: ATTEMPT_ID,
    status: "skipped",
    reason: "already_succeeded",
  });
  assert.equal(inquiryCalls, 0);
  assert.equal(admin.rpcCalls.length, 0);
});

function pendingAttempt() {
  return {
    id: ATTEMPT_ID,
    status: "pending",
    amount_agorot: 1500,
  };
}

function successInquiryXml() {
  return `<?xml version='1.0'?>
<ashrait>
  <response>
    <result>000</result>
    <inquireTransactions>
      <transactions>
        <transaction>
          <status>000</status>
          <validation>TxnSetup</validation>
          <total>1500</total>
          <cgUid>setup-123</cgUid>
        </transaction>
        <transaction>
          <status>000</status>
          <statusText>Permitted transaction</statusText>
          <validation>AutoComm</validation>
          <total>1500</total>
          <authNumber>4760370</authNumber>
          <cardMask>411111******1111</cardMask>
          <mpiTransactionId>tx-123</mpiTransactionId>
        </transaction>
      </transactions>
    </inquireTransactions>
  </response>
</ashrait>`;
}

function createAdminClient(row = null) {
  const client = {
    rpcCalls: [],
    rpc(name, args) {
      this.rpcCalls.push({ name, args });
      return Promise.resolve({ data: { ok: true }, error: null });
    },
    from(table) {
      assert.equal(table, "payment_attempts");
      return {
        update(update) {
          const filters = [];
          return {
            eq(column, value) {
              filters.push([column, value]);
              return this;
            },
            then(resolve, reject) {
              const matches = row && filters.every(([column, value]) => row[column] === value);
              if (matches) Object.assign(row, update);
              return Promise.resolve({ error: null }).then(resolve, reject);
            },
          };
        },
      };
    },
  };
  return client;
}
