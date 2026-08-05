import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const spec = readFileSync(
  resolve(repositoryRoot, "tests/destructive/seeded-lifecycle-preview.spec.ts"),
  "utf8",
);
const fixtures = readFileSync(
  resolve(repositoryRoot, "tests/utils/lifecycle-preview.ts"),
  "utf8",
);
const adminHelpers = readFileSync(
  resolve(repositoryRoot, "tests/utils/supabase-admin.ts"),
  "utf8",
);

test("seeded lifecycle preview keeps explicit disposable-target and no-provider gates", () => {
  for (const guard of [
    "RUN_DESTRUCTIVE",
    "PREVIEW_FIXTURES_CONFIRMED",
    "PLAYWRIGHT_BASE_URL",
  ]) {
    assert.ok(spec.includes(guard), `missing preview safety gate: ${guard}`);
  }

  assert.ok(adminHelpers.includes("qa+"), "preview users must remain QA-scoped");
  assert.ok(adminHelpers.includes("provider_called: false"), "settlement must record no provider call");
  assert.ok(fixtures.includes('.storage.from("photos").remove'), "uploaded preview photos must be removed");
  assert.ok(!spec.includes("/api/payments/checkout"), "preview must not start a real checkout");
  assert.ok(!spec.includes("/api/payments/return"), "preview must not forge a HYP browser return");
});

test("seeded lifecycle preview covers customer discovery and all owner states", () => {
  for (const width of [320, 390, 430]) {
    assert.match(fixtures, new RegExp(`\\b${width}\\b`), `missing mobile viewport ${width}`);
  }

  for (const publicFixture of ["featured", "noPhoto", "closed", "flowers", "sweets"]) {
    assert.match(fixtures, new RegExp(`\\b${publicFixture}\\b`), `missing catalog fixture ${publicFixture}`);
  }

  for (const requiredEvidence of [
    "owner_id",
    "business_number",
    "object\\/sign\\/photos",
    "unauthenticatedMine",
    "eventTitle",
    "reviewText",
    "הטיוטה ממתינה לאימות",
    "העסק מאומת ומוכן לפרסום",
    "התשלום בבדיקה",
    "התשלום נקלט",
    "העסק מופיע לציבור",
    "תקופת ההופעה הסתיימה",
    "התשלום לא הושלם",
  ]) {
    assert.ok(spec.includes(requiredEvidence), `missing lifecycle evidence: ${requiredEvidence}`);
  }
});

test("payment fixture helpers expose pending, settlement, failure, and composed grants", () => {
  for (const helper of [
    "createPendingDurationAttempt",
    "settlePaymentAttempt",
    "failPaymentAttempt",
    "grantDurationPlan",
  ]) {
    assert.match(adminHelpers, new RegExp(`export async function ${helper}\\b`));
  }

  assert.match(
    adminHelpers,
    /const attempt = await createPendingDurationAttempt\(opts\);[\s\S]*await settlePaymentAttempt/,
    "grantDurationPlan must compose the same pending and settlement helpers used by preview recovery",
  );
});
