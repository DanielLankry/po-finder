import { expect, type Page } from "@playwright/test";

export const FIRST_20_OFFER = "3 חודשים חינם ל־20 העסקים הראשונים";

export async function dismissLaunchOffer(page: Page) {
  const launchOffer = page.getByRole("dialog", { name: FIRST_20_OFFER });

  await expect
    .poll(
      () =>
        page.evaluate(() =>
          performance
            .getEntriesByType("resource")
            .some((entry) => entry.name.includes("/api/promotions/first-20"))
        ),
      {
        message: "launch promotion request should settle before the offer is shown",
        timeout: 30_000,
      }
    )
    .toBe(true);
  await expect(launchOffer).toBeVisible({ timeout: 5_000 });
  await launchOffer.getByRole("button", { name: "סגירה" }).click();
  await expect(launchOffer).toBeHidden();
}

export async function completeFirstVisit(page: Page) {
  await dismissLaunchOffer(page);

  const cookieConsent = page.getByRole("dialog", { name: "הסכמה לעוגיות" });
  await expect(cookieConsent).toBeVisible();
  await cookieConsent.getByRole("button", { name: "דחייה" }).click();
  await expect(cookieConsent).toBeHidden();
}
