import test from "node:test";
import assert from "node:assert/strict";

import {
  EXPIRY_REMINDER_DAYS,
  getExpiryReminderWindow,
  isExpiryInReminderWindow,
} from "../lib/expiry-reminders.ts";

test("reminders are scheduled exactly 30, 7, and 1 days before expiry", () => {
  assert.deepEqual(EXPIRY_REMINDER_DAYS, [30, 7, 1]);
});

test("a reminder window is a non-overlapping 24-hour interval", () => {
  const now = new Date("2027-01-01T06:00:00.000Z");
  const { start, end } = getExpiryReminderWindow(now, 7);
  assert.equal(start.toISOString(), "2027-01-08T06:00:00.000Z");
  assert.equal(end.toISOString(), "2027-01-09T06:00:00.000Z");
  assert.equal(isExpiryInReminderWindow(start, now, 7), true);
  assert.equal(isExpiryInReminderWindow(end, now, 7), false);
});
