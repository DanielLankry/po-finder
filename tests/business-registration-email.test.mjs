import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const emailTemplatesSource = await readFile(
  new URL("../lib/email-templates.ts", import.meta.url),
  "utf8",
);
const emailSource = await readFile(new URL("../lib/email.ts", import.meta.url), "utf8");
const businessSource = await readFile(new URL("../lib/db/businesses.ts", import.meta.url), "utf8");

test("transactional emails use the site paper and ink brand tokens", () => {
  for (const token of ["#F7F3EA", "#FFFDF7", "#17402D", "#C4552D", "#8A3618"]) {
    assert.match(emailTemplatesSource, new RegExp(token));
  }
  assert.match(emailTemplatesSource, /box-shadow: 7px 7px 0 #17402D/);
  assert.match(emailTemplatesSource, /https:\/\/pokarov\.co\.il\/logo\.png/);
});

test("business creation sends owner and admin notifications without blocking the insert", () => {
  assert.match(emailSource, /sendBusinessRegistrationReceivedEmail/);
  assert.match(businessSource, /Promise\.allSettled/);
  assert.match(businessSource, /sendBusinessRegistrationReceivedEmail\(user\.email, data\.name\)/);
  assert.match(businessSource, /sendNewBusinessAlert\(/);
});
