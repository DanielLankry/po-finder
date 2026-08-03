import test from "node:test";
import assert from "node:assert/strict";

import { getOwnerLifecycleDetails } from "../lib/owner-lifecycle.ts";

const NOW = "2026-08-03T12:00:00.000Z";

test("unverified businesses stay private until owner verification completes", () => {
  const details = getOwnerLifecycleDetails(
    { is_active: false, is_verified: false, expires_at: null },
    NOW,
  );

  assert.equal(details.state, "pending_verification");
  assert.equal(details.publicVisible, false);
  assert.equal(details.actionHref, "/dashboard/profile");
});

test("verified inactive businesses are ready to publish through billing", () => {
  const details = getOwnerLifecycleDetails(
    { is_active: false, is_verified: true, expires_at: null },
    NOW,
  );

  assert.equal(details.state, "ready_to_publish");
  assert.equal(details.publicVisible, false);
  assert.equal(details.actionHref, "/dashboard/billing");
});

test("active paid businesses expose active and expiring lifecycle states", () => {
  const active = getOwnerLifecycleDetails(
    { is_active: true, is_verified: true, expires_at: "2026-08-20T12:00:00.000Z" },
    NOW,
  );
  const expiring = getOwnerLifecycleDetails(
    { is_active: true, is_verified: true, expires_at: "2026-08-06T12:00:00.000Z" },
    NOW,
  );

  assert.equal(active.state, "active");
  assert.equal(active.publicVisible, true);
  assert.equal(active.daysLeft, 17);
  assert.equal(expiring.state, "expiring_soon");
  assert.equal(expiring.publicVisible, true);
  assert.equal(expiring.daysLeft, 3);
});

test("active businesses without expiry only appear public when grandfathered", () => {
  const paidRequired = getOwnerLifecycleDetails(
    { is_active: true, is_verified: true, is_legacy_public: false, expires_at: null },
    NOW,
  );
  const grandfathered = getOwnerLifecycleDetails(
    { is_active: true, is_verified: true, is_legacy_public: true, expires_at: null },
    NOW,
  );

  assert.equal(paidRequired.state, "ready_to_publish");
  assert.equal(paidRequired.publicVisible, false);
  assert.equal(grandfathered.state, "active");
  assert.equal(grandfathered.publicVisible, true);
});

test("expired listings are not public-visible and point owners to renewal", () => {
  const details = getOwnerLifecycleDetails(
    { is_active: true, is_verified: true, expires_at: "2026-08-03T11:59:59.000Z" },
    NOW,
  );

  assert.equal(details.state, "expired");
  assert.equal(details.publicVisible, false);
  assert.equal(details.actionLabel, "חידוש הופעה");
});
