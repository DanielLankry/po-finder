import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const migration = readFileSync(
  new URL(
    "../supabase/migrations/20260811085142_first_twenty_business_promotion.sql",
    import.meta.url,
  ),
  "utf8",
);

test("campaign has the agreed bounded capacity, duration, and end date", () => {
  assert.match(migration, /'first-20-3m',[\s\S]*?20,[\s\S]*?0,[\s\S]*?3,/);
  assert.match(migration, /'2026-12-31 23:59:59\+02'/);
  assert.match(migration, /claimed_count >= 0 AND claimed_count <= capacity/);
});

test("draft insertion reserves one place under a database row lock", () => {
  assert.match(migration, /CREATE TRIGGER trg_reserve_first_twenty_promotion[\s\S]*?BEFORE INSERT/);
  assert.match(migration, /SELECT \*[\s\S]*?FOR UPDATE;/);
  assert.match(migration, /NEW\.owner_id <> \(SELECT auth\.uid\(\)\)/);
  assert.match(migration, /campaign\.claimed_count >= campaign\.capacity/);
  assert.match(migration, /SET claimed_count = claimed_count \+ 1/);
});

test("approval starts three calendar months and activates public visibility", () => {
  assert.match(migration, /CREATE TRIGGER trg_activate_first_twenty_promotion[\s\S]*?BEFORE UPDATE OF is_verified/);
  assert.match(migration, /OLD\.is_verified = false[\s\S]*?NEW\.is_verified = true/);
  assert.match(migration, /make_interval\(months => campaign_duration\)/);
  assert.match(migration, /NEW\.is_active := true/);
  assert.match(migration, /OLD\.promotion_activated_at IS NULL/);
});

test("only an unactivated deletion releases a reserved place", () => {
  assert.match(migration, /CREATE TRIGGER trg_release_first_twenty_reservation[\s\S]*?AFTER DELETE/);
  assert.match(migration, /OLD\.promotion_activated_at IS NULL/);
  assert.match(migration, /GREATEST\(claimed_count - 1, 0\)/);
});

test("browser roles can read only aggregate status and cannot manage campaign rows", () => {
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /REVOKE ALL ON TABLE public\.promotion_campaigns FROM PUBLIC, anon, authenticated/);
  assert.match(migration, /GRANT SELECT \([\s\S]*?\) ON TABLE public\.promotion_campaigns TO anon, authenticated/);
  assert.doesNotMatch(migration, /GRANT (INSERT|UPDATE|DELETE)[\s\S]*?promotion_campaigns TO (anon|authenticated)/);
  const grantStatements = migration.match(/GRANT[\s\S]*?;/g) ?? [];
  assert.equal(
    grantStatements.some(
      (statement) =>
        statement.includes("promotion_code") && statement.includes("public.businesses"),
    ),
    false,
  );
});
