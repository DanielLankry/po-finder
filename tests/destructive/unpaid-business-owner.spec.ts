import { test, expect } from '@playwright/test';
import {
  createConfirmedUser,
  cleanupTestUser,
  uniqEmail,
  TEST_PASSWORD,
  getOwnerBusinesses,
} from '../utils/supabase-admin';
import { loginViaUI } from '../utils/login';

test.skip(process.env.RUN_DESTRUCTIVE !== '1', 'destructive flow — set RUN_DESTRUCTIVE=1 to run');
test.describe.configure({ mode: 'serial' });

test('unpaid business owner is hard-blocked from creating a business (RLS paywall)', async ({
  page,
}) => {
  const email = uniqEmail('unpaid-owner');
  const user = await createConfirmedUser({
    email,
    password: TEST_PASSWORD,
    name: 'QA Free Owner',
    role: 'business_owner',
  });

  try {
    // 1. Login via UI as a fresh, unpaid business owner
    await loginViaUI(page, user.email, user.password);

    // 2. Dashboard shows the empty-state CTA prompting them to add a business
    await page.goto('/dashboard');
    const emptyCta = page.getByRole('link', { name: /יצירת פרופיל עסק/ }).first();
    await expect(emptyCta, 'expected empty-state CTA for new owner').toBeVisible({ timeout: 15_000 });

    // 3. Profile form: fill required fields and submit
    await page.goto('/dashboard/profile');
    const nameInput = page.locator('form input').first();
    await expect(nameInput).toBeVisible({ timeout: 15_000 });
    const businessName = `QA Unpaid ${Date.now()}`;
    await nameInput.fill(businessName);

    const desc = page.locator('form textarea').first();
    if (await desc.count()) {
      await desc.fill('QA test — RLS should block this insert until subscription_status is set');
    }

    await page.locator('form button[type="submit"]').first().click();

    // 4. PAYWALL ASSERTION (per migration 015 RLS policy):
    //    user_is_subscribed() must be true to INSERT a business. An unpaid user's
    //    INSERT therefore fails server-side. We allow up to 8s for the round-trip,
    //    then assert: success toast did NOT appear, AND no row exists in DB.
    await page.waitForTimeout(8_000);

    const successCount = await page.locator('text=נשמרו בהצלחה').count();
    expect(successCount, 'success toast must NOT appear for unpaid owner').toBe(0);

    const owned = await getOwnerBusinesses(user.id);
    expect(
      owned.length,
      'RLS paywall should have blocked the insert — no business row may exist for unpaid owner'
    ).toBe(0);

    // 5. The user's only path forward is the pricing page. It must be reachable
    //    and present at least one plan / CTA button.
    await page.goto('/pricing');
    await expect(page.locator('body')).toBeVisible();
    const planButtons = page.getByRole('button');
    expect(await planButtons.count(), 'pricing page should expose at least one plan CTA').toBeGreaterThan(0);
  } finally {
    await cleanupTestUser(user.id);
  }
});
