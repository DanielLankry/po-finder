import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  new URL("../supabase/migrations/20260715144513_launch_privacy_hardening.sql", import.meta.url),
  "utf8",
);

test("launch migration removes broad business column reads", () => {
  assert.match(migration, /REVOKE SELECT ON TABLE public\.businesses FROM anon, authenticated/);
  assert.doesNotMatch(
    migration.match(/GRANT SELECT \([\s\S]*?\) ON public\.businesses/)?.[0] ?? "",
    /owner_id|business_number/,
  );
});

test("launch migration gates schedules and photo metadata by business visibility", () => {
  assert.match(migration, /schedule_select_visible_or_owner/);
  assert.match(migration, /weekly_schedule_select_visible_or_owner/);
  assert.match(migration, /photos_select_visible_or_owner/);
  assert.match(migration, /can_read_business_content\(business_id\)/);
});

test("launch migration makes the photo bucket private", () => {
  assert.match(migration, /UPDATE storage\.buckets SET public = false WHERE id = 'photos'/);
  assert.match(migration, /photo_objects_select_visible_or_owner/);
});
