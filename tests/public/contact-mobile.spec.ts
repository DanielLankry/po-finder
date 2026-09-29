import { expect, test } from "@playwright/test";
import { collectErrors } from "../utils/console";

const CONTACT_VIEWPORTS = [320, 390, 430] as const;

for (const width of CONTACT_VIEWPORTS) {
  test(`contact form stays inside the ${width}px viewport after hydration`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.addInitScript(() => localStorage.setItem("po-cookie-consent", "accepted"));
    await page.setViewportSize({ width, height: 900 });

    const response = await page.goto("/contact", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(400);

    const honeypot = page.getByTestId("contact-honeypot");
    await expect(honeypot).toBeAttached();
    await expect(honeypot).toHaveAttribute("aria-hidden", "true");
    await expect(page.locator('input[name="website"]')).toHaveAttribute("tabindex", "-1");

    await page.getByLabel("שם מלא").fill("בדיקת תצוגה");
    await page.getByLabel('דוא"ל').fill("viewport@example.com");
    await page.getByLabel("הודעה").fill("בדיקת שימושיות ללא שליחה");

    const layout = await page.evaluate(() => {
      const honeypotElement = document.querySelector<HTMLElement>("[data-testid=contact-honeypot]");
      const honeypotStyle = honeypotElement ? getComputedStyle(honeypotElement) : null;
      return {
        innerWidth: window.innerWidth,
        bodyWidth: document.body.scrollWidth,
        documentWidth: document.documentElement.scrollWidth,
        honeypotWidth: honeypotElement?.getBoundingClientRect().width ?? null,
        honeypotHeight: honeypotElement?.getBoundingClientRect().height ?? null,
        honeypotOverflow: honeypotStyle?.overflow ?? null,
      };
    });

    expect(layout.innerWidth).toBe(width);
    expect(layout.bodyWidth).toBeLessThanOrEqual(width);
    expect(layout.documentWidth).toBeLessThanOrEqual(width);
    expect(layout.honeypotWidth).toBeLessThanOrEqual(1);
    expect(layout.honeypotHeight).toBeLessThanOrEqual(1);
    expect(layout.honeypotOverflow).toBe("hidden");
    expect(errors).toEqual([]);
  });
}
