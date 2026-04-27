import { expect, type Page } from '@playwright/test';

const TOUR_KEY = 'pofkarov.tour.state';
const TOUR_DISABLED = JSON.stringify({ active: false, stepIndex: -1 });

export async function loginViaUI(
  page: Page,
  email: string,
  password: string,
  redirectTo = '/dashboard'
) {
  // Disable the driver.js onboarding tour on every page in this context
  await page.addInitScript(
    ([k, v]) => {
      try {
        window.localStorage.setItem(k, v);
      } catch {
        /* ignore */
      }
    },
    [TOUR_KEY, TOUR_DISABLED]
  );

  await page.goto(`/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('form button[type="submit"]').click();
  await expect(page, 'expected login redirect away from /auth/login').not.toHaveURL(
    /\/auth\/login/,
    { timeout: 20_000 }
  );
}
