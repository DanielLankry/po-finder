import test from "node:test";
import assert from "node:assert/strict";

import {
  buildHypInquiryXml,
  parseHypPaymentInquiry,
  toHypInquiryUser,
} from "../lib/hyp-inquiry.ts";
import { getHypEnterpriseConfig } from "../lib/hyp-enterprise-config.ts";
import { handlePaymentReconciliationCron } from "../lib/payment-reconciliation-cron.ts";
import {
  claimHypPaymentAttempts,
  getReconciliationRetryDisposition,
  reconcileHypPaymentAttempt,
} from "../lib/payment-reconciliation.ts";

const ATTEMPT_ID = "34a33035-4275-42f8-9963-ea59adcf9445";

test("HYP inquiry uses the documented user lookup", () => {
  const xml = buildHypInquiryXml("terminal&1", ATTEMPT_ID);

  assert.match(xml, /<terminalNumber>terminal&amp;1<\/terminalNumber>/);
  assert.match(xml, new RegExp(`<user>${toHypInquiryUser(ATTEMPT_ID)}</user>`));
  assert.doesNotMatch(xml, /<uniqueid>/i);
});

test("charged payment without browser return is settled from HYP inquiry", async () => {
  const admin = createAdminClient();
  const attempt = pendingAttempt();
  const inquiry = parseHypPaymentInquiry(successInquiryXml(), ATTEMPT_ID);

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
    inquiryUser: toHypInquiryUser(ATTEMPT_ID),
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
      inquiryUser: toHypInquiryUser(ATTEMPT_ID),
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
  const cancelled = parseHypPaymentInquiry(cancelledInquiryXml(), ATTEMPT_ID);
  const refunded = parseHypPaymentInquiry(refundedInquiryXml(), ATTEMPT_ID);

  assert.equal(cancelled.outcome, "not_charged");
  assert.equal(cancelled.hypResponseCode, "reversed");
  assert.equal(refunded.outcome, "not_charged");
  assert.equal(refunded.hypResponseCode, "reversed");
});

test("cancelled and captured debits remain pending for review", async () => {
  const row = pendingAttempt();
  const admin = createAdminClient(row);
  const inquiry = parseHypPaymentInquiry(
    transactionInquiryXml([cancelledDebitRow(), debitRow("captured-debit")]),
    ATTEMPT_ID,
  );

  const result = await reconcileHypPaymentAttempt(admin, row, async () => inquiry);

  assert.equal(inquiry.outcome, "unknown");
  assert.equal(inquiry.hypResponseCode, "mixed_financial_state");
  assert.equal(result.status, "pending");
  assert.equal(row.status, "pending");
  assert.equal(
    admin.rpcCalls.some(({ name }) => name === "settle_payment_attempt"),
    false,
  );
});

test("captured debits plus a rejected reversal cannot fail the attempt", async () => {
  const row = pendingAttempt();
  const admin = createAdminClient(row);
  const inquiry = parseHypPaymentInquiry(
    transactionInquiryXml([
      debitRow("first-captured-debit"),
      debitRow("second-captured-debit"),
      reversalRow("rejected-reversal", "101"),
    ]),
    ATTEMPT_ID,
  );

  const result = await reconcileHypPaymentAttempt(admin, row, async () => inquiry);

  assert.equal(inquiry.outcome, "unknown");
  assert.equal(inquiry.hypResponseCode, "multiple_captured_debits");
  assert.equal(result.status, "pending");
  assert.equal(row.status, "pending");
});

test("captured inquiry preserves debit tranId for the refund flow", () => {
  const inquiry = parseHypPaymentInquiry(successInquiryXml(), ATTEMPT_ID);

  assert.equal(inquiry.outcome, "charged");
  assert.equal(inquiry.hypTransactionId, "119187092");
  assert.notEqual(inquiry.hypTransactionId, "tx-123");
});

test("reversal before its debit vetoes automatic settlement", async () => {
  const row = pendingAttempt();
  const admin = createAdminClient(row);
  const inquiry = parseHypPaymentInquiry(
    transactionInquiryXml([reversalRow("reversal-1"), debitRow()]),
    ATTEMPT_ID,
  );

  const result = await reconcileHypPaymentAttempt(admin, row, async () => inquiry);

  assert.equal(inquiry.outcome, "not_charged");
  assert.equal(result.status, "failed");
  assert.equal(
    admin.rpcCalls.some(({ name }) => name === "settle_payment_attempt"),
    false,
  );
});

