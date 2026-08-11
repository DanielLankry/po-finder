import { expect, test } from "@playwright/test";

const promotion = {
  code: "first-20-3m",
  capacity: 20,
  claimedCount: 7,
  remaining: 13,
  durationMonths: 3,
  startsAt: "2026-08-11T00:00:00.000Z",
  enrollmentEndsAt: "2026-12-31T21:59:59.000Z",
  isOpen: true,
};

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 860 });
  await page.addInitScript(() => localStorage.setItem("po-cookie-consent", "accepted"));
  await page.route("**/api/promotions/first-20", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ promotion }),
    });
  });
});
test("the launch offer opens only once per browser session", async ({ page }) => {
  await page.route("**/api/businesses?includeSchedule=1", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ businesses: [] }),
    });
  });

  await page.goto("/");
  const modal = page.getByTestId("first-businesses-offer-modal");
  await expect(modal).toBeVisible();
  await expect(modal.getByTestId("promotion-remaining")).toHaveText("13 מתוך 20");
  await modal.getByRole("button", { name: "סגירה" }).click();

  await page.reload();
  await page.waitForTimeout(1_000);
  await expect(modal).toHaveCount(0);
  await expect(page.getByTestId("promotion-list-banner")).toContainText("נותרו 13");
});

test("a zero-result search never substitutes the example for a real platform", async ({ page }) => {
  await page.route("**/api/businesses?includeSchedule=1", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        businesses: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            name: "עסק אמיתי",
            description: "עסק בדיקה",
            category: "coffee",
            address: "תל אביב",
            lat: 32.0853,
            lng: 34.7818,
            weekly_hours: null,
            phone: null,
            whatsapp: null,
            website: null,
            instagram: null,
            kashrut: "none",
            avg_rating: 0,
            review_count: 0,
            is_active: true,
            is_verified: true,
            created_at: "2026-08-11T00:00:00.000Z",
            expires_at: "2026-12-01T00:00:00.000Z",
            photos: [],
            today_schedule: null,
            hours_status: "unknown",
          },
        ],
      }),
    });
  });

  await page.goto("/");
  const modal = page.getByTestId("first-businesses-offer-modal");
  await expect(modal).toBeVisible();
  await modal.getByRole("button", { name: "סגירה" }).click();

  await page.getByPlaceholder("חפש עסק, שכונה, מוצר...").fill("לא קיים");
  await expect(page.getByText("לא נמצאו עסקים זמינים כרגע").first()).toBeVisible();
  await expect(page.getByTestId("example-business-card")).toHaveCount(0);
});
