import { test, expect } from '@playwright/test';
import {
  createConfirmedUser,
  cleanupTestUser,
  uniqEmail,
  TEST_PASSWORD,
  getOwnerBusinesses,
  signInTestUser,
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

    // 2. The dashboard guard sends a fresh unpaid owner to pricing.
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/pricing\?reason=no_subscription/, { timeout: 15_000 });
    await expect(page.locator('body')).toContainText(/רישום שנתי/);

    // 3. Probe the database boundary directly as the authenticated owner.
    //    UI routing is not the security boundary, so RLS must independently
    //    reject an INSERT without an unconsumed listing payment.
    const ownerClient = await signInTestUser(user);
    const businessName = `QA Unpaid ${Date.now()}`;
    const insert = await ownerClient
      .from('businesses')
      .insert({
        owner_id: user.id,
        name: businessName,
        description: 'QA test — RLS must require an unconsumed listing credit',
        category: 'coffee',
        kashrut: 'none',
        is_active: false,
      })
      .select('id');
    expect(insert.error, 'RLS must reject an unpaid business INSERT').not.toBeNull();
    expect(insert.data ?? []).toHaveLength(0);

    const owned = await getOwnerBusinesses(user.id);
    expect(
      owned.length,
      'RLS paywall should have blocked the insert — no business row may exist for unpaid owner'
    ).toBe(0);

    // 4. Pricing exposes the paid path forward.
    const planButtons = page.getByRole('button');
    expect(await planButtons.count(), 'pricing page should expose at least one plan CTA').toBeGreaterThan(0);
  } finally {
    await cleanupTestUser(user.id);
  }
});