test("a full reversal vetoes debit regardless of row order", () => {
  const inquiry = parseHypPaymentInquiry(
    transactionInquiryXml([
      reversalRow("failed-reversal", "101"),
      reversalRow("successful-credit", "000", "53", "AuthCredit"),
      debitRow(),
    ]),
    ATTEMPT_ID,
  );

  assert.equal(inquiry.outcome, "not_charged");
  assert.equal(inquiry.hypTransactionId, "successful-credit");
});

test("partial reversal remains pending while money is still charged", async () => {
  const row = pendingAttempt();
  const admin = createAdminClient(row);
  const inquiry = parseHypPaymentInquiry(
    transactionInquiryXml([
      debitRow(),
      reversalRow(
        "partial-credit",
        "000",
        "53",
        "AuthCredit",
        undefined,
        500,
      ),
    ]),
    ATTEMPT_ID,
  );

  const result = await reconcileHypPaymentAttempt(admin, row, async () => inquiry);

  assert.equal(inquiry.outcome, "unknown");
  assert.equal(inquiry.hypResponseCode, "partial_reversal");
  assert.equal(result.status, "pending");
  assert.equal(row.status, "pending");
  assert.equal(
    admin.rpcCalls.some(({ name }) => name === "settle_payment_attempt"),
    false,
  );
});

test("mixed debits and reversals require review unless totals fully offset", () => {
  const inquiry = parseHypPaymentInquiry(
    transactionInquiryXml([
      debitRow(),
      reversalRow("credit-1"),
      debitRow("second-debit"),
    ]),
    ATTEMPT_ID,
  );

  assert.equal(inquiry.outcome, "unknown");
  assert.equal(inquiry.hypResponseCode, "partial_reversal");
});

test("Enterprise inquiry config fails before use when incomplete or unsafe", () => {
  assert.throws(
    () => getHypEnterpriseConfig({}),
    /Missing env: HYP_ENTERPRISE_RELAY_URL/,
  );
  assert.throws(
    () =>
      getHypEnterpriseConfig({
        HYP_ENTERPRISE_RELAY_URL: "http://relay.example.test",
        HYP_ENTERPRISE_USER: "merchant",
        HYP_ENTERPRISE_PASSWORD: "secret",
        HYP_TERMINAL_NUMBER: "1234",
      }),
    /must use HTTPS/,
  );
  assert.deepEqual(
    getHypEnterpriseConfig({
      HYP_ENTERPRISE_RELAY_URL: "https://relay.example.test/inquiry",
      HYP_ENTERPRISE_USER: " merchant ",
      HYP_ENTERPRISE_PASSWORD: " secret ",
      HYP_TERMINAL_NUMBER: " 1234 ",
    }),
    {
      relayUrl: "https://relay.example.test/inquiry",
      user: "merchant",
      password: "secret",
      terminalNumber: "1234",
    },
  );
});

test("invalid Enterprise config returns 503 before any claim RPC", async () => {
  let adminClientCalls = 0;
  let claimCalls = 0;

  const response = await handlePaymentReconciliationCron(
    {
      authorization: "Bearer cron-secret",
      cronSecret: "cron-secret",
      requestedLimit: null,
      configuredLimit: undefined,
      configuredMinAgeMinutes: undefined,
      configuredMaxAttempts: undefined,
      configuredLeaseSeconds: undefined,
    },
    {
      assertHypEnterpriseConfigured: () => getHypEnterpriseConfig({}),
      getAdminClient() {
        adminClientCalls += 1;
        return createAdminClient();
      },
      async claimAttempts() {
        claimCalls += 1;
        return [];
      },
      async reconcileAttempt() {
        throw new Error("must not reconcile");
      },
      captureError() {},
      defaultMaxAttempts: 5,
      defaultLeaseSeconds: 600,
    },
  );

  assert.deepEqual(response, {
    status: 503,
    body: {
      error: "hyp_inquiry_not_configured",
      detail: "Missing env: HYP_ENTERPRISE_RELAY_URL",
    },
  });
  assert.equal(adminClientCalls, 0);
  assert.equal(claimCalls, 0);
});

test("mismatched inquiry user cannot settle the local attempt", async () => {
  const admin = createAdminClient();
  const inquiry = parseHypPaymentInquiry(
    transactionInquiryXml([debitRow("wrong-attempt-debit", "different-attempt")]),
    ATTEMPT_ID,
  );

  const result = await reconcileHypPaymentAttempt(
    admin,
    pendingAttempt(),
    async () => inquiry,
  );

  assert.equal(inquiry.outcome, "unknown");
  assert.deepEqual(result, {
    attemptId: ATTEMPT_ID,
    status: "pending",
    reason: "inquiry_correlation_unverified",
  });
  assert.equal(admin.rpcCalls[0].name, "record_payment_reconciliation_outcome");
  assert.equal(admin.rpcCalls[0].args.p_outcome, "correlation_unverified");
  assert.equal(
    admin.rpcCalls.some(({ name }) => name === "settle_payment_attempt"),
    false,
  );
});

