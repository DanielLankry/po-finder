import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  new URL(
    "../supabase/migrations/20260716091648_move_policy_helpers_private.sql",
    import.meta.url,
  ),
  "utf8",
);

const movedHelpers = [
  "current_user_owns_business\\(uuid\\)",
  "can_read_business_content\\(uuid\\)",
  "can_read_business_photo_object\\(text\\)",
  "current_user_owns_business_photo_object\\(text\\)",
  "user_is_subscribed\\(\\)",
];

test("policy-only helpers leave the exposed public schema", () => {
  assert.match(migration, /CREATE SCHEMA IF NOT EXISTS private/);
  assert.match(migration, /REVOKE ALL ON SCHEMA private FROM PUBLIC/);

  for (const helper of movedHelpers) {
    assert.match(
      migration,
      new RegExp(`ALTER FUNCTION public\\.${helper}\\s+SET SCHEMA private`),
    );
    assert.match(
      migration,
      new RegExp(
        `REVOKE ALL ON FUNCTION private\\.${helper}\\s+FROM PUBLIC, anon, authenticated`,
      ),
    );
  }

  assert.doesNotMatch(migration, /ALTER FUNCTION public\.get_my_businesses/);
});

test("private helpers retain only the privileges their RLS policies require", () => {
  assert.match(
    migration,
    /GRANT USAGE ON SCHEMA private TO anon, authenticated/,
  );
  assert.match(
    migration,
    /GRANT EXECUTE ON FUNCTION private\.can_read_business_content\(uuid\)\s+TO anon, authenticated/,
  );
  assert.match(
    migration,
    /GRANT EXECUTE ON FUNCTION private\.can_read_business_photo_object\(text\)\s+TO anon, authenticated/,
  );
  assert.match(
    migration,
    /GRANT EXECUTE ON FUNCTION private\.current_user_owns_business\(uuid\)\s+TO authenticated/,
  );
  assert.match(
    migration,
    /GRANT EXECUTE ON FUNCTION private\.current_user_owns_business_photo_object\(text\)\s+TO authenticated/,
  );
  assert.match(
    migration,
    /GRANT EXECUTE ON FUNCTION private\.user_is_subscribed\(\)\s+TO authenticated/,
  );
});
