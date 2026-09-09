import "./utils/source-loader.mjs";
import test from "node:test";
import assert from "node:assert/strict";
const { paymentEmailTemplate } = await import("../lib/payment-email-template.ts");
const { securityTemplates } = await import("../scripts/build-security-email-templates.mjs");

const event = { attemptId: "30000000-0000-4000-8000-000000000001", eventType: "payment_succeeded", businessName: '<img src=x onerror="bad()">', amountAgorot: 2000, durationMonths: null, planDays: 1, expiresAt: null, listingState: "awaiting_profile", occurredAt: "2026-09-09T12:00:00+00:00" };
test("first purchase confirms payment without promising public listing", () => {
  const result = paymentEmailTemplate(event);
  assert.match(result.text, /העסק עדיין אינו מוצג/);
  assert.match(result.text, /20/);
  assert.match(result.text, /1 ימים/);
  assert.doesNotMatch(result.html, /<img src=x/);
  assert.match(result.html, /&lt;img/);
  assert.match(result.html, /dir="rtl"/);
});
test("refund states resulting expiry and does not promise instant bank credit", () => {
  const result = paymentEmailTemplate({ ...event, eventType: "payment_refunded", listingState: "expired", expiresAt: "2026-09-09T00:00:00+00:00" });
  assert.match(result.subject, /ההחזר/);
  assert.match(result.text, /לאחר ההחזר/);
  assert.match(result.text, /תלוי בחברת האשראי/);
  assert.match(result.text, /אינו מוצג לציבור/);
});
test("renewal has correct title and calendar duration", () => {
  const result = paymentEmailTemplate({ ...event, eventType: "listing_renewed", durationMonths: 3, listingState: "active", expiresAt: "2026-12-09T12:00:00+00:00" });
  assert.match(result.subject, /חודשה/);
  assert.match(result.text, /3 חודשים/);
});
test("invalid event cannot produce a financial confirmation", () => {
  assert.throws(() => paymentEmailTemplate({ ...event, amountAgorot: -1 }));
  assert.throws(() => paymentEmailTemplate({ ...event, eventType: "failed" }));
});
test("security templates retain correct Supabase tokens and official recovery link", () => {
  for (const item of securityTemplates) {
    assert.match(item.html, /lang="he" dir="rtl"/);
    assert.match(item.html, /support@pokarov.co.il/);
    assert.match(item.subject, /פה קרוב/);
  }
  assert.match(securityTemplates[0].html, /https:\/\/pokarov.co.il\/auth\/forgot-password/);
  assert.match(securityTemplates[1].html, /\{\{ .OldEmail \}\}/);
  assert.match(securityTemplates[2].html, /href="\{\{ .ConfirmationURL \}\}"/);
});
