import test from "node:test";
import assert from "node:assert/strict";

import { PLANS, addCalendarMonths, addPlanDuration } from "../lib/plans.ts";

test("duration catalog includes one, two, three days and week plus all month prices", () => {
  assert.deepEqual(
    PLANS.map((plan) => ({ days: plan.days, months: plan.months, price: plan.price })),
    [
      { days: 1, months: null, price: 300 },
      { days: 2, months: null, price: 500 },
      { days: 3, months: null, price: 600 },
      { days: 7, months: null, price: 800 },
      { days: 30, months: 1, price: 1100 },
      { days: 60, months: 2, price: 1900 },
      { days: 90, months: 3, price: 2600 },
      { days: 120, months: 4, price: 3100 },
      { days: 150, months: 5, price: 3600 },
      { days: 180, months: 6, price: 4100 },
      { days: 210, months: 7, price: 4500 },
      { days: 240, months: 8, price: 4900 },
      { days: 270, months: 9, price: 5200 },
      { days: 300, months: 10, price: 5500 },
      { days: 330, months: 11, price: 5800 },
      { days: 360, months: 12, price: 6100 },
    ]
  );
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
