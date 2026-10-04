import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { collectErrors } from "../utils/console";

const CONTACT_VIEWPORTS = [320, 390, 430, 768] as const;

type LayoutSnapshot = {
  innerWidth: number;
  clientWidth: number;
  bodyWidth: number;
  documentWidth: number;
  honeypotX: number | null;
  honeypotWidth: number | null;
  honeypotHeight: number | null;
  honeypotOverflow: string | null;
};

async function readLayout(page: Page): Promise<LayoutSnapshot> {
  return page.evaluate(() => {
    const honeypot = document.querySelector<HTMLElement>("[data-testid=contact-honeypot]");
    const honeypotBox = honeypot?.getBoundingClientRect();
    const honeypotStyle = honeypot ? getComputedStyle(honeypot) : null;

    return {
      innerWidth: window.innerWidth,
      clientWidth: document.documentElement.clientWidth,
      bodyWidth: document.body.scrollWidth,
      documentWidth: document.documentElement.scrollWidth,
      honeypotX: honeypotBox?.x ?? null,
      honeypotWidth: honeypotBox?.width ?? null,
      honeypotHeight: honeypotBox?.height ?? null,
      honeypotOverflow: honeypotStyle?.overflow ?? null,
    };
  });
}

function expectContainedLayout(layout: LayoutSnapshot, width: number) {
  expect(layout.innerWidth).toBe(width);
  expect(layout.clientWidth).toBe(width);
  expect(layout.bodyWidth).toBeLessThanOrEqual(layout.clientWidth);
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.clientWidth);
  expect(layout.honeypotX).not.toBeNull();
  expect(layout.honeypotX!).toBeGreaterThanOrEqual(-1);
  expect(layout.honeypotWidth).not.toBeNull();
  expect(layout.honeypotWidth!).toBeLessThanOrEqual(1);
  expect(layout.honeypotHeight).not.toBeNull();
  expect(layout.honeypotHeight!).toBeLessThanOrEqual(1);
  expect(layout.honeypotX! + layout.honeypotWidth!).toBeLessThanOrEqual(layout.clientWidth);
  expect(layout.honeypotOverflow).toBe("hidden");
}

for (const width of CONTACT_VIEWPORTS) {
  test(`contact form remains inside the ${width}px viewport after delayed hydration`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.addInitScript(() => localStorage.setItem("po-cookie-consent", "accepted"));
    await page.setViewportSize({ width, height: 900 });

    const response = await page.goto("/contact", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(400);

    const honeypot = page.getByTestId("contact-honeypot");
    await expect(honeypot).toBeAttached();
    await expect(honeypot).toHaveAttribute("aria-hidden", "true");

    const honeypotInput = page.locator('input[name="website"]');
    await expect(honeypotInput).toHaveAttribute("tabindex", "-1");
    await expect(honeypotInput).toHaveAttribute("autocomplete", "off");
    await page.waitForFunction(() => {
      const input = document.querySelector('input[name="website"]');
      return input && Object.getOwnPropertyNames(input).some((key) => key.startsWith("__reactProps$"));
    });

    await page.getByLabel("שם מלא").fill("בדיקת תצוגה");
    await page.getByLabel('דוא"ל').fill("viewport@example.com");
    await page.getByLabel("הודעה").fill("בדיקת שימושיות ללא שליחה");

    const hydratedLayout = await readLayout(page);

    // The production defect appeared about 250 ms after DOMContentLoaded.
    // Sample again well beyond that boundary so a transient healthy width cannot pass.
    await page.waitForTimeout(750);
    const delayedLayout = await readLayout(page);

    expectContainedLayout(hydratedLayout, width);
    expectContainedLayout(delayedLayout, width);
    expect(errors).toEqual([]);
  });
}
