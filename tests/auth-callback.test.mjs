import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { safeRedirectPath } from "../lib/safe-redirect.ts";

// Execute the actual route with provider boundaries replaced; no real users or sessions are touched.
function callback({ role = "business_owner", exchangeError = null, profileError = false, userPresent = true, registrationNext = null } = {}) {
  const source = readFileSync(new URL("../app/auth/callback/route.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const compiledModule = { exports: {} };
  const imports = {
    "@/lib/supabase/server": { createClient: async () => ({ auth: {
      exchangeCodeForSession: async () => ({ error: exchangeError }),
      verifyOtp: async ({ type }) => { assert.equal(type, "signup"); return { error: exchangeError }; },
      getUser: async () => ({ data: { user: userPresent ? { id: "qa", email: "qa@example.test", user_metadata: { role, registration_next: registrationNext } } : null } }),
    } }) },
    "@/lib/safe-redirect": { safeRedirectPath },
    "@/lib/user-profile": { ensurePublicUser: async () => { if (profileError) throw new Error("profile unavailable"); } },
    "next/server": { NextResponse: { redirect: (url) => ({ location: String(url), headers: new Headers() }) } },
  };
  runInNewContext(compiled, { module: compiledModule, exports: compiledModule.exports, URL, Headers, require: (name) => {
    if (!(name in imports)) throw new Error(`Unexpected dependency: ${name}`);
    return imports[name];
  } });
  compiledModule.exports.GET.POST = compiledModule.exports.POST;
  return compiledModule.exports.GET;
}

test("verified owner retains campaign destination and correct registration event", async () => {
  const result = await callback()({ url: "https://example.test/auth/callback?code=valid&signup=1&next=%2Fdashboard%2Fprofile%3Fcampaign%3Dfirst-20-3m" });
  const url = new URL(result.location);
  assert.equal(url.pathname, "/dashboard/profile");
  assert.equal(url.searchParams.get("campaign"), "first-20-3m");
  assert.equal(url.searchParams.get("registration"), "business_owner");
  assert.equal(result.headers.get("cache-control"), "private, no-store");
});

test("email confirmation POST works without a PKCE cookie and retains signup intent", async () => {
  const route = callback({ registrationNext: "/dashboard/profile?campaign=first-20-3m" });
  const response = await route.POST(new Request("https://example.test/auth/callback", {
    method: "POST", headers: { origin: "https://example.test" },
    body: new URLSearchParams({ token_hash: "a".repeat(64) }),
  }));
  const url = new URL(response.location);
  assert.equal(url.pathname, "/dashboard/profile");
  assert.equal(url.searchParams.get("campaign"), "first-20-3m");
  assert.equal(url.searchParams.get("registration"), "business_owner");
});

test("cross-origin forms, malformed tokens and expired confirmations fail closed", async () => {
  for (const options of [
    { origin: "https://evil.test", token: "a".repeat(64) },
    { origin: "https://example.test", token: "invalid" },
    { origin: "https://example.test", token: "a".repeat(64), error: { code: "otp_expired" } },
  ]) {
    const response = await callback({ exchangeError: options.error }).POST(new Request("https://example.test/auth/callback", {
      method: "POST", headers: { origin: options.origin },
      body: new URLSearchParams({ token_hash: options.token }),
    }));
    assert.equal(new URL(response.location).pathname, "/auth/login");
  }
});

test("a resend without role or destination still routes an owner to the dashboard", async () => {
  const result = await callback()({ url: "https://example.test/auth/callback?code=valid&signup=1" });
  assert.equal(new URL(result.location).pathname, "/dashboard");
});

test("invalid and replayed codes preserve a safe retry destination", async () => {
  const result = await callback({ exchangeError: { code: "invalid_grant" } })({ url: "https://example.test/auth/callback?code=expired&next=%2Fdashboard%2Fbilling" });
  const url = new URL(result.location);
  assert.equal(url.pathname, "/auth/login");
  assert.equal(url.searchParams.get("error"), "auth_callback_error");
  assert.equal(url.searchParams.get("redirectTo"), "/dashboard/billing");
  assert.equal(result.headers.get("referrer-policy"), "no-referrer");
});

test("callback cannot redirect externally or accept an admin signup role", async () => {
  const result = await callback({ role: "admin" })({ url: "https://example.test/auth/callback?code=valid&signup=1&role=admin&next=https%3A%2F%2Fevil.test" });
  const url = new URL(result.location);
  assert.equal(url.origin, "https://example.test");
  assert.equal(url.pathname, "/");
  assert.equal(url.searchParams.get("registration"), "customer");
});

test("missing user or failed profile persistence does not report registration success", async () => {
  for (const options of [{ userPresent: false }, { profileError: true }]) {
    const result = await callback(options)({ url: "https://example.test/auth/callback?code=valid&signup=1" });
    assert.equal(new URL(result.location).pathname, "/auth/login");
  }
});
