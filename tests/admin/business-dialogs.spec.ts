import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";

test.skip(process.env.RUN_ADMIN_UI_FIXTURES !== "1", "Opt in to the local, fully intercepted production-build fixture.");

const business = {
  id: "00000000-0000-4000-8000-000000000001", owner_id: "local-owner", name: "עסק בדיקה מקומי",
  category: "coffee", kashrut: "none", is_verified: false, is_active: false, expires_at: null,
  created_at: "2026-09-01T12:00:00Z", lat: 0, lng: 0,
};

test.beforeEach(async ({ page, baseURL }) => {
  if (!baseURL || !["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname)) {
    throw new Error("Admin fixtures require a loopback base URL; all requests are intercepted.");
  }
  // Render the production build directly. No listener, credentials or live backend is used.
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== new URL(baseURL).origin) return route.abort();
    if (url.pathname === "/admin/businesses") {
      return route.fulfill({ contentType: "text/html", body: await readFile(".next/server/app/admin/businesses.html") });
    }
    const isNext = url.pathname.startsWith("/_next/static/");
    const root = resolve(isNext ? ".next/static" : "public");
    const relative = decodeURIComponent(url.pathname.slice(isNext ? "/_next/static/".length : 1));
    const path = resolve(root, relative);
    if (!path.startsWith(root + sep)) return route.abort();
    const contentType = path.endsWith(".js") ? "application/javascript" :
      path.endsWith(".css") ? "text/css" : path.endsWith(".png") ? "image/png" :
        path.endsWith(".svg") ? "image/svg+xml" : "application/octet-stream";
    try {
      return await route.fulfill({ contentType, body: await readFile(path) });
    } catch {
      return route.fulfill({ status: 404, body: "" });
    }
  });
  // No business writes reach a server: every admin API request is a fixture response.
  await page.route("**/api/admin/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/admin/businesses") {
      await route.fulfill({ json: { businesses: [business] } });
    } else if (route.request().method() === "PATCH") {
      await route.fulfill({ json: { business: { ...business, ...route.request().postDataJSON() }, notificationStatus: "failed" } });
    } else {
      await route.fulfill({ status: 404, json: { error: "No fixture" } });
    }
  });
  await page.goto("/admin/businesses");
  await expect(page.getByRole("heading", { name: business.name, exact: true })).toBeVisible();
});

test("edit traps focus, names controls, closes with Escape and restores the trigger", async ({ page }) => {
  const edit = page.getByRole("button", { name: "ערוך", exact: true });
  await edit.click();
  const dialog = page.getByRole("dialog", { name: "עריכת עסק — " + business.name });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("שם העסק *", { exact: true })).toBeFocused();
  await expect(dialog.getByRole("button", { name: "סגירה", exact: true })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath("admin-edit-dialog.png") });
  await dialog.getByRole("button", { name: "סגירה", exact: true }).focus();
  await page.keyboard.press("Tab");
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(edit).toBeFocused();
});

test("saving edit approval displays delivery failure without losing the saved business", async ({ page }) => {
  await page.getByRole("button", { name: "ערוך", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "עריכת עסק — " + business.name });
  await dialog.getByLabel("מאומת על ידי מנהל").check();
  await dialog.getByRole("button", { name: "שמור שינויים", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("מייל האישור לא נשלח");
  await expect(page.getByText("מאומת, לא מוצג", { exact: true })).toBeVisible();
});

test("network failure has a visible error and the refresh control remains usable", async ({ page }) => {
  await page.route("**/api/admin/businesses", (route) => route.abort("failed"));
  await page.getByRole("button", { name: "רענון רשימת העסקים" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("טעינת העסקים נכשלה");
  await expect(page.getByRole("button", { name: "רענון רשימת העסקים" })).toBeEnabled();
});

test("manual-add dialog also closes with Escape and returns focus", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "הוסף עסק ידני", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "הוספת עסק ידני" });
  await expect(dialog.getByLabel("מזהה בעל העסק (UUID) *", { exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});
