import test from "node:test";
import assert from "node:assert/strict";

import { hasPublicMapCoordinates, isPublicReadyBusiness } from "../lib/public-business.ts";

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

test("approved business cards are shown even when the name contains test/demo words", () => {
  assert.equal(
    isPublicReadyBusiness({
      ...baseBusiness,
      name: "עסק לבדיקה",
    }),
    true,
  );
});

test("approved business cards can render without coordinates", () => {
  assert.equal(isPublicReadyBusiness({ ...baseBusiness, lat: null, lng: null }), true);
});

test("map markers still need coordinates from either base data or today's schedule", () => {
  assert.equal(
    hasPublicMapCoordinates({
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
  assert.equal(hasPublicMapCoordinates({ ...baseBusiness, lat: null, lng: null }), false);
});
