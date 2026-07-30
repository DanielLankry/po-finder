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
  for (const route of ["/", "/auth/login", "/api/account/status"]) {
    const response = await request.get(route);

    expect(response.headers()).toMatchObject(expectedHeaders);
  }
});
