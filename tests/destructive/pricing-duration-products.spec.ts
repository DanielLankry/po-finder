import { test, expect } from "@playwright/test";
import {
  admin,
  approveBusiness,
  cleanupTestUser,
  createConfirmedUser,
  createPendingBusinessAsOwner,
  grantDurationPlan,
  signInTestUser,
  TEST_PASSWORD,
  uniqEmail,
} from "../utils/supabase-admin";

test.skip(
  process.env.RUN_DESTRUCTIVE !== "1",
  "destructive flow — set RUN_DESTRUCTIVE=1 to run"
);
test.describe.configure({ mode: "serial" });

test("duration catalog, renewal, month-end, and LIFO refund are enforced by Postgres", async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "run the database lifecycle once");

  const sb = admin();
  const { data: catalog, error: catalogError } = await sb
    .from("plans")
    .select("code, kind, duration_months, boost_days, price")
    .eq("is_active", true)
    .order("sort_order");
  expect(catalogError).toBeNull();
  expect(catalog).toEqual([
    { code: "listing_1d", kind: "listing", duration_months: null, boost_days: 0, price: 300 },
    { code: "listing_7d", kind: "listing", duration_months: null, boost_days: 0, price: 800 },
    ...[1100, 1900, 2600, 3100, 3600, 4100, 4500, 4900, 5200, 5500, 5800, 6100].map(
      (price, index) => ({
        code: `listing_${index + 1}m`,
        kind: "listing",
        duration_months: index + 1,
        boost_days: 0,
        price,
      })
    ),
  ]);

  const { data: retiredBoost } = await sb
    .from("plans")
    .select("is_active")
    .eq("code", "boost_30")
    .single();
  expect(retiredBoost?.is_active).toBe(false);

  const user = await createConfirmedUser({
    email: uniqEmail("duration-pricing"),
    password: TEST_PASSWORD,
    name: "QA Duration Owner",
    role: "business_owner",
  });

  try {
    const ownerClient = await signInTestUser(user);
    const business = await createPendingBusinessAsOwner(ownerClient, {
      ownerId: user.id,
      name: `QA Duration ${Date.now()}`,
    });

    const unverifiedAttempt = await sb
      .from("payment_attempts")
      .insert({
        user_id: user.id,
        business_id: business.id,
        product_code: "listing_6m",
        plan_days: 1,
        duration_months: 1,
        amount_agorot: 1,
        kind: "listing",
        status: "pending",
      })
      .select("id");
    expect(unverifiedAttempt.error, "checkout must reject an unverified draft").not.toBeNull();

    await approveBusiness(business.id);
    const first = await grantDurationPlan({ ownerId: user.id, businessId: business.id });
    const { data: firstAttempt } = await sb
      .from("payment_attempts")
      .select("amount_agorot, plan_days, duration_months, entitlement_base_at, entitlement_expires_at")
      .eq("id", first.id)
      .single();
    expect(firstAttempt).toMatchObject({ amount_agorot: 4100, plan_days: 180, duration_months: 6 });
    expect(firstAttempt?.entitlement_base_at).toBeTruthy();
    expect(firstAttempt?.entitlement_expires_at).toBeTruthy();

    const firstExpiry = firstAttempt!.entitlement_expires_at as string;
    const renewal = await grantDurationPlan({
      ownerId: user.id,
      businessId: business.id,
      productCode: "listing_2m",
    });
    const { data: renewalAttempt } = await sb
      .from("payment_attempts")
      .select("amount_agorot, duration_months, entitlement_base_at, entitlement_expires_at")
      .eq("id", renewal.id)
      .single();
    expect(renewalAttempt).toMatchObject({
      amount_agorot: 1900,
      duration_months: 2,
      entitlement_base_at: firstExpiry,
    });

    const { error: oldPreflight } = await sb.rpc("preflight_refund_payment_entitlement", {
      p_attempt_id: first.id,
    });
    expect(oldPreflight, "an older renewal cannot be refunded before the newest one").not.toBeNull();

    const { error: renewalPreflight } = await sb.rpc("preflight_refund_payment_entitlement", {
      p_attempt_id: renewal.id,
    });
    expect(renewalPreflight).toBeNull();
    const { error: renewalRefund } = await sb.rpc("refund_payment_entitlement", {
      p_attempt_id: renewal.id,
    });
    expect(renewalRefund).toBeNull();
    const { data: afterRenewalRefund } = await sb
      .from("businesses")
      .select("expires_at")
      .eq("id", business.id)
      .single();
    expect(afterRenewalRefund?.expires_at).toBe(firstExpiry);

    const { error: firstRefund } = await sb.rpc("refund_payment_entitlement", {
      p_attempt_id: first.id,
    });
    expect(firstRefund).toBeNull();

    await sb
      .from("businesses")
      .update({
        expires_at: "2027-01-31T12:00:00.000Z",
        is_active: true,
        is_legacy_public: false,
      })
      .eq("id", business.id);
    const monthEnd = await grantDurationPlan({
      ownerId: user.id,
      businessId: business.id,
      productCode: "listing_1m",
    });
    const { data: monthEndAttempt } = await sb
      .from("payment_attempts")
      .select("entitlement_base_at, entitlement_expires_at")
      .eq("id", monthEnd.id)
      .single();
    expect(monthEndAttempt?.entitlement_base_at).toBe("2027-01-31T12:00:00+00:00");
    expect(monthEndAttempt?.entitlement_expires_at).toBe("2027-02-28T12:00:00+00:00");

    const retiredAttempt = await sb
      .from("payment_attempts")
      .insert({
        user_id: user.id,
        business_id: business.id,
        product_code: "boost_30",
        plan_days: 30,
        amount_agorot: 2000,
        kind: "boost",
        status: "pending",
      })
      .select("id");
    expect(retiredAttempt.error, "retired boosts cannot be purchased").not.toBeNull();
  } finally {
    await cleanupTestUser(user.id);
  }
});
