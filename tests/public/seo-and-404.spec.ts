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
  for (const route of ['/pricing', '/vendors', '/accessibility']) {
    expect(body).toContain(`<loc>https://pokarov.co.il${route}</loc>`);
  }
});

for (const route of ['/', '/about', '/pricing', '/vendors', '/accessibility']) {
  test(`canonical points to the current public route: ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      route === '/' ? 'https://pokarov.co.il' : `https://pokarov.co.il${route}`,
    );
  });
}

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
