import test from "node:test";
import assert from "node:assert/strict";

import { parseHypPaymentInquiry } from "../lib/hyp-inquiry.ts";
import {
  claimHypPaymentAttempts,
  getReconciliationRetryDisposition,
  reconcileHypPaymentAttempt,
} from "../lib/payment-reconciliation.ts";

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
  assert.equal(admin.rpcCalls.length, 2);
  assert.equal(admin.rpcCalls[0].name, "settle_payment_attempt");
  assert.equal(admin.rpcCalls[0].args.p_attempt_id, ATTEMPT_ID);
  assert.equal(admin.rpcCalls[0].args.p_hyp_transaction_id, "119187092");
  assert.equal(admin.rpcCalls[0].args.p_hyp_auth_code, "4760370");
  assert.equal(admin.rpcCalls[0].args.p_hyp_card_mask, "411111******1111");
  assert.equal(admin.rpcCalls[1].name, "record_payment_reconciliation_outcome");
  assert.equal(admin.rpcCalls[1].args.p_outcome, "charged");
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
  assert.equal(admin.rpcCalls.length, 1);
  assert.equal(admin.rpcCalls[0].name, "record_payment_reconciliation_outcome");
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
  assert.equal(admin.rpcCalls.length, 1);
  assert.equal(admin.rpcCalls[0].args.p_outcome, "transport_error");
  assert.equal(admin.rpcCalls[0].args.p_escalated, false);
  assert.ok(admin.rpcCalls[0].args.p_next_retry_at);
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

test("negative inquiry cannot overwrite a concurrent successful return", async () => {
  const storedRow = { ...pendingAttempt(), status: "succeeded" };
  const admin = createAdminClient(storedRow);
  const result = await reconcileHypPaymentAttempt(
    admin,
    pendingAttempt(),
    async () => ({
      outcome: "not_charged",
      hypTransactionId: "119187092",
      hypAuthCode: "",
      hypCardMask: "",
      hypResponseCode: "003",
      amountAgorot: 1500,
      rawXml: "<ashrait />",
    }),
  );

  assert.equal(result.status, "skipped");
  assert.equal(result.reason, "status_changed_during_reconciliation");
  assert.equal(storedRow.status, "succeeded");
  assert.equal(admin.rpcCalls[0].args.p_outcome, "skipped_terminal");
});

test("cancelled or refunded inquiry rows never grant entitlement", () => {
  const cancelled = parseHypPaymentInquiry(cancelledInquiryXml());
  const refunded = parseHypPaymentInquiry(refundedInquiryXml());

  assert.equal(cancelled.outcome, "not_charged");
  assert.equal(cancelled.hypResponseCode, "reversed");
  assert.equal(refunded.outcome, "not_charged");
  assert.equal(refunded.hypResponseCode, "reversed");
});

test("captured inquiry preserves debit tranId for the refund flow", () => {
  const inquiry = parseHypPaymentInquiry(successInquiryXml());

  assert.equal(inquiry.outcome, "charged");
  assert.equal(inquiry.hypTransactionId, "119187092");
  assert.notEqual(inquiry.hypTransactionId, "tx-123");
});

test("retry schedule escalates at the configured cap", async () => {
  const now = new Date("2026-08-17T09:00:00.000Z");
  assert.deepEqual(getReconciliationRetryDisposition(1, 5, now), {
    nextRetryAt: "2026-08-17T09:15:00.000Z",
    escalated: false,
  });
  assert.deepEqual(getReconciliationRetryDisposition(5, 5, now), {
    nextRetryAt: null,
    escalated: true,
  });

  const admin = createAdminClient();
  const result = await reconcileHypPaymentAttempt(
    admin,
    { ...pendingAttempt(), reconciliation_attempt_count: 5 },
    async () => {
      throw new Error("HYP inquiry HTTP 503");
    },
    5,
  );

  assert.equal(result.status, "error");
  assert.equal(result.reason, "retry_exhausted:HYP inquiry HTTP 503");
  assert.equal(admin.rpcCalls[0].args.p_escalated, true);
  assert.equal(admin.rpcCalls[0].args.p_next_retry_at, null);
});

test("concurrent claim calls cannot receive the same payment attempt", async () => {
  const admin = createClaimAdminClient();
  const options = {
    createdBefore: "2026-08-17T09:00:00.000Z",
    limit: 10,
    maxAttempts: 5,
    leaseSeconds: 600,
  };

  const [first, second] = await Promise.all([
    claimHypPaymentAttempts(admin, options),
    claimHypPaymentAttempts(admin, options),
  ]);

  assert.equal(first.length + second.length, 1);
  assert.equal(new Set([...first, ...second].map((attempt) => attempt.id)).size, 1);
});

function pendingAttempt() {
  return {
    id: ATTEMPT_ID,
    status: "pending",
    amount_agorot: 1500,
    reconciliation_attempt_count: 1,
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
          <transactionType code="01">RegularDebit</transactionType>
          <financialStatus>Captured</financialStatus>
          <total>1500</total>
          <authNumber>4760370</authNumber>
          <cardMask>411111******1111</cardMask>
          <mpiTransactionId>tx-123</mpiTransactionId>
          <tranId>119187092</tranId>
        </transaction>
      </transactions>
    </inquireTransactions>
  </response>
</ashrait>`;
}

function cancelledInquiryXml() {
  return `<?xml version='1.0'?>
<ashrait><response><result>000</result><inquireTransactions><transactions>
  <transaction>
    <status>000</status><validation>AutoComm</validation>
    <transactionType code="01">RegularDebit</transactionType>
    <financialStatus>Cancelled</financialStatus><tranId>119187092</tranId>
  </transaction>
</transactions></inquireTransactions></response></ashrait>`;
}

function refundedInquiryXml() {
  return `<?xml version='1.0'?>
<ashrait><response><result>000</result><inquireTransactions><transactions>
  <transaction>
    <status>000</status><validation>AutoComm</validation>
    <transactionType code="01">RegularDebit</transactionType>
    <financialStatus>Transmitted</financialStatus><tranId>119187092</tranId>
  </transaction>
  <transaction>
    <status>000</status><validation>AutoComm</validation>
    <transactionType code="52">Cancel</transactionType>
    <financialStatus>Transmitted</financialStatus><tranId>119187120</tranId>
  </transaction>
</transactions></inquireTransactions></response></ashrait>`;
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
            select() {
              return this;
            },
            maybeSingle() {
              const matches = row && filters.every(([column, value]) => row[column] === value);
              if (matches) Object.assign(row, update);
              return Promise.resolve({
                data: matches ? { id: row.id } : null,
                error: null,
              });
            },
          };
        },
      };
    },
  };
  return client;
}

function createClaimAdminClient() {
  let claimed = false;
  return {
    async rpc(name) {
      assert.equal(name, "claim_payment_attempts_for_reconciliation");
      if (claimed) return { data: [], error: null };
      claimed = true;
      return { data: [pendingAttempt()], error: null };
    },
  };
}
