import { test, expect } from "@playwright/test";

test("Meta Pixel stays offline until optional cookies are accepted", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("dialog", { name: "הסכמה לעוגיות" })).toBeVisible();
  expect(await page.evaluate(() => Boolean(window.fbq))).toBe(false);
  await expect(page.locator("#meta-pixel-script")).toHaveCount(0);

  await page.getByRole("button", { name: "אישור" }).click();
  await expect(page.locator("#meta-pixel-script")).toHaveAttribute(
    "src",
    "https://connect.facebook.net/en_US/fbevents.js",
  );
  expect(await page.evaluate(() => Boolean(window.fbq))).toBe(true);
});

test("declining optional cookies does not initialize Meta Pixel", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "דחייה" }).click();

  expect(await page.evaluate(() => Boolean(window.fbq))).toBe(false);
  await expect(page.locator("#meta-pixel-script")).toHaveCount(0);
});

test("accepted business registration queues a standard conversion event", async ({ page }) => {
  await page.route("https://connect.facebook.net/**", (route) => route.abort());
  await page.addInitScript(() =>
    localStorage.setItem("po-cookie-consent", "accepted")
  );

  await page.goto("/?registration=business_owner");

  await expect
    .poll(() =>
      page.evaluate(() => {
        const metaWindow = window as typeof window & {
          fbq?: { queue?: unknown[][] };
        };
        return metaWindow.fbq?.queue?.some(
          (command) =>
            command[0] === "track" && command[1] === "CompleteRegistration"
        );
      })
    )
    .toBe(true);
});
