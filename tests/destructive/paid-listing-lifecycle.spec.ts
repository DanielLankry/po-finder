import { test, expect, request as pwRequest } from '@playwright/test';
import {
  admin,
  approveBusiness,
  cleanupTestUser,
  createConfirmedUser,
  createPendingBusinessAsOwner,
  expireBusinessListing,
  grantDurationPlan,
  signInTestUser,
  TEST_PASSWORD,
  uniqEmail,
} from '../utils/supabase-admin';
import { loginViaUI } from '../utils/login';

// Exercises the complete paid-listing lifecycle against real Auth, RLS, and
// public routes so a payment grant cannot leak into unlimited public listings.
test.skip(process.env.RUN_DESTRUCTIVE !== '1', 'destructive flow — set RUN_DESTRUCTIVE=1 to run');
test.describe.configure({ mode: 'serial' });

test('listing grant is consumed once and expiry removes every public surface', async ({
  baseURL,
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'run the database lifecycle once');

  const email = uniqEmail('paid-lifecycle');
  const businessName = `QA Paid Lifecycle ${Date.now()}`;
  const user = await createConfirmedUser({
    email,
    password: TEST_PASSWORD,
    name: 'QA Paid Lifecycle Owner',
    role: 'business_owner',
  });
  let ctx: Awaited<ReturnType<typeof pwRequest.newContext>> | null = null;

  try {
    const ownerClient = await signInTestUser(user);
    const business = await createPendingBusinessAsOwner(ownerClient, {
      ownerId: user.id,
      name: businessName,
    });
    await approveBusiness(business.id);
    const grant = await grantDurationPlan({ ownerId: user.id, businessId: business.id });

    const [{ data: payment, error: paymentError }, { data: paidBusiness, error: businessError }] =
      await Promise.all([
        admin()
          .from('payment_attempts')
          .select('business_id, product_code, status, kind, plan_days, duration_months, amount_agorot')
          .eq('id', grant.id)
          .single(),
        admin()
          .from('businesses')
          .select('is_verified, is_active, expires_at')
          .eq('id', business.id)
          .single(),
      ]);

    expect(paymentError).toBeNull();
    expect(businessError).toBeNull();
    expect(payment).toMatchObject({
      business_id: business.id,
      product_code: 'listing_6m',
      status: 'succeeded',
      kind: 'listing',
      plan_days: 180,
      duration_months: 6,
      amount_agorot: 16000,
    });
    expect(paidBusiness?.is_verified).toBe(true);
    expect(paidBusiness?.is_active).toBe(true);
    expect(Date.parse(paidBusiness?.expires_at ?? '')).toBeGreaterThan(Date.now());

    ctx = await pwRequest.newContext({ baseURL });
    const paidList = await ctx.get(`/api/businesses?qa=${Date.now()}`);
    expect(paidList.status()).toBe(200);
    const paidJson = await paidList.json();
    expect(
      (paidJson.businesses ?? []).some((item: { id: string }) => item.id === business.id),
      'paid and approved business should be public'
    ).toBe(true);

    const paidDetail = await ctx.get(`/businesses/${business.id}?qa=${Date.now()}`);
    expect(paidDetail.status()).toBe(200);

    await expireBusinessListing(business.id);

    const expiredList = await ctx.get(`/api/businesses?qa=${Date.now()}`);
    expect(expiredList.status()).toBe(200);
    const expiredJson = await expiredList.json();
    expect(
      (expiredJson.businesses ?? []).some((item: { id: string }) => item.id === business.id),
      'expired business must disappear even if is_active remains true'
    ).toBe(false);

    const expiredDetail = await ctx.get(`/businesses/${business.id}?qa=${Date.now()}`);
    expect(expiredDetail.status(), 'expired business detail must not remain public').toBe(404);

    const expiredSitemap = await ctx.get(`/sitemap.xml?qa=${Date.now()}`);
    expect(expiredSitemap.status()).toBe(200);
    expect(
      await expiredSitemap.text(),
      'expired business must not remain in the public sitemap'
    ).not.toContain(`/businesses/${business.id}`);

    const { data: ownerBusinesses, error: ownerReadError } = await ownerClient
      .rpc('get_my_businesses');
    expect(ownerReadError).toBeNull();
    expect(
      (ownerBusinesses as Array<{ id: string }> | null)?.some(
        (item) => item.id === business.id
      ),
      'expired owner must still be able to read billing data'
    ).toBe(true);

    const { data: ownerPayments, error: paymentReadError } = await ownerClient
      .from('payment_attempts')
      .select('id, business_id, status, kind, plan_days')
      .eq('id', grant.id);
    expect(paymentReadError).toBeNull();
    expect(ownerPayments?.some((item) => item.id === grant.id)).toBe(true);

    await loginViaUI(page, user.email, user.password);
    const billingPage = await page.goto('/dashboard/billing');
    expect(billingPage?.status()).toBeLessThan(400);
    await expect(page.locator('body')).toContainText(businessName);
    await expect(page.locator('text=לא מופיע לציבור').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /פרסום העסק ל־6 חודשים/ }).first()).toBeVisible();

    // BrowserContext requests share the signed-in owner's cookies. This is the
    // critical regression: the owner RLS policy may expose the expired row for
    // billing, but the public discovery API must still hide it.
    const ownerPublicList = await page.request.get(`/api/businesses?qa=owner-${Date.now()}`);
    expect(ownerPublicList.status()).toBe(200);
    const ownerPublicJson = await ownerPublicList.json();
    expect(
      (ownerPublicJson.businesses ?? []).some((item: { id: string }) => item.id === business.id),
      'expired business must not appear publicly for its signed-in owner'
    ).toBe(false);

    await page.goto(`/?qa=owner-${Date.now()}`);
    await expect(page.locator('body')).not.toContainText(businessName);

    const expiryTamper = await ownerClient
      .from('businesses')
      .update({ expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() })
      .eq('id', business.id)
      .select('id');
    expect(expiryTamper.error, 'owner must not extend expires_at without payment').not.toBeNull();
    expect(expiryTamper.data ?? []).toHaveLength(0);

    const activationTamper = await ownerClient
      .from('businesses')
      .update({ is_active: false })
      .eq('id', business.id)
      .select('id');
    expect(activationTamper.error, 'owner must not change admin approval state').not.toBeNull();
    expect(activationTamper.data ?? []).toHaveLength(0);

    const { error: staleStatusError } = await admin()
      .from('users')
      .update({ subscription_status: 'active' })
      .eq('id', user.id);
    expect(staleStatusError).toBeNull();

    const secondInsert = await ownerClient
      .from('businesses')
      .insert({
        owner_id: user.id,
        name: `QA Must Be Rejected ${Date.now()}`,
        description: 'An expired or consumed listing grant must not create another business',
        category: 'coffee',
        address: 'QA Test Address, Tel Aviv',
        lat: 32.0853,
        lng: 34.7818,
        kashrut: 'none',
        is_active: false,
      })
      .select('id');
    expect(
      secondInsert.error,
      'the consumed grant and adversarial stale profile flag must not authorize a second business'
    ).not.toBeNull();
    expect(secondInsert.data ?? []).toHaveLength(0);
  } finally {
    await ctx?.dispose();
    await cleanupTestUser(user.id);
  }
});
