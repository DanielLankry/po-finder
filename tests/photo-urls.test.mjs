import test from "node:test";
import assert from "node:assert/strict";

import { getPhotoStoragePath } from "../lib/storage/photo-urls.ts";

test("extracts paths from legacy public photo URLs", () => {
  assert.equal(
    getPhotoStoragePath("https://example.supabase.co/storage/v1/object/public/photos/business-1/photo.webp"),
    "business-1/photo.webp",
  );
});

test("extracts paths from signed URLs without keeping the token", () => {
  assert.equal(
    getPhotoStoragePath("https://example.supabase.co/storage/v1/object/sign/photos/business-1/photo.webp?token=secret"),
    "business-1/photo.webp",
  );
});

test("keeps new bucket-relative paths", () => {
  assert.equal(getPhotoStoragePath("business-1/photo.webp"), "business-1/photo.webp");
});