test("missing inquiry user cannot produce a terminal outcome", () => {
  const inquiry = parseHypPaymentInquiry(
    transactionInquiryXml([debitRow("uncorrelated-debit", "")]),
    ATTEMPT_ID,
  );

  assert.equal(inquiry.outcome, "unknown");
  assert.equal(inquiry.hypResponseCode, "correlation_unverified");
});

test("settlement rechecks correlation even for an injected charged result", async () => {
  const admin = createAdminClient();

  const result = await reconcileHypPaymentAttempt(
    admin,
    pendingAttempt(),
    async () => ({
      outcome: "charged",
      inquiryUser: "different-attempt",
      hypTransactionId: "wrong-attempt-debit",
      hypAuthCode: "4760370",
      hypCardMask: "411111******1111",
      hypResponseCode: "000",
      amountAgorot: 1500,
      rawXml: "<ashrait />",
    }),
  );

  assert.equal(result.status, "pending");
  assert.equal(result.reason, "inquiry_correlation_unverified");
  assert.equal(admin.rpcCalls[0].args.p_outcome, "correlation_unverified");
  assert.equal(
    admin.rpcCalls.some(({ name }) => name === "settle_payment_attempt"),
    false,
  );
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
          <user>${toHypInquiryUser(ATTEMPT_ID)}</user>
          <total>1500</total>
          <cgUid>setup-123</cgUid>
        </transaction>
        <transaction>
          <status>000</status>
          <statusText>Permitted transaction</statusText>
          <validation>AutoComm</validation>
          <user>${toHypInquiryUser(ATTEMPT_ID)}</user>
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
    <user>${toHypInquiryUser(ATTEMPT_ID)}</user>
    <transactionType code="01">RegularDebit</transactionType>
    <financialStatus>Cancelled</financialStatus><tranId>119187092</tranId>
  </transaction>
</transactions></inquireTransactions></response></ashrait>`;
}

function cancelledDebitRow() {
  return `<transaction><status>000</status><validation>AutoComm</validation><user>${toHypInquiryUser(ATTEMPT_ID)}</user><transactionType code="01">RegularDebit</transactionType><financialStatus>Cancelled</financialStatus><total>1500</total><tranId>cancelled-debit</tranId></transaction>`;
}

function refundedInquiryXml() {
  return `<?xml version='1.0'?>
<ashrait><response><result>000</result><inquireTransactions><transactions>
  <transaction>
    <status>000</status><validation>AutoComm</validation>
    <user>${toHypInquiryUser(ATTEMPT_ID)}</user>
    <transactionType code="01">RegularDebit</transactionType>
    <financialStatus>Transmitted</financialStatus><total>1500</total><tranId>119187092</tranId>
  </transaction>
  <transaction>
    <status>000</status><validation>AutoComm</validation>
    <user>${toHypInquiryUser(ATTEMPT_ID)}</user>
    <transactionType code="52">Cancel</transactionType>
    <financialStatus>Transmitted</financialStatus><total>1500</total><tranId>119187120</tranId>
  </transaction>
</transactions></inquireTransactions></response></ashrait>`;
}

function transactionInquiryXml(rows) {
  return `<ashrait><response><result>000</result><inquireTransactions><transactions>${rows.join("")}</transactions></inquireTransactions></response></ashrait>`;
}

function debitRow(
  transactionId = "debit-1",
  user = toHypInquiryUser(ATTEMPT_ID),
) {
  return `<transaction><status>000</status><validation>AutoComm</validation><transactionType code="01">RegularDebit</transactionType><financialStatus>Captured</financialStatus><total>1500</total><user>${user}</user><tranId>${transactionId}</tranId></transaction>`;
}

function reversalRow(
  transactionId,
  status = "000",
  typeCode = "58",
  typeName = "Reversal",
  user = toHypInquiryUser(ATTEMPT_ID),
  amount = 1500,
) {
  return `<transaction><status>${status}</status><validation>AutoComm</validation><transactionType code="${typeCode}">${typeName}</transactionType><financialStatus>Transmitted</financialStatus><total>${amount}</total><user>${user}</user><tranId>${transactionId}</tranId></transaction>`;
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
