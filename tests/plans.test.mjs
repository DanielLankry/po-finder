import test from "node:test";
import assert from "node:assert/strict";

import { PLANS, addCalendarMonths } from "../lib/plans.ts";

test("duration catalog has the exact twelve one-time prices", () => {
  assert.deepEqual(
    PLANS.map((plan) => ({ months: plan.months, price: plan.price })),
    [
      { months: 1, price: 1000 },
      { months: 2, price: 1800 },
      { months: 3, price: 2500 },
      { months: 4, price: 3000 },
      { months: 5, price: 3500 },
      { months: 6, price: 4000 },
      { months: 7, price: 4400 },
      { months: 8, price: 4800 },
      { months: 9, price: 5100 },
      { months: 10, price: 5400 },
      { months: 11, price: 5700 },
      { months: 12, price: 6000 },
    ]
  );
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
