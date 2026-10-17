import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("contact honeypot is viewport-neutral and short-circuits delivery", async () => {
  const [page, route] = await Promise.all([
    read("app/contact/page.tsx"),
    read("app/api/contact/route.ts"),
  ]);

  assert.match(page, /data-testid="contact-honeypot"/);
  assert.match(page, /absolute start-0 top-0 size-px overflow-hidden/);
  assert.doesNotMatch(page, /left-\[10000px\]/);
  assert.match(route, /if \(parsed\.data\.website\.trim\(\)\)/);
  assert.ok(
    route.indexOf("parsed.data.website.trim()") < route.indexOf('.from("contact_messages")'),
    "honeypot submissions must return before persistence and email delivery",
  );
});

test("launch and business-detail dialogs expose descriptions", async () => {
  const [offer, businessPopup] = await Promise.all([
    read("components/marketing/FirstBusinessesOfferModal.tsx"),
    read("components/map/BusinessPopup.tsx"),
  ]);

  assert.match(offer, /<DialogDescription/);
  assert.doesNotMatch(offer, /aria-describedby="first-businesses-offer-description"/);
  assert.doesNotMatch(offer, /id="first-businesses-offer-description"/);
  assert.match(businessPopup, /<SheetDescription className="sr-only">[\s\S]*?פרטי העסק/);
});
