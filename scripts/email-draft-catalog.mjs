import {
  businessRegistrationReceivedTemplate, businessApprovedTemplate, newBusinessAlertTemplate,
  contactAutoReplyTemplate, expiryReminderTemplate,
} from "../lib/email-templates.ts";

const variable = (key) => "{{{" + key + "}}}";
const exampleExpiry = new Date("2099-01-01T12:00:00Z");
const expiryLabel = exampleExpiry.toLocaleDateString("he-IL", {
  day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jerusalem",
});
const withExpiryVariable = (html) => html.replaceAll(expiryLabel, variable("EXPIRY_DATE"));

/** Resend drafts are previews of the HTML sent by the app, built from the same renderers. */
export const emailDraftCatalog = [
  {
    id: "25b3b14d-3bec-4900-8174-0611638fdd3a",
    alias: "business-registration-received",
    html: businessRegistrationReceivedTemplate(variable("BUSINESS_NAME")),
    keys: ["BUSINESS_NAME"],
  },
  {
    id: "ec4f265f-6a0d-4a9c-9299-160797971945",
    alias: "contact-auto-reply",
    html: contactAutoReplyTemplate(variable("CUSTOMER_NAME"), variable("SUBJECT_LABEL")),
    keys: ["CUSTOMER_NAME", "SUBJECT_LABEL"],
  },
  {
    id: "cb2660e3-d03e-4ca9-a9cf-faa865d8ed5f",
    alias: "business-approved-payment-needed",
    html: businessApprovedTemplate(variable("BUSINESS_NAME")),
    keys: ["BUSINESS_NAME"],
  },
  {
    id: "81b73b1a-e56e-48ff-8742-1d94aff72be1",
    alias: "business-approved-promotion",
    html: withExpiryVariable(businessApprovedTemplate(variable("BUSINESS_NAME"), exampleExpiry)),
    keys: ["BUSINESS_NAME", "EXPIRY_DATE"],
  },
  {
    id: "de962d26-cafe-462e-9240-7e79b8ccb231",
    alias: "new-business-alert",
    html: newBusinessAlertTemplate({
      name: variable("BUSINESS_NAME"), category: variable("CATEGORY"),
      phone: variable("PHONE"), owner_email: variable("OWNER_EMAIL"), adminUrl: variable("ADMIN_URL"),
    }),
    keys: ["BUSINESS_NAME", "CATEGORY", "PHONE", "OWNER_EMAIL", "ADMIN_URL"],
  },
  {
    id: "8105f5aa-07c7-44f6-8ca3-8c7b7be0dc4b",
    alias: "expiry-reminder",
    html: withExpiryVariable(expiryReminderTemplate(variable("BUSINESS_NAME"), exampleExpiry, variable("RENEW_URL"), 7))
      .replace("נשארו 7 ימים", "נשארו " + variable("DAYS_BEFORE") + " ימים"),
    keys: ["BUSINESS_NAME", "EXPIRY_DATE", "RENEW_URL", "DAYS_BEFORE"],
  },
].map(({ keys, ...draft }) => ({
  ...draft,
  variables: keys.map((key) => ({ key, type: key === "DAYS_BEFORE" ? "number" : "string" })),
}));

export function validateDraftVariables(draft) {
  const used = [...new Set([...draft.html.matchAll(/\{\{\{([A-Z_]+)\}\}\}/g)].map((match) => match[1]))].sort();
  const declared = draft.variables.map((v) => v.key).sort();
  if (JSON.stringify(used) !== JSON.stringify(declared)) {
    throw new Error("Template variables do not match: " + draft.alias);
  }
}
