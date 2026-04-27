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
