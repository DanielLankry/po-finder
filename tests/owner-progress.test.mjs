import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as lifecycle from "../lib/owner-lifecycle.ts";
import * as schedule from "../lib/utils/schedule.ts";

/** Executes production TypeScript with only external provider boundaries substituted. */
function moduleAt(path, imports = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = { exports: {} };
  runInNewContext(compiled, { module: mod, exports: mod.exports, URLSearchParams, Date, require: name => {
    assert.ok(name in imports, `Unexpected import: ${name}`); return imports[name];
  } });
  return mod.exports;
}
const progress = moduleAt("../lib/owner-progress.ts", { "./owner-lifecycle": lifecycle });
const NOW = "2026-09-09T08:00:00Z";
const business = { id: "owned-1", name: "עסק לדוגמה", category: "food", address: "באר שבע", lat: 31.25, lng: 34.79, description: "אוכל מקומי", phone: "0500000000", created_at: "2026-09-08T09:00:00Z", is_active: false, is_verified: false, expires_at: null };
const weekly = { id: "weekly-1", business_id: business.id, day_of_week: 3, is_active: true, open_time: "09:00", close_time: "18:00" };

test("completion counts stored content and keeps all six links on the selected business", () => {
  const result = progress.getProfileCompletion(business, [], [], [], "2026-09-09");
  assert.equal(result.completed, 4); assert.equal(result.total, 6); assert.equal(result.percent, 67);
  for (const item of result.items) assert.equal(new URL(item.href, "https://example.test").searchParams.get("businessId"), business.id);
  assert.equal(progress.getProfileCompletion(business, [{ is_primary: true, url: "owned/photo.jpg" }], [weekly]).completed, 6);
});
test("invalid map points, whitespace and failed primary uploads do not inflate completeness", () => {
  const result = progress.getProfileCompletion({ ...business, lat: 100, description: "   " }, [{ is_primary: true, url: "" }]);
  assert.equal(result.completed, 2);
});
test("yesterday's one-off hours do not complete today's profile", () => {
  const result = progress.getProfileCompletion(business, [], [], [{ date: "2026-09-08", open_time: "09:00", close_time: "18:00" }], "2026-09-09");
  assert.equal(result.items.find(item => item.id === "hours").complete, false);
});
test("email verification remains a separate step before business approval", () => {
  const result = progress.getOwnerJourney(business, false, NOW);
  assert.equal(result.steps[0].state, "current"); assert.equal(result.publicVisible, false);
});
test("a complete profile cannot publish an unapproved business", () => {
  assert.equal(progress.getProfileCompletion(business, [{ is_primary: true, url: "saved.jpg" }], [weekly]).percent, 100);
  const result = progress.getOwnerJourney(business, true, NOW);
  assert.equal(result.steps[2].state, "current"); assert.equal(result.publicVisible, false);
  assert.match(result.responsible, /הצוות/); assert.doesNotMatch(result.description, /24 שעות|יום עבודה/);
});
test("reserved promotion explains approval without requiring checkout", () => {
  const result = progress.getOwnerJourney({ ...business, promotion_code: "first-20-3m" }, true, NOW);
  assert.match(result.description, /ללא תשלום/); assert.match(result.actionHref, /profile/);
});
test("active promotion is published and an expired promotion offers renewal", () => {
  const promoted = { ...business, is_active: true, is_verified: true, promotion_code: "first-20-3m", expires_at: "2026-12-09T08:00:00Z" };
  assert.equal(progress.getOwnerJourney(promoted, true, NOW).publicVisible, true);
  const expired = progress.getOwnerJourney(promoted, true, "2027-01-01T00:00:00Z");
  assert.equal(expired.publicVisible, false); assert.match(expired.actionLabel, /חידוש/);
});
test("suspended paid period and unresolved payment do not ask the owner to pay again", () => {
  const suspended = progress.getOwnerJourney({ ...business, is_verified: true, expires_at: "2026-12-09T08:00:00Z" }, true, NOW);
  assert.equal(suspended.actionHref, "/contact"); assert.match(suspended.title, /מושהה/);
  const pending = progress.getOwnerJourney({ ...business, is_verified: true }, true, NOW, true);
  assert.equal(pending.actionHref, "/contact"); assert.match(pending.title, /בבדיקה/);
});
test("owner links preserve query parameters and anchors without modifying public URLs", () => {
  assert.equal(progress.ownerPath("/dashboard/schedule?tab=override#edit", "owned-2"), "/dashboard/schedule?tab=override&businessId=owned-2#edit");
  assert.equal(progress.ownerPath("/contact", "owned-2"), "/contact");
});
test("owner status uses weekly hours and daily overrides with their source", () => {
  const now = new Date(NOW);
  assert.equal(schedule.getOwnerDayStatus([], [weekly], now).availability, "open");
  assert.equal(schedule.getOwnerDayStatus([], [weekly], now).source, "weekly");
  const override = { id: "daily-1", date: "2026-09-09", open_time: null, close_time: null };
  const closed = schedule.getOwnerDayStatus([override], [weekly], now);
  assert.equal(closed.availability, "closed"); assert.equal(closed.source, "daily");
  assert.equal(schedule.getOwnerDayStatus([], [], now).availability, "unknown");
});
test("overnight hours identify their start day and close exactly at the boundary", () => {
  const night = { ...weekly, open_time: "20:00", close_time: "02:00" };
  const open = schedule.getOwnerDayStatus([], [night], new Date("2026-09-09T22:30:00Z"));
  assert.equal(open.availability, "open"); assert.equal(open.overnight, true);
  assert.notEqual(schedule.getOwnerDayStatus([], [night], new Date("2026-09-09T23:00:00Z")).availability, "open");
});
test("Israel previous calendar date is correct immediately after spring DST", () => {
  const context = schedule.getIsraelDateContext(new Date("2026-03-27T21:30:00Z"));
  assert.equal(context.date, "2026-03-28"); assert.equal(context.previousDate, "2026-03-27");
  const night = { ...weekly, day_of_week: 5, open_time: "22:00", close_time: "02:00" };
  assert.equal(schedule.getOwnerDayStatus([], [night], new Date("2026-03-27T21:30:00Z")).availability, "open");
});
test("Israel previous calendar date is correct during autumn DST", () => {
  const context = schedule.getIsraelDateContext(new Date("2026-10-25T22:30:00Z"));
  assert.equal(context.date, "2026-10-26"); assert.equal(context.previousDate, "2026-10-25");
});

