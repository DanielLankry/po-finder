import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const operatorNumber = ["+972-58", "-424-2554"].join("");
const operatorDigits = ["97258", "4242554"].join("");
const supportSurfaces = [
  "app/about/page.tsx",
  "app/contact/page.tsx",
  "app/vendors/page.tsx",
  "components/legal/LegalIdentity.tsx",
  "lib/site-config.ts",
];

test("public operator contact surfaces expose email without WhatsApp", () => {
  for (const path of supportSurfaces) {
    const source = read(path);
    assert.doesNotMatch(source, /getWhatsAppHref|whatsappHref|טלפון \/ WhatsApp/);
    assert.doesNotMatch(source, new RegExp(operatorNumber.replace(/[+]/g, "\\+")));
    assert.doesNotMatch(source, new RegExp(operatorDigits));
  }

  const contactPage = read("app/contact/page.tsx");
  assert.match(contactPage, /mailto:\$\{BUSINESS_INFO\.contactEmail\}/);
  assert.match(contactPage, /fetch\("\/api\/contact"/);

  const siteConfig = read("lib/site-config.ts");
  assert.match(siteConfig, /contactEmail: "support@pokarov\.co\.il"/);
});

test("listed businesses keep their own WhatsApp contact action", () => {
  const businessPage = read("app/businesses/[id]/page.tsx");
  assert.match(businessPage, /business\.whatsapp/);
  assert.match(businessPage, /https:\/\/wa\.me\/\$\{business\.whatsapp/);
});
