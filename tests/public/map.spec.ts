import { test, expect } from '@playwright/test';
import { collectErrors } from '../utils/console';

test('home renders map and search', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();

  const mapContainer = page.locator(
    '[aria-label*="Map"], [aria-label*="מפה"], [class*="map" i], [data-testid*="map" i]'
  ).first();
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
  const buttons = page.getByRole('button');
  const count = await buttons.count();
  expect(count, 'expected interactive buttons on home').toBeGreaterThan(0);
});
