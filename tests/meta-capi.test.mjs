import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [serverSource, routeSource, clientSource, profileSource] = await Promise.all([
  readFile(new URL("../lib/meta-conversions.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/meta/lead/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../lib/meta-lead.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/dashboard/profile/page.tsx", import.meta.url), "utf8"),
]);

test("Meta Lead uses the same business event ID in Pixel and CAPI", () => {
  assert.match(clientSource, /const eventID = `business-\$\{businessId\}`/);
  assert.match(clientSource, /trackMetaEvent[\s\S]*?\{ eventID \}/);
  assert.match(routeSource, /eventId: `business-\$\{business\.id\}`/);
  assert.match(serverSource, /event_id: input\.eventId/);
});

test("CAPI keeps the access token server-only and hashes customer identifiers", () => {
  assert.match(serverSource, /process\.env\.META_CONVERSIONS_API_ACCESS_TOKEN/);
  assert.match(serverSource, /Authorization: `Bearer \$\{accessToken\}`/);
  assert.match(serverSource, /createHash\("sha256"\)/);
  assert.doesNotMatch(clientSource, /META_CONVERSIONS_API_ACCESS_TOKEN/);
});

test("Lead is emitted only after the inserted business is read back", () => {
  assert.match(profileSource, /if \(inserted\) \{[\s\S]*?trackMetaBusinessLead\(\{/);
  assert.doesNotMatch(profileSource, /trackMetaEvent\("Lead"/);
});
