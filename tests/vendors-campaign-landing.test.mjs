import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [pageSource, serverSource, campaignSource] = await Promise.all([
  readFile(new URL("../app/vendors/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../lib/launch-promotion-server.ts", import.meta.url), "utf8"),
  readFile(new URL("../lib/launch-promotion.ts", import.meta.url), "utf8"),
]);

test("campaign traffic receives the three-month offer and direct signup path", () => {
  assert.match(pageSource, /campaignParam === FIRST_BUSINESSES_PROMOTION_CODE/);
  assert.match(pageSource, /3 חודשים/);
  assert.match(pageSource, /20 העסקים הראשונים/);
  assert.match(pageSource, /FIRST_BUSINESSES_SIGNUP_PATH/);
  assert.match(
    campaignSource,
    /dashboard%2Fprofile%3Fcampaign%3Dfirst-20-3m/,
  );
});

test("campaign copy is gated by live aggregate availability", () => {
  assert.match(pageSource, /const campaignOpen = promotion\?\.isOpen === true/);
  assert.match(serverSource, /claimed_count/);
  assert.match(serverSource, /toLaunchPromotionStatus/);
  assert.match(pageSource, /מבצע 20 העסקים אינו זמין כרגע/);
});
