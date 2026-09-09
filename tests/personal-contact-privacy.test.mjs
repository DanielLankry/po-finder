import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const siteConfig = await readFile(new URL("../lib/site-config.ts", import.meta.url), "utf8");
const legalIdentity = await readFile(
  new URL("../components/legal/LegalIdentity.tsx", import.meta.url),
  "utf8",
);

test("public legal identity uses support email without an operator phone", () => {
  assert.match(siteConfig, /contactEmail: "support@pokarov\.co\.il"/);
  assert.doesNotMatch(siteConfig, /phoneNumber/);
  assert.doesNotMatch(legalIdentity, /label: "טלפון"/);
});
