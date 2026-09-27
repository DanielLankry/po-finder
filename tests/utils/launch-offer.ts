import type { Page } from "@playwright/test";

const LAUNCH_OFFER_SESSION_KEY = "po-first-businesses-offer-seen";

export async function suppressLaunchOffer(page: Page) {
  await page.addInitScript((sessionKey) => {
    sessionStorage.setItem(sessionKey, "1");
  }, LAUNCH_OFFER_SESSION_KEY);
}
