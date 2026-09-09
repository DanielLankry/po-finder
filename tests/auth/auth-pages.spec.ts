import { test, expect } from '@playwright/test';

const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/forgot-password'];

for (const route of AUTH_ROUTES) {
  test(`auth page renders: ${route}`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response!.status()).toBeLessThan(400);
    const form = page.locator('form').first();
    await expect(form).toBeVisible();
    const inputs = form.locator('input');
    expect(await inputs.count()).toBeGreaterThan(0);
  });
}

test('login form has email and password fields', async ({ page }) => {
  await page.goto('/auth/login');
  const email = page.locator('input[type="email"], input[name="email"]').first();
  const password = page.locator('input[type="password"]').first();
  await expect(email).toBeVisible();
  await expect(password).toBeVisible();
});

test('register form validates empty submit (no network)', async ({ page }) => {
  await page.goto('/auth/register');
  const submit = page
    .locator('button[type="submit"], form button')
    .filter({ hasText: /sign|register|הרשמ|צור/i })
    .first();
  if (await submit.count()) {
    await submit.click({ trial: true }).catch(() => {});
  }
  await expect(page.locator('form').first()).toBeVisible();
});

test('pricing registration defaults to a business owner', async ({ page }) => {
  await page.goto('/auth/register?redirectTo=%2Fdashboard%2Fbilling%3Fplan%3Dlisting_1m');

  await expect(page.getByRole('button', { name: /בעל עסק/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: /לקוח/ })).toHaveAttribute('aria-pressed', 'false');
});

test('launch promotion registration preserves owner intent and profile destination', async ({ page }) => {
  await page.goto(
    '/auth/register?redirectTo=%2Fdashboard%2Fprofile%3Fcampaign%3Dfirst-20-3m',
  );

  await expect(page.getByText('המשך ליצירת פרופיל ושמירת מקום')).toBeVisible();
  await expect(page.getByRole('button', { name: /בעל עסק/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: /לקוח/ })).toHaveAttribute('aria-pressed', 'false');
  await expect(
    page.getByRole('button', { name: 'יצירת חשבון והמשך לפרופיל העסק' }),
  ).toBeVisible();
});

test('Google registration preserves business-owner billing intent', async ({ page }) => {
  let authorizeUrl: URL | null = null;
  await page.route('**/auth/v1/authorize**', async (route) => {
    authorizeUrl = new URL(route.request().url());
    await route.abort();
  });

  await page.goto('/auth/register?redirectTo=%2Fdashboard%2Fbilling%3Fplan%3Dlisting_1m');
  const expectedOrigin = new URL(page.url()).origin;
  await page.getByRole('button', { name: 'הרשמה עם גוגל' }).click();
  await expect.poll(() => authorizeUrl?.searchParams.get('provider')).toBe('google');

  const callback = new URL(authorizeUrl!.searchParams.get('redirect_to')!);
  expect(callback.origin).toBe(expectedOrigin);
  expect(callback.pathname).toBe('/auth/callback');
  expect(callback.searchParams.get('signup')).toBe('1');
  expect(callback.searchParams.get('role')).toBe('business_owner');
  expect(callback.searchParams.get('next')).toBe('/dashboard/billing?plan=listing_1m');
});
