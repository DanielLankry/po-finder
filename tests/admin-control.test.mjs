import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/** Loads repository source so guard and migration contracts can be tested offline. */
function read(relativePath) {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

const GUARDED_ADMIN_ROUTES = [
  ["app/api/admin/businesses/route.ts", ["GET", "POST"]],
  ["app/api/admin/businesses/[id]/route.ts", ["PATCH", "DELETE"]],
  ["app/api/admin/businesses/approve/route.ts", ["POST"]],
  ["app/api/admin/users/route.ts", ["GET"]],
  ["app/api/admin/users/[id]/route.ts", ["PATCH", "DELETE"]],
  ["app/api/admin/content/route.ts", ["GET"]],
  ["app/api/admin/content/[type]/[id]/route.ts", ["DELETE"]],
  ["app/api/admin/payments/route.ts", ["GET"]],
  ["app/api/admin/payments/[id]/refund/route.ts", ["POST"]],
  ["app/api/admin/payments/[id]/service/route.ts", ["PATCH"]],
  ["app/api/admin/payments/debug-hyp/route.ts", ["GET"]],
  ["app/api/admin/pricing/route.ts", ["GET", "POST"]],
  ["app/api/admin/coupons/route.ts", ["GET", "POST"]],
  ["app/api/admin/coupons/[id]/route.ts", ["PATCH", "DELETE"]],
];

test("every privileged admin API keeps its signed-session guard", () => {
  for (const [file, methods] of GUARDED_ADMIN_ROUTES) {
    const source = read(file);
    assert.match(source, /isAdminRequest/, `${file} must validate the admin session`);
    assert.match(source, /Unauthorized/, `${file} must reject an invalid session`);
    for (const method of methods) {
      assert.match(
        source,
        new RegExp(`export\\s+async\\s+function\\s+${method}\\b`),
        `${file} must expose ${method}`
      );
    }
  }
});

test("admin navigation exposes each operational control surface", () => {
  const source = read("app/admin/layout.tsx");
  for (const path of [
    "/admin/businesses",
    "/admin/users",
    "/admin/content",
    "/admin/payments",
    "/admin/pricing",
    "/admin/coupons",
    "/admin/stats",
  ]) {
    assert.match(source, new RegExp(`href:\\s*"${path}"`));
  }
});

test("duration price writes are atomic and service-role-only", () => {
  const migration = read(
    "supabase/migrations/20260716091547_enforce_duration_price_ladder.sql"
  );
  assert.match(migration, /SECURITY INVOKER/);
  assert.match(
    migration,
    /REVOKE ALL ON FUNCTION public\.admin_update_duration_pricing\(jsonb\) FROM PUBLIC, anon, authenticated;/
  );
  assert.match(
    migration,
    /GRANT EXECUTE ON FUNCTION public\.admin_update_duration_pricing\(jsonb\) TO service_role;/
  );
  assert.match(migration, /GRANT SELECT, UPDATE ON TABLE public\.plans TO service_role;/);
  assert.match(migration, /WHEN 'listing_1d' THEN 2000/);
  assert.match(migration, /WHEN 'listing_12m' THEN 25000/);

  const route = read("app/api/admin/pricing/route.ts");
  assert.match(route, /admin_update_duration_pricing/);
  assert.doesNotMatch(route, /Promise\.all\(parsed\.data\.plans\.map/);

  for (const pagePath of ["app/pricing/page.tsx", "app/admin/pricing/page.tsx"]) {
    assert.match(
      read(pagePath),
      /export const dynamic = "force-dynamic"/,
      `${pagePath} must read the current database catalog instead of build-time prices`,
    );
  }
});

test("pending HYP attempts stay visible without an unsafe manual settlement action", () => {
  const page = read("app/admin/payments/page.tsx");
  assert.match(page, /עסקאות עדיין ממתינות/);
  assert.match(page, /Order: \{a\.id\}/);
  assert.doesNotMatch(page, /mark.*succeeded|סמן.*שולם/i);
});

test("coupon controls stay dormant until checkout has atomic redemption semantics", () => {
  const collectionRoute = read("app/api/admin/coupons/route.ts");
  assert.match(collectionRoute, /coupon_checkout_not_enabled/);
  assert.doesNotMatch(collectionRoute, /\.from\("coupons"\)\s*\.insert/);

  const itemRoute = read("app/api/admin/coupons/[id]/route.ts");
  assert.match(itemRoute, /if \(parsed\.data\.is_active\)/);
  assert.match(itemRoute, /coupon_checkout_not_enabled/);

  const page = read("app/admin/coupons/page.tsx");
  assert.match(page, /מימוש קופונים אינו מחובר לצ׳קאוט/);
  assert.doesNotMatch(page, /createCoupon|קופון חדש/);

  const checkout = read("app/api/payments/checkout/route.ts");
  assert.match(checkout, /const checkoutSchema = z\.object\([\s\S]*?\)\.strict\(\);/);
  assert.doesNotMatch(checkout, /couponCode/);
});
