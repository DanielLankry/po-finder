import { expect, test } from "@playwright/test";

const unknownBusiness = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "עסק ללא שעות",
  description: "עסק בדיקה שצריך להישאר גלוי",
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
  avg_rating: 4.8,
  review_count: 3,
  is_active: true,
  is_verified: true,
  created_at: "2026-07-15T00:00:00.000Z",
  hours_status: "unknown",
  today_schedule: null,
  photos: [
    {
      id: "33333333-3333-4333-8333-333333333333",
      business_id: "11111111-1111-4111-8111-111111111111",
      url: "/missing-business-photo.webp",
      is_primary: true,
      created_at: "2026-07-15T00:00:00.000Z",
    },
  ],
};

const closedBusiness = {
  ...unknownBusiness,
  id: "22222222-2222-4222-8222-222222222222",
  name: "עסק סגור",
  category: "food",
  lat: 32.087,
  lng: 34.783,
  hours_status: "closed",
};

test("confirmed-closed businesses stay off both the list and map", async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => {
    localStorage.setItem("po-cookie-consent", "declined");
  });
  await page.route("**/api/businesses?includeSchedule=1", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ businesses: [unknownBusiness, closedBusiness] }),
    });
  });

  await page.goto("/");

  await expect(page.getByRole("button", { name: /עסק ללא שעות —/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /עסק סגור —/ })).toHaveCount(0);
  await expect(page.getByRole("img", { name: "תמונה של עסק ללא שעות" })).toBeVisible();

  if ((testInfo.project.use.viewport?.width ?? 1440) < 1440) {
    await page.getByRole("button", { name: "עבור למפה" }).click();
  }

  const marker = page.getByRole("button", {
    name: /עסק ללא שעות — קפה ושתייה, שעות הפעילות לא ידועות/,
  });
  await expect(marker).toBeVisible({ timeout: 25_000 });
  await expect(page.getByRole("button", { name: /עסק סגור — אוכל/ })).toHaveCount(0);

  const box = await marker.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);

  await marker.click();
  if ((testInfo.project.use.viewport?.width ?? 1440) < 1440) {
    await expect(page.getByRole("dialog", { name: "פרטי עסק ללא שעות" })).toBeVisible();
    await page.getByRole("button", { name: "סגירת חלונית" }).click();
    await expect(page.getByRole("dialog", { name: "פרטי עסק ללא שעות" })).toHaveCount(0);
  }
});
