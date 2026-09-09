import { test, expect } from "@playwright/test";

test("filter drawer uses the shared neighborhood-paper window theme", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "פתיחת סינון מתקדם" }).click();

  await expect(page.getByRole("heading", { name: "סינון המפה" })).toBeVisible();
  await expect(page.locator('[data-slot="sheet-content"]')).toHaveClass(/brand-canvas/);
  await expect(
    page.locator('[data-slot="sheet-content"] .brand-panel-soft'),
  ).toHaveCount(3);
  await expect(page.getByRole("button", { name: "החל סינון" })).toBeVisible();

  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasOverflow).toBe(false);
});

test("informational pages use the shared product-paper surfaces", async ({ page }) => {
  await page.goto("/about");
  await expect(page.locator("main")).toHaveClass(/brand-canvas/);
  expect(await page.locator("main .brand-panel-soft").count()).toBeGreaterThanOrEqual(5);
  await expect(page.locator("footer")).toHaveClass(/brand-canvas/);

  await page.goto("/contact");
  await expect(page.locator("main")).toHaveClass(/brand-canvas/);
  await expect(page.locator("main .brand-panel").first()).toBeVisible();
  await expect(page.locator("form .brand-control")).toHaveCount(3);

  await page.goto("/vendors");
  await expect(page.locator("footer")).toHaveClass(/brand-canvas/);
});
