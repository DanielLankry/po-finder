import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROUTES = ["/", "/pricing", "/auth/login"] as const;

test.describe("WCAG AA color contrast", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("po-cookie-consent", "declined"));
  });

  for (const route of ROUTES) {
    test(`${route} has no color contrast violations`, async ({ page }) => {
      if (route === "/") {
        await page.route("**/api/businesses*", async (routeHandler) => {
          await routeHandler.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ businesses: [] }),
          });
        });
      }

      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBeLessThan(400);
      await expect(page.locator("body")).toBeVisible();

      if (route === "/") {
        await expect(
          page.getByText("היו העסק הראשון בפלטפורמה החדשה שלנו").first(),
        ).toBeVisible();
      } else if (route === "/pricing") {
        await expect(page.getByRole("slider", { name: "משך הפרסום" })).toBeVisible();
      } else {
        await expect(page.getByLabel("כתובת מייל")).toBeVisible();
      }

      const { violations } = await new AxeBuilder({ page })
        .withRules(["color-contrast"])
        .analyze();

      expect(
        violations,
        `color contrast violations on ${route}:\n${JSON.stringify(violations, null, 2)}`,
      ).toEqual([]);
    });
  }
});
