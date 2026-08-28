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
const reviewQueries = readFileSync(
  new URL("../lib/db/reviews.ts", import.meta.url),
  "utf8",
);

test("browser roles receive explicit public review columns without user_id", () => {
  const reviewGrant = migration.match(
    /GRANT SELECT \([\s\S]*?\) ON public\.reviews TO anon, authenticated/,
  )?.[0] ?? "";

  assert.match(reviewGrant, /reviewer_name/);
  assert.doesNotMatch(reviewGrant, /user_id/);
  assert.match(
    migration,
    /has_column_privilege\('anon', 'public\.reviews', 'user_id', 'SELECT'\)/,
  );
  assert.doesNotMatch(reviewQueries, /user:users\(/);
});

test("payment, analytics, coupon, and legacy spot data are least-privilege", () => {
  const paymentGrant = migration.match(
    /GRANT SELECT \([\s\S]*?\) ON public\.payment_attempts TO authenticated/,
  )?.[0] ?? "";

  assert.match(paymentGrant, /hyp_card_mask/);
  assert.doesNotMatch(paymentGrant, /raw_return|hyp_auth_code/);
  assert.match(migration, /business_analytics_events'[\s\S]*'session_id'/);
  assert.match(migration, /REVOKE ALL ON TABLE public\.coupons FROM PUBLIC, anon, authenticated/);
  assert.match(migration, /to_regclass\('public\.spots'\)/);
});
