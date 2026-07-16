import { expect, test } from "@playwright/test";

const MOBILE_ROUTES = [
  "/",
  "/pricing",
  "/vendors",
  "/about",
  "/contact",
  "/auth/login",
  "/auth/register",
];

test.describe("mobile layout regression coverage", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip((testInfo.project.use.viewport?.width ?? 1440) >= 1440, "mobile-only layout check");
    await page.addInitScript(() => localStorage.setItem("po-cookie-consent", "accepted"));
  });

  test("navbar is balanced and contained", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/");

    const header = page.locator("header").first();
    const nav = page.getByRole("navigation", { name: "ניווט ראשי" });
    const logo = page.getByRole("link", { name: /פה קרוב — דף הבית/ });
    const actions = page.getByTestId("navbar-actions");

    await expect(header).toBeVisible();
    await expect(nav).toBeVisible();
    await expect(page.getByRole("button", { name: "פתיחת חיפוש" })).toBeVisible();
    await expect(page.getByRole("button", { name: "מועדפים" })).toBeVisible();
    const menuButton = page.getByRole("button", { name: "פתיחת תפריט", exact: true });
    await expect(menuButton).toBeVisible();
    await expect(page.getByRole("button", { name: "פתיחת תפריט נגישות" })).toBeHidden();

    const [headerBox, logoBox, actionsBox] = await Promise.all([
      header.boundingBox(),
      logo.boundingBox(),
      actions.boundingBox(),
    ]);

    expect(headerBox?.height).toBeLessThanOrEqual(74);
    expect(actionsBox!.x).toBeGreaterThanOrEqual(0);
    expect(logoBox!.x + logoBox!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    expect(actionsBox!.x + actionsBox!.width).toBeLessThan(logoBox!.x);

    await menuButton.click();
    await expect(page.getByRole("link", { name: "נגישות", exact: true })).toBeVisible();
  });

  for (const route of MOBILE_ROUTES) {
    test(`${route} stays inside the mobile viewport`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBeLessThan(400);
      await expect(page.locator("body")).toBeVisible();

      const dimensions = await page.evaluate(() => ({
        bodyWidth: document.body.scrollWidth,
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      }));

      expect(dimensions.bodyWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
      expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);

      if (route.startsWith("/auth/")) {
        const panelBox = await page.locator(".brand-panel").first().boundingBox();
        expect(panelBox?.x).toBeGreaterThanOrEqual(0);
        expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(dimensions.viewportWidth);
      }
    });
  }

  test("a single business photo fills its mobile gallery", async ({ page }) => {
    const response = await page.request.get("/api/businesses");
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as { businesses: Array<{ id: string; photos?: unknown[] }> };
    const business = data.businesses.find((item) => item.photos?.length === 1);
    test.skip(!business, "no public single-photo business exists in the launch database");

    await page.goto(`/businesses/${business!.id}`);
    const grid = page.getByTestId("photo-grid");
    const primary = page.getByTestId("photo-grid-primary");
    await expect(grid).toHaveAttribute("data-photo-count", "1");

    const [gridBox, primaryBox] = await Promise.all([grid.boundingBox(), primary.boundingBox()]);
    expect(primaryBox!.width).toBeGreaterThanOrEqual(gridBox!.width - 1);
  });

  test("an empty launch invites the first business in Hebrew", async ({ page }) => {
    await page.route("**/api/businesses?includeSchedule=1", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ businesses: [] }) });
    });

    await page.goto("/");
    await expect(page.getByText("היו העסק הראשון בפלטפורמה החדשה שלנו").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "פרסמו את העסק הראשון" })).toHaveAttribute("href", "/pricing");
  });
});
