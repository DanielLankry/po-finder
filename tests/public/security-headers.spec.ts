import { expect, test } from "@playwright/test";

const expectedHeaders = {
  "content-security-policy": "frame-ancestors 'none'",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
};

test("responses include the baseline browser security headers", async ({ request }) => {
  const homepage = await request.get("/");
  const protectedRedirect = await request.get("/admin", { maxRedirects: 0 });
  const jsonApi = await request.get("/api/account/status");

  expect(homepage.headers()).toMatchObject(expectedHeaders);
  expect(protectedRedirect.status()).toBeGreaterThanOrEqual(300);
  expect(protectedRedirect.status()).toBeLessThan(400);
  expect(protectedRedirect.headers()).toMatchObject(expectedHeaders);
  expect(jsonApi.headers()).toMatchObject(expectedHeaders);
});
