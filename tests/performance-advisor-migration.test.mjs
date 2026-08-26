import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  new URL(
    "../supabase/migrations/20260826063000_remediate_performance_advisor.sql",
    import.meta.url,
  ),
  "utf8",
);
const rollback = readFileSync(
  new URL("../docs/review-artifacts/DAN-264/rollback.sql", import.meta.url),
  "utf8",
);
const databaseRlsTest = readFileSync(
  new URL(
    "../supabase/tests/database/performance_advisor_rls.test.sql",
    import.meta.url,
  ),
  "utf8",
);
const eventSchemaMigration = readFileSync(
  new URL(
    "../supabase/migrations/20260714112838_split_business_analytics_events.sql",
    import.meta.url,
  ),
  "utf8",
);
const photoQueries = readFileSync(
  new URL("../lib/db/photos.ts", import.meta.url),
  "utf8",
);
const favoriteQueries = readFileSync(
  new URL("../lib/hooks/useFavorites.ts", import.meta.url),
  "utf8",
);
const reviewQueries = readFileSync(
  new URL("../lib/db/reviews.ts", import.meta.url),
  "utf8",
);

function policyBlock(name, nextName) {
  const start = migration.indexOf(`CREATE POLICY "${name}"`);
  assert.notEqual(start, -1, `missing policy ${name}`);
  const end = nextName
    ? migration.indexOf(`DROP POLICY IF EXISTS "${nextName}"`, start)
    : migration.indexOf("-- One permissive policy", start);
  assert.notEqual(end, -1, `missing end marker for ${name}`);
  return migration.slice(start, end);
}

test("candidate adds leading-column indexes for all reported foreign keys", () => {
  const createdIndexes = [...migration.matchAll(/CREATE INDEX IF NOT EXISTS\s+(\w+)/g)]
    .map((match) => match[1]);

  assert.deepEqual(createdIndexes, [
    "favorites_business_id_idx",
    "photos_business_id_idx",
    "reviews_user_id_idx",
  ]);
  assert.match(favoriteQueries, /\.eq\("business_id", id\)/);
  assert.match(photoQueries, /\.eq\("business_id", businessId\)/);
  assert.match(reviewQueries, /\.eq\("user_id", user\.id\)/);

  assert.match(favoriteQueries, /\.eq\("user_id", userId\)[\s\S]*\.eq\("business_id", id\)/);
  assert.match(reviewQueries, /\.eq\("business_id", businessId\)[\s\S]*\.eq\("user_id", user\.id\)/);
});

test("auth ownership policies use one init plan and authenticated role", () => {
  const policies = [
    ["Users can read own row", "Users can update own row"],
    ["Users can update own row", "Allow insert on signup"],
    ["Allow insert on signup", "Users manage own favorites"],
    ["Users manage own favorites", "Owners read own payment attempts"],
    ["Owners read own payment attempts", null],
  ];

  for (const [name, nextName] of policies) {
    const block = policyBlock(name, nextName);
    assert.match(block, /TO authenticated/);
    assert.match(block, /\(SELECT auth\.uid\(\)\)/);
    assert.doesNotMatch(block, /(?<!SELECT )auth\.uid\(\)/);
  }
});

test("merged business SELECT policy has the intended public-or-owner predicate", () => {
  assert.match(
    migration,
    /CREATE POLICY "Anyone can read visible or owned businesses"[\s\S]*TO anon, authenticated[\s\S]*is_verified = true[\s\S]*is_active = true[\s\S]*is_legacy_public = true[\s\S]*expires_at > now\(\)[\s\S]*\(SELECT auth\.uid\(\)\) = owner_id/,
  );
});

test("database integration test executes RLS checks under API roles", () => {
  assert.match(databaseRlsTest, /SET LOCAL ROLE authenticated/);
  assert.match(databaseRlsTest, /SET LOCAL ROLE anon/);
  assert.match(databaseRlsTest, /set_config\('request\.jwt\.claims'/);
  assert.match(databaseRlsTest, /FROM public\.businesses/);
  assert.match(databaseRlsTest, /INSERT INTO public\.favorites/);
  assert.match(databaseRlsTest, /FROM public\.payment_attempts/);
  assert.match(databaseRlsTest, /SELECT \* FROM finish\(\)/);
});

test("only the plan-proven redundant unused index is removed", () => {
  assert.match(
    eventSchemaMigration,
    /idx_business_events_business_date[\s\S]*\(business_id, event_date, start_time\)/,
  );
  assert.match(migration, /DROP INDEX IF EXISTS public\.idx_business_events_business_id/);

  for (const retained of [
    "payment_attempts_duration_status_idx",
    "businesses_boosted_idx",
    "businesses_search_idx",
    "businesses_promotion_reservations_idx",
    "payment_attempts_unconsumed_idx",
  ]) {
    assert.doesNotMatch(migration, new RegExp(`DROP INDEX[^;]*${retained}`));
  }
});

test("update-capable ownership policies validate both old and new rows", () => {
  assert.match(
    policyBlock("Users can update own row", "Allow insert on signup"),
    /USING \(\(SELECT auth\.uid\(\)\) = id\)[\s\S]*WITH CHECK \(\(SELECT auth\.uid\(\)\) = id\)/,
  );
  assert.match(
    policyBlock("Users manage own favorites", "Owners read own payment attempts"),
    /USING \(\(SELECT auth\.uid\(\)\) = user_id\)[\s\S]*WITH CHECK \(\(SELECT auth\.uid\(\)\) = user_id\)/,
  );
});

test("rollback restores the exact pre-migration policy and index shape", () => {
  assert.match(rollback, /DROP INDEX IF EXISTS public\.favorites_business_id_idx/);
  assert.match(rollback, /DROP INDEX IF EXISTS public\.photos_business_id_idx/);
  assert.match(rollback, /DROP INDEX IF EXISTS public\.reviews_user_id_idx/);
  assert.match(rollback, /USING \(auth\.uid\(\) = id\)/);
  assert.match(rollback, /WITH CHECK \(auth\.uid\(\) = id\)/);
  assert.match(rollback, /USING \(auth\.uid\(\) = user_id\)/);
  assert.match(rollback, /CREATE POLICY "Anyone can read visible businesses"/);
  assert.match(rollback, /CREATE POLICY "Owners can read own businesses"/);
  assert.match(rollback, /CREATE INDEX IF NOT EXISTS idx_business_events_business_id/);
});
