import { test, expect } from '@playwright/test';

test('robots.txt is served', async ({ request }) => {
  const res = await request.get('/robots.txt');
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body.toLowerCase()).toContain('user-agent');
});

test('sitemap.xml is served and parses', async ({ request }) => {
  const res = await request.get('/sitemap.xml');
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toMatch(/<urlset|<sitemapindex/);
  expect(body).toContain('pokarov.co.il');
});

test('bogus url returns 404', async ({ page }) => {
  const res = await page.goto('/this-page-definitely-does-not-exist-xyz123');
  expect(res!.status()).toBe(404);
});

test('home has og + title meta', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/.+/);
  const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
  expect(ogTitle, 'og:title missing').toBeTruthy();
});
