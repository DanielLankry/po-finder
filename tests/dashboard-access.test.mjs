import test from "node:test";
import assert from "node:assert/strict";

import { computeDashboardAccess } from "../lib/dashboard-access-core.ts";

test("an active paid business grants dashboard access", () => {
  assert.equal(
    computeDashboardAccess({
      hasActiveBusiness: true,
      hasUnconsumedPayment: false,
      hasAnyBusiness: false,
    }),
    true,
  );
});

test("succeeded unconsumed payment grants dashboard access", () => {
  assert.equal(
    computeDashboardAccess({
      hasActiveBusiness: false,
      hasUnconsumedPayment: true,
      hasAnyBusiness: false,
    }),
    true,
  );
});

test("admin approval is not required for dashboard access", () => {
  assert.equal(
    computeDashboardAccess({
      hasActiveBusiness: false,
      hasUnconsumedPayment: false,
      hasAnyBusiness: true,
    }),
    true,
  );
});

test("unpaid users without businesses stay outside dashboard access", () => {
  assert.equal(
    computeDashboardAccess({
      hasActiveBusiness: false,
      hasUnconsumedPayment: false,
      hasAnyBusiness: false,
    }),
    false,
  );
});
