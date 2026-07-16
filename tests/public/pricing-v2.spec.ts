import { test, expect } from "@playwright/test";

test.describe("duration pricing", () => {
  test("shows one duration slider with six months selected by default", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("משלמים פעם אחת");
    await expect(page.getByText(/6 חודשים — ₪\d+/)).toBeVisible();
    await expect(page.getByRole("slider", { name: "משך הפרסום" })).toHaveValue("7");
    await expect(page.getByRole("button", { name: /יום אחד.*₪3/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /שבוע אחד.*₪8/ })).toHaveCount(0);
    await expect(page.getByText("בתשלום חד־פעמי").first()).toBeVisible();
    await expect(page.getByText("ללא חידוש אוטומטי").first()).toBeVisible();
    await expect(page.getByText(/קידום ל־30|קידום ל-30|מסלול השקה/)).toHaveCount(0);
  });

  test("one slider covers day, week, and all twelve month prices", async ({ page }) => {
    await page.goto("/pricing");
    const slider = page.getByRole("slider", { name: "משך הפרסום" });

    await slider.fill("0");
    await expect(page.getByText("יום אחד — ₪3")).toBeVisible();

    await slider.fill("1");
    await expect(page.getByText("שבוע אחד — ₪8")).toBeVisible();

    await slider.fill("2");
    await expect(page.getByText(/חודש אחד — ₪\d+/)).toBeVisible();

    await slider.fill("13");
    await expect(page.getByText(/12 חודשים — ₪\d+/)).toBeVisible();
    await expect(page.getByText("הכי משתלם")).toBeVisible();
    await expect(page.getByRole("button", { name: "פרסום העסק ל־12 חודשים" })).toBeVisible();
  });

  test("pricing page has no horizontal overflow", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("domcontentloaded");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
  });

  test("checkout rejects retired boost and legacy plan bodies", async ({ request }) => {
    const boost = await request.post("/api/payments/checkout", {
      data: { planCode: "boost_30", businessId: "00000000-0000-0000-0000-000000000000" },
    });
    expect([400, 401]).toContain(boost.status());

    const legacy = await request.post("/api/payments/checkout", {
      data: { planDays: 30 },
    });
    expect([400, 401]).toContain(legacy.status());
  });

  test("public businesses no longer expose promoted placement", async ({ request }) => {
    const response = await request.get("/api/businesses");
    expect(response.ok()).toBe(true);
    const data = (await response.json()) as { businesses?: Record<string, unknown>[] };
    for (const business of data.businesses ?? []) {
      expect(business).not.toHaveProperty("boosted");
      expect(business).not.toHaveProperty("owner_id");
      expect(business).not.toHaveProperty("business_number");
    }
  });

  test("homepage loads without horizontal overflow", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
  });
});
