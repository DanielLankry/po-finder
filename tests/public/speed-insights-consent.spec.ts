import { expect, test } from "@playwright/test";

const speedInsightsScript = 'script[data-sdkn^="@vercel/speed-insights"]';

test("Speed Insights follows optional-cookie consent and revocation", async ({ page }) => {
  await page.route("https://va.vercel-scripts.com/**", (route) => route.abort());
  await page.goto("/auth/login");

  await expect(page.getByRole("dialog", { name: "הסכמה לעוגיות" })).toBeVisible();
  await expect(page.locator(speedInsightsScript)).toHaveCount(0);

  await page.getByRole("button", { name: "אישור" }).click();
  await expect(page.locator(speedInsightsScript)).toHaveCount(1);

  await page.evaluate(() => window.dispatchEvent(new Event("po-cookie-consent-open")));
  await page.getByRole("button", { name: "דחייה" }).click();

  await expect.poll(() => page.evaluate(() => localStorage.getItem("po-cookie-consent"))).toBe("declined");
  await expect(page.locator(speedInsightsScript)).toHaveCount(0);
});

test("Speed Insights stays offline when optional cookies are declined", async ({ page }) => {
  await page.goto("/auth/login");
  await page.getByRole("button", { name: "דחייה" }).click();

  await expect(page.locator(speedInsightsScript)).toHaveCount(0);
});
