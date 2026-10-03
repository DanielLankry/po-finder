import { expect, test } from "@playwright/test";

const CONTACT_VIEWPORTS = [320, 390, 430, 768] as const;

test.describe("contact mobile viewport", () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip((testInfo.project.use.viewport?.width ?? 1440) >= 1440, "mobile-only layout check");
  });

  for (const width of CONTACT_VIEWPORTS) {
    test(`hydrated contact form stays inside the ${width}px viewport`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const failedRequests: string[] = [];

      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("requestfailed", (request) => {
        const errorText = request.failure()?.errorText ?? "failed";
        if (errorText !== "net::ERR_ABORTED") {
          failedRequests.push(`${request.method()} ${request.url()} ${errorText}`);
        }
      });

      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto("/contact", { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBeLessThan(400);

      const cookieConsent = page.getByRole("dialog", { name: "הסכמה לעוגיות" });
      await expect(cookieConsent).toBeVisible();
      await cookieConsent.getByRole("button", { name: "דחייה" }).click();
      await expect(cookieConsent).toBeHidden();

      const honeypot = page.locator("input[name=website]");
      await expect(honeypot).toBeAttached();
      await page.waitForFunction(() => {
        const input = document.querySelector("input[name=website]");
        return input && Object.getOwnPropertyNames(input).some((key) => key.startsWith("__reactProps$"));
      });
      await expect(honeypot).toHaveAttribute("tabindex", "-1");
      await expect(page.getByTestId("contact-honeypot")).toHaveAttribute("aria-hidden", "true");

      const form = page.locator("form");
      await expect(form).toBeVisible();
      await page.getByLabel("שם מלא").fill("בדיקת תצוגה");
      await page.getByLabel('דוא"ל').fill("viewport@example.com");
      const generalSubject = page.locator("label").filter({ hasText: "שאלה כללית" });
      await generalSubject.click();
      await expect(page.getByLabel("שאלה כללית")).toBeChecked();
      await page.getByLabel("הודעה").fill("בדיקת שימושיות ללא שליחה");
      await page.getByLabel(/אני מאשר/).check();
      await expect(page.getByRole("button", { name: "שליחה" })).toBeEnabled();

      const [dimensions, formBox, honeypotBox] = await Promise.all([
        page.evaluate(() => ({
          innerWidth: window.innerWidth,
          clientWidth: document.documentElement.clientWidth,
          bodyWidth: document.body.scrollWidth,
          documentWidth: document.documentElement.scrollWidth,
        })),
        form.boundingBox(),
        page.getByTestId("contact-honeypot").boundingBox(),
      ]);

      expect(dimensions.innerWidth).toBe(width);
      expect(dimensions.bodyWidth).toBeLessThanOrEqual(dimensions.clientWidth);
      expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.clientWidth);
      expect(formBox).not.toBeNull();
      expect(formBox!.x).toBeGreaterThanOrEqual(0);
      expect(formBox!.x + formBox!.width).toBeLessThanOrEqual(dimensions.clientWidth);
      expect(honeypotBox).not.toBeNull();
      expect(honeypotBox!.width).toBeLessThanOrEqual(1);
      expect(honeypotBox!.x).toBeGreaterThanOrEqual(-1);
      expect(honeypotBox!.x + honeypotBox!.width).toBeLessThanOrEqual(dimensions.clientWidth);
      expect(consoleErrors).toEqual([]);
      expect(failedRequests).toEqual([]);
    });
  }
});
