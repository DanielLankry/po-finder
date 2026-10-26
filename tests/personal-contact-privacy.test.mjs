import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const siteConfig = await readFile(new URL("../lib/site-config.ts", import.meta.url), "utf8");
const legalIdentity = await readFile(
  new URL("../components/legal/LegalIdentity.tsx", import.meta.url),
  "utf8",
);
const contactPage = await readFile(new URL("../app/contact/page.tsx", import.meta.url), "utf8");
const exampleBusinessCard = await readFile(
  new URL("../components/marketing/ExampleBusinessCard.tsx", import.meta.url),
  "utf8",
);

test("public legal identity uses support email without an operator phone", () => {
  assert.match(siteConfig, /contactEmail: "support@pokarov\.co\.il"/);
  assert.doesNotMatch(siteConfig, /phoneNumber/);
  assert.doesNotMatch(legalIdentity, /label: "טלפון"/);
});

test("contact honeypot is clipped without creating an off-canvas layout", () => {
  assert.match(contactPage, /data-testid="contact-honeypot"/);
  assert.match(contactPage, /className="sr-only"/);
  assert.doesNotMatch(contactPage, /-left-\[\d{4,}px\]/);
});

test("empty-launch example links directly to pricing", () => {
  assert.match(exampleBusinessCard, /data-testid="empty-launch-pricing-cta"/);
  assert.match(exampleBusinessCard, /href="\/pricing"/);
});
