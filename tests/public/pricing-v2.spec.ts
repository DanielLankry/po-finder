import { test, expect } from '@playwright/test';

test.describe('pricing v2', () => {
  test('pricing page shows both products', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Listing product
    await expect(page.getByText('רישום שנתי').first()).toBeVisible();
    // Boost product
    await expect(page.getByText('קידום חודשי').first()).toBeVisible();
    // Prices come from the plans table (₪15 / ₪20)
    await expect(page.getByText('₪15').first()).toBeVisible();
    await expect(page.getByText('₪20').first()).toBeVisible();
  });

  test('pricing page has no horizontal overflow', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
  });

  test('checkout API rejects boost without businessId (never 500)', async ({ request }) => {
    const res = await request.post('/api/payments/checkout', {
      data: { kind: 'boost' },
    });
    // 401 unauthenticated (no session in test) or 400 validation.
    expect([400, 401]).toContain(res.status());
  });

  test('checkout API rejects legacy planDays body', async ({ request }) => {
    const res = await request.post('/api/payments/checkout', {
      data: { planDays: 30 },
    });
    expect([400, 401]).toContain(res.status());
  });

  test('businesses API exposes boosted flag and sorts boosted first', async ({ request }) => {
    const res = await request.get('/api/businesses');
    expect(res.ok()).toBe(true);
    const data = (await res.json()) as {
      businesses?: { boosted?: boolean }[];
    };
    const businesses = data.businesses ?? [];
    // Every item carries the computed flag.
    for (const b of businesses) {
      expect(typeof b.boosted).toBe('boolean');
    }
    // Boosted block strictly precedes non-boosted block.
    const firstNormal = businesses.findIndex((b) => !b.boosted);
    if (firstNormal !== -1) {
      for (const b of businesses.slice(firstNormal)) {
        expect(b.boosted).toBe(false);
      }
    }
  });

  test('homepage loads without horizontal overflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
  });
});
