import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import {
  MAX_LISTING_PRICE_AGOROT,
  MIN_LISTING_PRICE_AGOROT,
  PLANS,
  addCalendarMonths,
  addPlanDuration,
  isValidPlanPriceLadder,
  resolvePlanCatalog,
} from "../lib/plans.ts";

const PROJECT_ROOT = fileURLToPath(new URL("../", import.meta.url));
const CUSTOMER_COPY_ROOTS = ["app", "components", "lib", "public"];
const CUSTOMER_COPY_EXTENSIONS = new Set([
  ".css",
  ".html",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".mjs",
  ".svg",
  ".ts",
  ".tsx",
  ".txt",
]);

/** Collects customer-facing text sources without scanning historical task records. */
function collectCustomerCopyFiles(directory) {
  const files = [];
  const pending = [directory];

  while (pending.length > 0) {
    const current = pending.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const entryPath = join(current, entry.name);
      if (entry.isDirectory()) pending.push(entryPath);
      else if (CUSTOMER_COPY_EXTENSIONS.has(extname(entry.name))) files.push(entryPath);
    }
  }

  return files;
}

test("duration catalog uses the complete ₪20–₪250 launch ladder", () => {
  assert.deepEqual(
    PLANS.map((plan) => ({ days: plan.days, months: plan.months, price: plan.price })),
    [
      { days: 1, months: null, price: 2000 },
      { days: 2, months: null, price: 2500 },
      { days: 3, months: null, price: 3000 },
      { days: 7, months: null, price: 4000 },
      { days: 30, months: 1, price: 6000 },
      { days: 60, months: 2, price: 8000 },
      { days: 90, months: 3, price: 10000 },
      { days: 120, months: 4, price: 12000 },
      { days: 150, months: 5, price: 14000 },
      { days: 180, months: 6, price: 16000 },
      { days: 210, months: 7, price: 17500 },
      { days: 240, months: 8, price: 19000 },
      { days: 270, months: 9, price: 20500 },
      { days: 300, months: 10, price: 22000 },
      { days: 330, months: 11, price: 23500 },
      { days: 360, months: 12, price: 25000 },
    ]
  );

  const prices = PLANS.map((plan) => plan.price);
  assert.equal(Math.min(...prices), MIN_LISTING_PRICE_AGOROT);
  assert.equal(Math.max(...prices), MAX_LISTING_PRICE_AGOROT);
  assert.ok(prices.every((price, index) => index === 0 || price > prices[index - 1]));
  assert.ok(
    PLANS.every(
      (plan, index) =>
        index === 0 || plan.price / plan.days < PLANS[index - 1].price / PLANS[index - 1].days
    ),
    "longer durations should always cost less per day"
  );
});

test("admin price validation rejects out-of-range, duplicate, and non-increasing catalogs", () => {
  assert.equal(isValidPlanPriceLadder(PLANS), true);

  const tooCheap = PLANS.map((plan, index) =>
    index === 0 ? { ...plan, price: MIN_LISTING_PRICE_AGOROT - 100 } : plan
  );
  assert.equal(isValidPlanPriceLadder(tooCheap), false);

  const tooExpensive = PLANS.map((plan, index) =>
    index === PLANS.length - 1
      ? { ...plan, price: MAX_LISTING_PRICE_AGOROT + 100 }
      : plan
  );
  assert.equal(isValidPlanPriceLadder(tooExpensive), false);

  const duplicateCode = PLANS.map((plan, index) =>
    index === 1 ? { ...plan, code: PLANS[0].code } : plan
  );
  assert.equal(isValidPlanPriceLadder(duplicateCode), false);

  const nonIncreasing = PLANS.map((plan, index) =>
    index === 5 ? { ...plan, price: PLANS[4].price } : plan
  );
  assert.equal(isValidPlanPriceLadder(nonIncreasing), false);
});

test("server catalog falls back atomically when the database price migration is incomplete", () => {
  const retiredDatabaseCatalog = PLANS.map((plan, index) => ({
    ...plan,
    price: index === 0 ? 300 : plan.price,
  }));
  const resolved = resolvePlanCatalog(retiredDatabaseCatalog);

  assert.deepEqual(
    resolved.map((plan) => plan.price),
    PLANS.map((plan) => plan.price),
  );

  const validCustomLabels = PLANS.map((plan) => ({
    ...plan,
    label: `${plan.label} · מחירון`,
  }));
  assert.deepEqual(
    resolvePlanCatalog(validCustomLabels).map((plan) => plan.label),
    validCustomLabels.map((plan) => plan.label),
  );
});

test("customer-facing sources contain no retired launch price copy", () => {
  const retiredPrice = /₪\s*(?:3|8|41|61)(?!\d)/gu;
  const offenders = CUSTOMER_COPY_ROOTS.flatMap((root) =>
    collectCustomerCopyFiles(join(PROJECT_ROOT, root)).flatMap((file) => {
      const matches = [...readFileSync(file, "utf8").matchAll(retiredPrice)];
      return matches.map((match) => `${relative(PROJECT_ROOT, file)}: ${match[0]}`);
    })
  );

  assert.deepEqual(offenders, []);
});
test("short-day and week previews use exact UTC day arithmetic", () => {
  const base = new Date("2027-01-31T12:00:00.000Z");
  assert.equal(addPlanDuration(base, PLANS[0]).toISOString(), "2027-02-01T12:00:00.000Z");
  assert.equal(addPlanDuration(base, PLANS[1]).toISOString(), "2027-02-02T12:00:00.000Z");
  assert.equal(addPlanDuration(base, PLANS[2]).toISOString(), "2027-02-03T12:00:00.000Z");
  assert.equal(addPlanDuration(base, PLANS[3]).toISOString(), "2027-02-07T12:00:00.000Z");
});

test("calendar month preview clamps month-end instead of overflowing", () => {
  assert.equal(
    addCalendarMonths(new Date("2027-01-31T12:00:00.000Z"), 1).toISOString(),
    "2027-02-28T12:00:00.000Z"
  );
  assert.equal(
    addCalendarMonths(new Date("2028-01-31T12:00:00.000Z"), 1).toISOString(),
    "2028-02-29T12:00:00.000Z"
  );
});

test("renewal preview adds time from an existing future expiry", () => {
  assert.equal(
    addCalendarMonths(new Date("2027-06-15T09:30:00.000Z"), 6).toISOString(),
    "2027-12-15T09:30:00.000Z"
  );
});
