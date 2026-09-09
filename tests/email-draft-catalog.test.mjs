import assert from "node:assert/strict";
import test from "node:test";
import { emailDraftCatalog, validateDraftVariables } from "../scripts/email-draft-catalog.mjs";

test("all six draft previews declare exactly the variables rendered in their HTML", () => {
  assert.equal(emailDraftCatalog.length, 6);
  for (const draft of emailDraftCatalog) validateDraftVariables(draft);
  const contact = emailDraftCatalog.find((draft) => draft.alias === "contact-auto-reply");
  assert.match(contact.html, /\{\{\{CUSTOMER_NAME\}\}\}/);
  assert.doesNotMatch(contact.html, /\{\{\{NAME\}\}\}/);
});

test("unpaid approval preview does not claim that the business is public", () => {
  const draft = emailDraftCatalog.find((draft) => draft.alias === "business-approved-payment-needed");
  assert.match(draft.html, />העסק שלך אושר<\/h1>/);
  assert.doesNotMatch(draft.html, /מופיע עכשיו במפה/);
});
