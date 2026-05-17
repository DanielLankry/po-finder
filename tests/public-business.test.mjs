import test from "node:test";
import assert from "node:assert/strict";

import { isPublicReadyBusiness } from "../lib/public-business.ts";

const baseBusiness = {
  id: "business-1",
  name: "קפה הפינה",
  lat: 32.0675,
  lng: 34.773,
  today_schedule: null,
};

test("active public businesses do not require a same-day schedule row", () => {
  assert.equal(isPublicReadyBusiness(baseBusiness), true);
});

test("demo/test businesses are hidden from the public map", () => {
  assert.equal(
    isPublicReadyBusiness({
      ...baseBusiness,
      name: "עסק לבדיקה",
    }),
    false,
  );
});

test("businesses still need coordinates from either base data or today's schedule", () => {
  assert.equal(
    isPublicReadyBusiness({
      ...baseBusiness,
      lat: null,
      lng: null,
      today_schedule: {
        lat: 32.1,
        lng: 34.8,
      },
    }),
    true,
  );
  assert.equal(isPublicReadyBusiness({ ...baseBusiness, lat: null, lng: null }), false);
});
