import { test, expect, request as pwRequest } from '@playwright/test';
import {
  createConfirmedUser,
  cleanupTestUser,
  uniqEmail,
  TEST_PASSWORD,
  seedPaidActiveBusiness,
} from '../utils/supabase-admin';
import { loginViaUI } from '../utils/login';

test.skip(process.env.RUN_DESTRUCTIVE !== '1', 'destructive flow — set RUN_DESTRUCTIVE=1 to run');
test.describe.configure({ mode: 'serial' });

test('paid business owner: dashboard surfaces every area they need', async ({ page, baseURL }) => {
  const email = uniqEmail('paid-owner');
  const businessName = `QA Paid Coffee ${Date.now()}`;
  const user = await createConfirmedUser({
    email,
    password: TEST_PASSWORD,
    name: 'QA Paid Owner',
    role: 'business_owner',
  });
  const biz = await seedPaidActiveBusiness({
    ownerId: user.id,
    name: businessName,
    monthsValid: 3,
  });

  try {
    await loginViaUI(page, user.email, user.password);

    // 1. Dashboard home shows the paid business with green / active expiry badge
    await page.goto('/dashboard');
    const body = page.locator('body');
    await expect(body).toContainText(businessName, { timeout: 15_000 });

    const activeBadge = page.locator('text=/פעיל עד/').first();
    await expect(activeBadge, 'paid business should show "active until" badge').toBeVisible();

    // 2. Today's status card visible
    await expect(page.locator('text=סטטוס היום').first()).toBeVisible();

    // 3. Three stat cards (rating, reviews, photos)
    await expect(page.locator('text=דירוג ממוצע').first()).toBeVisible();
    await expect(page.locator('text=ביקורות').first()).toBeVisible();
    await expect(page.locator('text=ניהול תמונות').first()).toBeVisible();

    // 4. Analytics widget — last 30 days
    await expect(page.locator('text=אנליטיקה').first()).toBeVisible();
    await expect(page.locator('text=צפיות').first()).toBeVisible();

    // 5. Share section
    await expect(page.locator('text=שתף').first()).toBeVisible();

    // 6. Quick links: public page + edit profile
    const publicLink = page.getByRole('link', { name: /צפייה בדף הציבורי/ }).first();
    await expect(publicLink).toBeVisible();

    // 7. Each dashboard sub-area renders
    const subRoutes = [
      { path: '/dashboard/profile', expect: /עריכת פרטי העסק|יצירת פרופיל/ },
      { path: '/dashboard/schedule', expect: /.+/ },
      { path: '/dashboard/photos', expect: /.+/ },
      { path: '/dashboard/billing', expect: /.+/ },
    ];
    for (const r of subRoutes) {
      const res = await page.goto(r.path);
      expect(res!.status(), `${r.path} should load`).toBeLessThan(400);
      await expect(page.locator('body')).toBeVisible();
      if (r.expect.source !== '.+') {
        await expect(page.locator('body')).toContainText(r.expect);
      }
    }

    // 8. Business owner's profile page is prefilled with the seeded business name
    await page.goto('/dashboard/profile');
    const nameInput = page.locator('form input').first();
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveValue(businessName, { timeout: 10_000 });

    // 9. Public listing INCLUDES the active paid business
    const ctx = await pwRequest.newContext({ baseURL });
    const res = await ctx.get('/api/businesses');
    expect(res.status()).toBe(200);
    const json = await res.json();
    const found = (json.businesses ?? []).some((b: { name: string }) => b.name === businessName);
    expect(found, 'active paid business MUST appear in public /api/businesses').toBe(true);
    await ctx.dispose();

    // 10. Public detail page renders for the business
    const detail = await page.goto(`/businesses/${biz.id}`);
    expect(detail!.status()).toBeLessThan(400);
    await expect(page.locator('body')).toContainText(businessName);
  } finally {
    await cleanupTestUser(user.id);
  }
});
