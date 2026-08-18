import { expect, type Page } from "@playwright/test";

export async function completeFirstVisit(page: Page) {
  const cookieConsent = page.getByRole("dialog", { name: "הסכמה לעוגיות" });
  await expect(cookieConsent).toBeVisible();
  await cookieConsent.getByRole("button", { name: "דחייה" }).click();
  await expect(cookieConsent).toBeHidden();
}
