import { expect, test } from "@playwright/test";

const existingBusiness = {
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
};

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 860 });
  await page.addInitScript(() => localStorage.setItem("po-cookie-consent", "accepted"));
});

test("a truly empty launch links the first-business CTA to pricing", async ({ page }) => {
  const promotionRequests: string[] = [];
  const dialogWarnings: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/promotions/first-20")) {
      promotionRequests.push(request.url());
    }
  });
  page.on("console", (message) => {
    if (
      message.type() === "warning" &&
      message.text().includes("Missing `Description` or `aria-describedby={undefined}`")
    ) {
      dialogWarnings.push(message.text());
    }
  });
  await page.route("**/api/businesses?includeSchedule=1", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ businesses: [] }),
    });
  });

  await page.goto("/");

  const example = page.getByTestId("example-business-card");
  await expect(example).toBeVisible();
  await expect(example.getByText("עסק לדוגמה", { exact: true })).toBeVisible();
  await expect(example.getByText("נונה קפה", { exact: true })).toBeVisible();
  await expect(example.getByRole("button", { name: "נונה קפה — קפה ושתייה" })).toBeDisabled();
  await expect(example.getByRole("button", { name: "שמור למועדפים" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "פרסמו את העסק הראשון" })).toHaveAttribute(
    "href",
    "/pricing",
  );
  await expect(page.getByTestId("first-businesses-offer-modal")).toHaveCount(0);
  await expect(page.getByTestId("promotion-list-banner")).toHaveCount(0);
  expect(promotionRequests).toEqual([]);
  expect(dialogWarnings).toEqual([]);
});

test("a zero-result search retains the ordinary filter state", async ({ page }) => {
  await page.route("**/api/businesses?includeSchedule=1", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ businesses: [existingBusiness] }),
    });
  });

  await page.goto("/");
  await page.getByPlaceholder("חפש עסק, שכונה, מוצר...").fill("לא קיים");

  await expect(page.getByText("לא נמצאו עסקים זמינים כרגע").first()).toBeVisible();
  await expect(page.getByText("נסו לשנות את הפילטרים")).toBeVisible();
  await expect(page.getByTestId("example-business-card")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "פרסמו את העסק הראשון" })).toHaveCount(0);
});
