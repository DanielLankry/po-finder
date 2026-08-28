import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const cancelRoute = readFileSync(
  new URL("../app/api/payments/cancel/route.ts", import.meta.url),
  "utf8",
);
const returnRoute = readFileSync(
  new URL("../app/api/payments/return/route.ts", import.meta.url),
  "utf8",
);
const checkoutRoute = readFileSync(
  new URL("../app/api/payments/checkout/route.ts", import.meta.url),
  "utf8",
);

test("an unsigned cancellation is scoped to the authenticated attempt owner", () => {
  assert.match(cancelRoute, /supabase\.auth\.getUser\(\)/);
  assert.match(cancelRoute, /\.eq\("id", parsedAttemptId\.data\)/);
  assert.match(cancelRoute, /\.eq\("user_id", user\.id\)/);
  assert.match(cancelRoute, /\.eq\("status", "pending"\)/);
});

test("payment returns persist only the redacted audit snapshot", () => {
  assert.match(returnRoute, /z\.string\(\)\.uuid\(\)\.safeParse/);
  assert.match(returnRoute, /getPaymentReturnAuditSnapshot\(params\)/);
  assert.doesNotMatch(
    returnRoute,
    /for \(const \[k, v\] of params\.entries\(\)\) rawReturn\[k\] = v/,
  );
});

test("negative payment callbacks cannot overwrite a concurrent settlement", () => {
  const pendingGuards = returnRoute.match(/\.eq\("status", "pending"\)/g) ?? [];
  assert.equal(pendingGuards.length, 3);
});

test("payment settlement is bound to HYP's order and the trigger-snapshotted price", () => {
  assert.match(returnRoute, /getBoundPaymentAttemptId\(params\)/);
  assert.match(checkoutRoute, /\.select\("id, amount_agorot"\)/);
  assert.match(checkoutRoute, /attempt\.amount_agorot !== plan\.price/);
  assert.match(checkoutRoute, /amount: attempt\.amount_agorot \/ 100/);
});
