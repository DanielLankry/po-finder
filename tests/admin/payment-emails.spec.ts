import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";

test.skip(process.env.RUN_ADMIN_UI_FIXTURES !== "1", "Fully intercepted local build only.");
test.beforeEach(async ({ page, baseURL }) => {
  if (!baseURL || !["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname)) throw new Error("Loopback required");
  await page.addInitScript(() => localStorage.setItem("po-cookie-consent", "declined"));
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.origin !== new URL(baseURL).origin) return route.abort();
    if (url.pathname === "/_next/image" && url.searchParams.get("url") === "/logo.png") return route.fulfill({ contentType: "image/png", body: await readFile("public/logo.png") });
    if (url.pathname === "/api/admin/payment-emails") {
      if (route.request().method() === "POST") return route.fulfill({ json: { accepted: 1, failed: 0 } });
      return route.fulfill({ json: { items: [{ id: "mail", attempt_id: "payment-test", event_type: "payment_succeeded", recipient: "owner@example.test", status: "needs_attention", last_error: "delivery_uncertain_expired", attempts: 2, created_at: "2026-09-09T12:00:00Z", provider_message_id: null }] } });
    }
    if (url.pathname === "/admin/payment-emails") return route.fulfill({ contentType: "text/html", body: await readFile(".next/server/app/admin/payment-emails.html") });
    const isNext = url.pathname.startsWith("/_next/static/");
    const root = resolve(isNext ? ".next/static" : "public");
    const path = resolve(root, decodeURIComponent(url.pathname.slice(isNext ? "/_next/static/".length : 1)));
    if (!path.startsWith(root + sep)) return route.abort();
    try { return await route.fulfill({ contentType: path.endsWith(".js") ? "application/javascript" : path.endsWith(".css") ? "text/css" : path.endsWith(".png") ? "image/png" : "application/octet-stream", body: await readFile(path) }); }
    catch { return route.fulfill({ status: 404, body: "" }); }
  });
});
test("admin sees uncertain delivery and can process only eligible pending mail", async ({ page }) => {
  await page.goto("/admin/payment-emails");
  await expect(page.getByText("דורש טיפול", { exact: true })).toBeVisible();
  await expect(page.getByText("יש לבדוק ב־Resend אם ההודעה נשלחה לפני ניסיון נוסף")).toBeVisible();
  await page.getByRole("button", { name: "שליחת הודעות שממתינות" }).click();
  await expect(page.getByRole("status")).toContainText("התקבלו אצל הספק: 1");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
  await page.screenshot({ path: test.info().outputPath("payment-emails.png"), fullPage: true });
});
test("network failure is visible and refresh recovers", async ({ page }) => {
  await page.route("**/api/admin/payment-emails", route => route.abort());
  await page.goto("/admin/payment-emails");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("לא ניתן להשלים");
  await expect(page.getByRole("button", { name: "רענון", exact: true })).toBeEnabled();
});
