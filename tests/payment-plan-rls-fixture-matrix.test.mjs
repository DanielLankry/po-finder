import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "..");
const matrixPath = resolve(
  repositoryRoot,
  "docs/quality/payment-plan-rls-fixture-matrix.md",
);
const matrix = readFileSync(matrixPath, "utf8");

const expectedPlanRows = [
  ["listing_1d", 1, "null", 300],
  ["listing_2d", 2, "null", 500],
  ["listing_3d", 3, "null", 600],
  ["listing_7d", 7, "null", 800],
  ["listing_1m", 30, "1", 1100],
  ["listing_2m", 60, "2", 1900],
  ["listing_3m", 90, "3", 2600],
  ["listing_4m", 120, "4", 3100],
  ["listing_5m", 150, "5", 3600],
  ["listing_6m", 180, "6", 4100],
  ["listing_7m", 210, "7", 4500],
  ["listing_8m", 240, "8", 4900],
  ["listing_9m", 270, "9", 5200],
  ["listing_10m", 300, "10", 5500],
  ["listing_11m", 330, "11", 5800],
  ["listing_12m", 360, "12", 6100],
];

test("payment-plan fixture matrix lists every supported listing plan in order", () => {
  let lastIndex = -1;

  for (const [code, days, months, price] of expectedPlanRows) {
    const rowPattern = new RegExp(
      String.raw`\| \d+ \| \`${code}\` \| ${days} \| ${months} \| ${price} \|`,
    );
    const match = matrix.match(rowPattern);
    assert.ok(match, `missing matrix row for ${code}`);
    const nextIndex = match.index ?? -1;
    assert.ok(nextIndex > lastIndex, `${code} is out of order`);
    lastIndex = nextIndex;
  }
});

test("fixture matrix preserves destructive-test safety boundaries", () => {
  for (const requiredText of [
    "RUN_DESTRUCTIVE=1",
    "ymqlqdhelsocibhnanjy",
    "pokarov.co.il",
    "qa+*@pokarov.test",
    "settle_payment_attempt",
    "do not execute `supabase db push`, `supabase db reset`, or production migrations",
  ]) {
    assert.ok(matrix.includes(requiredText), `missing safety boundary: ${requiredText}`);
  }
});

test("fixture matrix names the required RLS fixture scenarios", () => {
  for (const fixtureName of [
    "free-draft-owner",
    "paid-active-owner",
    "paid-lifecycle-owner",
    "expired-paid-owner",
    "renewal-owner",
    "catalog-admin",
  ]) {
    assert.ok(matrix.includes(`\`${fixtureName}\``), `missing fixture ${fixtureName}`);
  }
});
