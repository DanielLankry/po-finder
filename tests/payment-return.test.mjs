import test from "node:test";
import assert from "node:assert/strict";

import {
  failPendingPaymentAttempt,
  getValidPaymentAttemptId,
} from "../lib/payment-return.ts";
import { getBoundPaymentAttemptId } from "../lib/payment-state.ts";

const ATTEMPT_ID = "34a33035-4275-42f8-9963-ea59adcf9445";
const OTHER_ATTEMPT_ID = "f3f0c84c-2f42-4681-88e8-8aa9f4569a24";

test("provider-bound payment attempt ids must be valid UUIDs", () => {
  assert.equal(
    getValidPaymentAttemptId(
      getBoundPaymentAttemptId(
        new URLSearchParams(`attempt=${ATTEMPT_ID}&Order=${ATTEMPT_ID}`)
      )
    ),
    ATTEMPT_ID,
  );
  assert.equal(
    getValidPaymentAttemptId(
      getBoundPaymentAttemptId(
        new URLSearchParams(`attempt=${OTHER_ATTEMPT_ID}&Order=${ATTEMPT_ID}`)
      )
    ),
    null,
  );
  assert.equal(
    getValidPaymentAttemptId(
      getBoundPaymentAttemptId(
        new URLSearchParams("attempt=not-a-uuid&Order=not-a-uuid")
      )
    ),
    null,
  );
});

test("delayed negative callbacks cannot overwrite terminal payment attempts", async () => {
  for (const terminalStatus of ["succeeded", "refunded", "failed"]) {
    const row = { id: ATTEMPT_ID, status: terminalStatus };
    const admin = createPaymentAttemptClient(row);

    await failPendingPaymentAttempt(admin, ATTEMPT_ID, failureUpdate());

    assert.equal(row.status, terminalStatus);
  }
});

test("negative callbacks still fail matching pending payment attempts", async () => {
  const row = { id: ATTEMPT_ID, status: "pending" };
  const admin = createPaymentAttemptClient(row);

  await failPendingPaymentAttempt(admin, ATTEMPT_ID, failureUpdate());

  assert.equal(row.status, "failed");
});

function failureUpdate() {
  return {
    status: "failed",
    hyp_response_code: "verify_failed",
    raw_return: {},
    completed_at: "2026-08-17T08:00:00.000Z",
  };
}

function createPaymentAttemptClient(row) {
  return {
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
              const matches = filters.every(([column, value]) => row[column] === value);
              if (matches) Object.assign(row, update);
              return Promise.resolve({ error: null }).then(resolve, reject);
            },
          };
        },
      };
    },
  };
}

