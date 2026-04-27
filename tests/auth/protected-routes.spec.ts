import { test, expect } from '@playwright/test';

const PROTECTED = ['/dashboard', '/dashboard/profile', '/dashboard/billing', '/admin'];

for (const route of PROTECTED) {
  test(`unauth redirect from ${route}`, async ({ page }) => {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response!.status()).toBeLessThan(500);
    const finalUrl = page.url();
    const onAuth = /\/auth\/(login|register)|\/admin\/login/i.test(finalUrl);
    const blocked =
      response!.status() === 401 ||
      response!.status() === 403 ||
      response!.status() === 404;
    expect(
      onAuth || blocked,
      `expected redirect to auth or blocked status, got ${response!.status()} at ${finalUrl}`
    ).toBeTruthy();
  });
}
