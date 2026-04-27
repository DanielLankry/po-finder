import { test, expect } from '@playwright/test';
import { collectErrors } from '../utils/console';

const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/contact',
  '/pricing',
  '/vendors',
  '/privacy',
  '/terms',
  '/refund',
  '/accessibility',
];

for (const route of PUBLIC_ROUTES) {
  test(`public page loads: ${route}`, async ({ page }) => {
    const errors = collectErrors(page);
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response, `no response for ${route}`).not.toBeNull();
    expect(response!.status(), `bad status on ${route}`).toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('header, nav, main, [role="main"]').first()).toBeVisible();
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    expect(errors, `console errors on ${route}:\n${errors.join('\n')}`).toEqual([]);
  });
}

test('contact page renders form', async ({ page }) => {
  await page.goto('/contact');
  const form = page.locator('form').first();
  await expect(form).toBeVisible();
  const inputs = form.locator('input, textarea');
  expect(await inputs.count()).toBeGreaterThan(0);
});
