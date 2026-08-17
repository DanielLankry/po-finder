import { test, expect, type Page } from "@playwright/test";

async function selectDuration(page: Page, index: number, summary: string) {
  const slider = page.getByRole("slider", { name: "משך הפרסום" });

  await expect(slider).toBeVisible();
  await expect
    .poll(async () => {
      const alternateIndex = index === 0 ? 1 : index - 1;
      await slider.fill(String(alternateIndex));
      await slider.fill(String(index));
      return page.getByText(summary, { exact: true }).count();
    })
    .toBeGreaterThan(0);
  await expect(slider).toHaveValue(String(index));
  await expect(page.getByText(summary, { exact: true })).toBeVisible();
}

test.describe("duration pricing", () => {
  test("shows one duration slider with six months selected by default", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("משלמים פעם אחת");
    await expect(page.getByText(/6 חודשים — ₪\d+/)).toBeVisible();
    await expect(page.getByRole("slider", { name: "משך הפרסום" })).toHaveValue("9");
    await expect(page.getByRole("button", { name: /יום אחד.*₪20/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /שבוע אחד.*₪40/ })).toHaveCount(0);
    const scaleLabels = page.getByTestId("duration-scale-labels");
    await expect(scaleLabels).toContainText(/יום|ימים/);
    await expect(scaleLabels).toContainText("שבוע");
    await expect(scaleLabels.locator(".rounded-full")).toHaveCount(0);
    await expect(page.getByText("בתשלום חד־פעמי").first()).toBeVisible();
    await expect(page.getByText("ללא חידוש אוטומטי").first()).toBeVisible();
    await expect(page.getByText(/קידום ל־30|קידום ל-30|מסלול השקה/)).toHaveCount(0);
  });

  test("hydrated slider updates one-day and 12-month pricing and expiry", async ({ page }) => {
    await page.goto("/pricing");
    const expiryPreview = page.getByText(/^העסק יוצג עד /);

    await selectDuration(page, 0, "יום אחד — ₪20");
    const oneDayExpiry = await expiryPreview.textContent();
    expect(oneDayExpiry).toMatch(/^העסק יוצג עד \S/);

    await selectDuration(page, 15, "12 חודשים — ₪250");
    const twelveMonthExpiry = await expiryPreview.textContent();
    expect(twelveMonthExpiry).toMatch(/^העסק יוצג עד \S/);
    expect(twelveMonthExpiry).not.toBe(oneDayExpiry);
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

  test("pricing contact panel offers email without WhatsApp", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("link", { name: "support@pokarov.co.il" })).toHaveAttribute(
      "href",
      "mailto:support@pokarov.co.il"
    );
    await expect(page.getByRole("link", { name: "WhatsApp" })).toHaveCount(0);
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

  test("pricing CTA preserves the selected plan for business-owner registration", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("po-cookie-consent", "declined"));
    await page.goto("/pricing");
    await page.getByRole("button", { name: "פרסום העסק ל־6 חודשים" }).click();
    await expect(page).toHaveURL(
      /\/auth\/register\?redirectTo=%2Fdashboard%2Fbilling%3Fplan%3Dlisting_6m$/
    );
    await expect(page.getByRole("button", { name: /בעל עסק/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });
});
