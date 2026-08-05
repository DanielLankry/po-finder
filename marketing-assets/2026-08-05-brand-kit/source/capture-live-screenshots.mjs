import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const sourceDir = path.dirname(fileURLToPath(import.meta.url));
const kitDir = path.resolve(sourceDir, "..");
const outputDir = path.join(kitDir, "04-product-screenshots", "01-live-public");
const baseUrl = "https://pokarov.co.il";

await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function createContext(options) {
  const context = await browser.newContext({
    locale: "he-IL",
    timezoneId: "Asia/Jerusalem",
    colorScheme: "light",
    reducedMotion: "reduce",
    ...options,
  });
  await context.addInitScript(() => {
    localStorage.setItem("po-cookie-consent", "declined");
  });
  return context;
}

async function openPublicMap(page) {
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "פתיחת סינון מתקדם" }).waitFor();
  await page.waitForTimeout(1200);
}

const mobileContext = await createContext({
  viewport: { width: 360, height: 640 },
  deviceScaleFactor: 4,
  isMobile: true,
  hasTouch: true,
});

const mobilePage = await mobileContext.newPage();

await openPublicMap(mobilePage);
await mobilePage.screenshot({
  path: path.join(outputDir, "01-results-mobile-live-empty-1440x2560.png"),
});
await mobilePage.screenshot({
  path: path.join(outputDir, "03-filters-category-mobile-1440x2560.png"),
});

const mapToggle = mobilePage.getByRole("button", { name: "עבור למפה" });
await mapToggle.click();
await mobilePage.locator('[data-testid="business-map-panel"]').waitFor({ state: "visible" });
await mobilePage.locator(".gm-style").waitFor({ state: "visible", timeout: 20000 });
await mobilePage.waitForTimeout(1500);
await mobilePage.screenshot({
  path: path.join(outputDir, "02-map-mobile-live-empty-1440x2560.png"),
});

await openPublicMap(mobilePage);
const locationInput = mobilePage.locator('input[aria-label="חיפוש מיקום"]:visible');
await locationInput.fill("תל אביב");
await mobilePage.waitForTimeout(1800);
await mobilePage.screenshot({
  path: path.join(outputDir, "04-filters-location-mobile-1440x2560.png"),
});

await openPublicMap(mobilePage);
await mobilePage.getByRole("button", { name: "פתיחת סינון מתקדם" }).click();
await mobilePage.getByRole("heading", { name: "סינון המפה" }).waitFor();
await mobilePage.screenshot({
  path: path.join(outputDir, "05-filters-hours-mobile-1440x2560.png"),
});

await mobilePage.goto(`${baseUrl}/pricing`, { waitUntil: "domcontentloaded" });
const durationHeading = mobilePage.getByRole("heading", { name: "לכמה זמן תרצו להופיע באתר?" });
await durationHeading.waitFor();
await durationHeading.evaluate((heading) => {
  heading.closest("article")?.scrollIntoView({ block: "start" });
});
await mobilePage.evaluate(() => window.scrollBy(0, -76));
await mobilePage.waitForTimeout(500);
await mobilePage.screenshot({
  path: path.join(outputDir, "06-pricing-mobile-selector-1440x2560.png"),
});
await mobilePage.evaluate(() => window.scrollBy(0, 220));
await mobilePage.waitForTimeout(300);
await mobilePage.screenshot({
  path: path.join(outputDir, "06b-pricing-mobile-details-1440x2560.png"),
});

await mobileContext.close();

const desktopContext = await createContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const desktopPage = await desktopContext.newPage();
await openPublicMap(desktopPage);
await desktopPage.locator('[data-testid="business-map-panel"]').waitFor({ state: "visible" });
await desktopPage.locator(".gm-style").waitFor({ state: "visible", timeout: 20000 });
await desktopPage.waitForTimeout(1500);
await desktopPage.screenshot({
  path: path.join(outputDir, "07-map-desktop-live-empty-1440x900.png"),
});

await desktopPage.goto(`${baseUrl}/pricing`, { waitUntil: "domcontentloaded" });
await desktopPage.getByRole("heading", { name: "לכמה זמן תרצו להופיע באתר?" }).waitFor();
await desktopPage.screenshot({
  path: path.join(outputDir, "08-pricing-desktop-current-1440x900.png"),
});

await desktopContext.close();
await browser.close();
