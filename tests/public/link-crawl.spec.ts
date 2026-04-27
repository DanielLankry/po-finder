import { test, expect, request as pwRequest } from '@playwright/test';

test('nav and footer links return 2xx/3xx', async ({ page, baseURL }) => {
  await page.goto('/');
  const hrefs = await page
    .locator('a[href]')
    .evaluateAll((els) => Array.from(new Set(els.map((a) => (a as HTMLAnchorElement).href))));

  const base = new URL(baseURL!);
  const internal = hrefs
    .filter((h) => {
      try {
        const u = new URL(h);
        return u.host === base.host;
      } catch {
        return false;
      }
    })
    .filter((h) => !/\.(jpg|png|svg|webp|ico|pdf)$/i.test(h))
    .filter((h) => !/^mailto:|^tel:/i.test(h));

  const ctx = await pwRequest.newContext({ baseURL });
  const results: { url: string; status: number }[] = [];
  for (const url of internal) {
    try {
      const res = await ctx.get(url, { maxRedirects: 5, timeout: 15_000 });
      results.push({ url, status: res.status() });
    } catch (e) {
      results.push({ url, status: 0 });
    }
  }
  await ctx.dispose();

  const broken = results.filter((r) => r.status >= 400 || r.status === 0);
  expect(
    broken,
    `broken links:\n${broken.map((b) => `${b.status} ${b.url}`).join('\n')}`
  ).toEqual([]);
});
