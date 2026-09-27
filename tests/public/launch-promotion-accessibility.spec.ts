import { expect, test } from "@playwright/test";

const promotion = {
  code: "first-20-3m",
  capacity: 20,
  durationMonths: 3,
  startsAt: "2026-08-11T00:00:00.000Z",
  enrollmentEndsAt: "2026-12-31T21:59:59.000Z",
  isOpen: true,
};

test("cookie consent resolves before the launch offer becomes modal", async ({ page }) => {
  await page.route("**/api/promotions/first-20", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ promotion }),
    });
  });
  await page.route("**/api/businesses?includeSchedule=1", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ businesses: [] }),
    });
  });

  await page.goto("/");

  const cookieDialog = page.getByRole("dialog", { name: "הסכמה לעוגיות" });
  const offerDialog = page.getByTestId("first-businesses-offer-modal");
  await expect(cookieDialog).toBeVisible();
  await page.waitForTimeout(1_000);
  await expect(offerDialog).toHaveCount(0);

  await cookieDialog.getByRole("button", { name: "דחייה" }).click();
  await expect(cookieDialog).toHaveCount(0);
  await expect(offerDialog).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(1);
});
