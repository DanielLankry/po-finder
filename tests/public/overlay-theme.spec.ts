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
