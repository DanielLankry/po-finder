import test from "node:test";
import assert from "node:assert/strict";

import {
  getBusinessAvailability,
  getIsraelDateContext,
  getScheduleAvailability,
  isOpenNow,
  resolveEffectiveSchedule,
} from "../lib/utils/schedule.ts";

/** Builds a complete dated schedule for pure time-boundary tests. */
function schedule(overrides = {}) {
  return {
    id: "schedule-1",
    business_id: "business-1",
    date: "2026-07-15",
    address: null,
    lat: null,
    lng: null,
    open_time: "10:00:00",
    close_time: "14:00:00",
    note: null,
    created_at: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

/** Builds a weekly row for effective-schedule precedence tests. */
function weekly(overrides = {}) {
  return {
    id: "weekly-1",
    business_id: "business-1",
    day_of_week: 3,
    is_active: true,
    open_time: "20:00:00",
    close_time: "02:00:00",
    address: null,
    lat: null,
    lng: null,
    note: null,
    created_at: "2026-07-01T00:00:00.000Z",
    updated_at: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

test("Israel date context does not advance twice on a UTC host", () => {
  const context = getIsraelDateContext(new Date("2026-07-15T20:30:00.000Z"));
  assert.equal(context.date, "2026-07-15");
  assert.equal(context.dayOfWeek, 3);
  assert.equal(context.time, "23:30");
});

test("closing time is exclusive", () => {
  const now = new Date("2026-07-15T11:00:00.000Z"); // 14:00 Israel
  assert.equal(getScheduleAvailability(schedule(), now), "closed");
  assert.equal(isOpenNow(schedule(), now), false);
});

test("overnight schedule opens before midnight on its start date", () => {
  const now = new Date("2026-07-15T18:30:00.000Z"); // 21:30 Israel
  assert.equal(
    getScheduleAvailability(schedule({ open_time: "20:00", close_time: "02:00" }), now),
    "open",
  );
});

test("overnight schedule carries into the next calendar day", () => {
  const now = new Date("2026-07-15T22:30:00.000Z"); // 01:30 Israel on July 16
  assert.equal(
    getScheduleAvailability(schedule({ open_time: "20:00", close_time: "02:00" }), now),
    "open",
  );
  assert.equal(
    getScheduleAvailability(
      schedule({ date: "2026-07-16", open_time: "20:00", close_time: "02:00" }),
      now,
    ),
    "closed",
  );
});

test("explicit closed hours and unknown hours stay distinct", () => {
  assert.equal(
    getBusinessAvailability({ today_schedule: null, hours_status: "unknown" }),
    "unknown",
  );
  assert.equal(
    getBusinessAvailability({ today_schedule: null, hours_status: "closed" }),
    "closed",
  );
});

test("previous weekly overnight interval wins after midnight", () => {
  const now = new Date("2026-07-15T22:30:00.000Z"); // July 16 in Israel
  const result = resolveEffectiveSchedule({
    now,
    todayDate: "2026-07-16",
    previousDate: "2026-07-15",
    todayWeekly: weekly({ day_of_week: 4, open_time: "09:00", close_time: "17:00" }),
    previousWeekly: weekly(),
  });

  assert.equal(result.hoursStatus, "scheduled");
  assert.equal(result.schedule?.date, "2026-07-15");
  assert.equal(getScheduleAvailability(result.schedule, now), "open");
});

test("inactive weekly row resolves to confirmed closed", () => {
  const result = resolveEffectiveSchedule({
    now: new Date("2026-07-15T10:00:00.000Z"),
    todayDate: "2026-07-15",
    previousDate: "2026-07-14",
    todayWeekly: weekly({ is_active: false, open_time: null, close_time: null }),
  });

  assert.equal(result.hoursStatus, "closed");
  assert.equal(result.schedule?.date, "2026-07-15");
});
