import test from "node:test";
import assert from "node:assert/strict";

import {
  getPhotoStoragePath,
  signPhotoRecords,
} from "../lib/storage/photo-urls.ts";

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

test("rejects malformed and traversal-like storage paths", () => {
  assert.equal(getPhotoStoragePath("business-1/%E0%A4%A.webp"), null);
  assert.equal(getPhotoStoragePath("business-1/../private.webp"), null);
  assert.equal(getPhotoStoragePath("https://tracker.example/photo.webp"), null);
});

test("failed signing does not expose stored or external fallback URLs", async () => {
  const supabase = {
    storage: {
      from() {
        return {
          async createSignedUrls() {
            return { data: [] };
          },
        };
      },
    },
  };
  const photos = [
    { id: "1", business_id: "business-1", url: "business-1/photo.webp", is_primary: true, created_at: "" },
    { id: "2", business_id: "business-1", url: "https://tracker.example/photo.webp", is_primary: false, created_at: "" },
  ];

  const signed = await signPhotoRecords(supabase, photos);
  assert.deepEqual(signed.map((photo) => photo.url), ["", ""]);
});

test("an all-external photo set is removed without calling Storage", async () => {
  const supabase = {
    storage: {
      from() {
        throw new Error("Storage must not be called without a valid path");
      },
    },
  };
  const photos = [
    { id: "1", business_id: "business-1", url: "https://tracker.example/a.webp", is_primary: true, created_at: "" },
  ];

  const signed = await signPhotoRecords(supabase, photos);
  assert.equal(signed[0].url, "");
});
