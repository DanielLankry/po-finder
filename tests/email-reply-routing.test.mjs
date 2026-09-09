import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const emailModule = await readFile(new URL("../lib/email.ts", import.meta.url), "utf8");
const contactRoute = await readFile(
  new URL("../app/api/contact/route.ts", import.meta.url),
  "utf8",
);

test("customer-facing transactional emails route replies to support", () => {
  const supportReplyCount = emailModule.match(/replyTo: ADMIN_EMAIL/g)?.length ?? 0;
  assert.equal(supportReplyCount, 4);
  assert.match(contactRoute, /to: email,[\s\S]*?replyTo: ADMIN_EMAIL/);
});

test("new business alerts route replies directly to the owner", () => {
  assert.match(
    emailModule,
    /to: ADMIN_EMAIL,[\s\S]*?replyTo: business\.owner_email/,
  );
});

test("the contact notification still routes replies to the customer", () => {
  assert.match(
    contactRoute,
    /to: ADMIN_EMAIL,[\s\S]*?replyTo: email/,
  );
});