function progressRoute({ user = { id: "owner", email_confirmed_at: NOW }, owned = [business], fail = false } = {}) {
  const reads = [];
  const supabase = { auth: { getUser: async () => ({ data: { user } }) }, from: table => {
    const query = { select() { return this; }, eq(field, value) { reads.push([table, field, value]); return this; }, in() { return this; }, order() { return this; }, limit() { return this; }, then(resolve) { resolve({ data: table === "business_weekly_schedule" ? [weekly] : [], error: fail ? { message: "failure" } : null }); } }; return query;
  } };
  const api = moduleAt("../app/api/account/progress/route.ts", {
    "next/server": { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200, headers: options?.headers }) } },
    "@/lib/supabase/server": { createClient: async () => supabase },
    "@/lib/db/owned-businesses": { getOwnedBusinesses: async () => owned },
    "@/lib/owner-progress": progress, "@/lib/utils/schedule": schedule,
  });
  return { get: api.GET, reads };
}
test("progress API rejects anonymous requests before reading any business data", async () => {
  const api = progressRoute({ user: null });
  assert.equal((await api.get({ nextUrl: new URL("https://example.test/api/account/progress") })).status, 401);
  assert.equal(api.reads.length, 0);
});
test("progress API cannot select somebody else's business or silently fall back", async () => {
  const api = progressRoute();
  assert.equal((await api.get({ nextUrl: new URL("https://example.test/api/account/progress?businessId=other") })).status, 404);
  assert.equal(api.reads.length, 0);
});
test("progress API reads are owner scoped and never cache private status", async () => {
  const api = progressRoute();
  const result = await api.get({ nextUrl: new URL("https://example.test/api/account/progress?businessId=owned-1") });
  assert.equal(result.status, 200); assert.equal(result.headers["Cache-Control"], "private, no-store");
  // Ownership is established through the authenticated RPC before reading child rows.
  // Filtering a hidden user_id column would fail the production column grants; RLS owns that check.
  assert.ok(!api.reads.some(([table, field]) => table === "payment_attempts" && field === "user_id"));
  for (const [table, , value] of api.reads.filter(([, field]) => field === "business_id")) assert.equal(value, business.id, table);
});
test("provider read failures produce an error rather than a false incomplete profile", async () => {
  const api = progressRoute({ fail: true });
  assert.equal((await api.get({ nextUrl: new URL("https://example.test/api/account/progress") })).status, 500);
});
test("invalid explicit owner selection cannot resolve to the newest business", async () => {
  const owned = moduleAt("../lib/db/owned-businesses.ts");
  const client = { rpc: async () => ({ data: [business, { ...business, id: "owned-2" }], error: null }) };
  assert.equal((await owned.getLatestOwnedBusiness(client, "owned-2")).id, "owned-2");
  assert.equal(await owned.getLatestOwnedBusiness(client, "unknown"), null);
});
