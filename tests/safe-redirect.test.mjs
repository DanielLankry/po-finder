import test from "node:test";
import assert from "node:assert/strict";

import { safeRedirectPath } from "../lib/safe-redirect.ts";

test("keeps same-site paths and query strings", () => {
  assert.equal(
    safeRedirectPath("/dashboard/billing?plan=listing_6m"),
    "/dashboard/billing?plan=listing_6m",
  );
});

test("rejects absolute, protocol-relative and backslash redirects", () => {
  for (const value of [
    "https://evil.example/phish",
    "//evil.example/phish",
    "/\\evil.example/phish",
    "@evil.example",
  ]) {
    assert.equal(safeRedirectPath(value, "/dashboard"), "/dashboard");
  }
});
