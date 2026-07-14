import test from "node:test";
import assert from "node:assert/strict";

import { computeDashboardAccess } from "../lib/dashboard-access-core.ts";

test("an active paid business grants dashboard access", () => {
  assert.equal(
    computeDashboardAccess({
      isBusinessOwner: false,
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
      isBusinessOwner: false,
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
      isBusinessOwner: false,
      hasActiveBusiness: false,
      hasUnconsumedPayment: false,
      hasAnyBusiness: true,
    }),
    true,
  );
});

test("business owners can enter the dashboard to create a free draft", () => {
  assert.equal(
    computeDashboardAccess({
      isBusinessOwner: true,
      hasActiveBusiness: false,
      hasUnconsumedPayment: false,
      hasAnyBusiness: false,
    }),
    true,
  );
});

test("customers without businesses stay outside business dashboard access", () => {
  assert.equal(
    computeDashboardAccess({
      isBusinessOwner: false,
      hasActiveBusiness: false,
      hasUnconsumedPayment: false,
      hasAnyBusiness: false,
    }),
    false,
  );
});
