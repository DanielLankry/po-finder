import { test, expect } from '@playwright/test';
import { collectErrors } from '../utils/console';
import { completeFirstVisit } from '../utils/first-visit';

test('home renders map and search', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await completeFirstVisit(page);
  await expect(page.locator('body')).toBeVisible();

  if ((page.viewportSize()?.width ?? 1440) < 1440) {
    await page.getByRole('button', { name: 'עבור למפה' }).click();
  }

  const mapContainer = page.getByTestId('business-map-panel');
  await expect(mapContainer, 'map container should mount').toBeVisible({ timeout: 15_000 });

  const searchInput = page.getByRole('textbox').first();
  if (await searchInput.count()) {
    await searchInput.fill('test');
    await expect(searchInput).toHaveValue('test');
    await searchInput.fill('');
  }

  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
  expect(errors, `console errors on /:\n${errors.join('\n')}`).toEqual([]);
});

test('home has interactive controls', async ({ page }) => {
  await page.goto('/');
  await completeFirstVisit(page);

  await expect(page.getByRole('button', { name: 'פתיחת סינון מתקדם' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'מועדפים' })).toBeVisible();
});
