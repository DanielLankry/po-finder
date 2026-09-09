import "../tests/utils/source-loader.mjs";
const { paymentEmailTemplate } = await import("../lib/payment-email-template.ts");

// Hosted templates mirror the runtime renderer. Runtime deliberately sends the
// immutable HTML request stored in the outbox, rather than a mutable hosted alias.
const sample = { attemptId: "30000000-0000-4000-8000-000000000099", businessName: "{{{BUSINESS_NAME}}}", amountAgorot: 23456, durationMonths: 17, planDays: 510, expiresAt: "2099-01-01T12:00:00+00:00", listingState: "active", occurredAt: "2098-01-01T12:00:00+00:00" };
const date = value => new Intl.DateTimeFormat("he-IL", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Jerusalem" }).format(new Date(value));
const amount = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(sample.amountAgorot / 100);
export const paymentEmailCatalog = ["payment_succeeded", "listing_renewed", "payment_refunded"].map(eventType => {
  const rendered = paymentEmailTemplate({ ...sample, eventType });
  let html = rendered.html;
  for (const [text,key] of [[amount,"AMOUNT"],["17 חודשים","DURATION"],[date(sample.expiresAt),"EXPIRY_DATE"],[date(sample.occurredAt),"EVENT_DATE"],[sample.attemptId,"REFERENCE"],["העסק מוצג במפה וברשימת העסקים.","LISTING_STATUS"]]) html=html.replaceAll(text,`{{{${key}}}}`);
  const keys = [...new Set([...html.matchAll(/\{\{\{([A-Z_]+)\}\}\}/g)].map(m=>m[1]))];
  return { alias: eventType.replaceAll("_","-"), name: rendered.subject, subject: rendered.subject, html, from: "פה קרוב <noreply@pokarov.co.il>", replyTo: "support@pokarov.co.il", variables: keys.map(key=>({key,type:"string"})) };
});
