import { z } from "zod";
import { notificationTemplate } from "./email-templates";

export const paymentEmailSchema = z.object({
  attemptId: z.string().uuid(),
  eventType: z.enum(["payment_succeeded", "listing_renewed", "payment_refunded"]),
  businessName: z.string().nullable(),
  amountAgorot: z.number().int().nonnegative(),
  durationMonths: z.number().int().positive().nullable(),
  planDays: z.number().int().positive(),
  expiresAt: z.string().datetime({ offset: true }).nullable(),
  listingState: z.enum(["awaiting_profile", "awaiting_approval", "active", "paused", "expired"]),
  occurredAt: z.string().datetime({ offset: true }),
});

const escape = (text: string) => text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const date = (value: string) => new Intl.DateTimeFormat("he-IL", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Jerusalem" }).format(new Date(value));

/** Render the immutable event snapshot, never today's possibly changed plan price. */
export function paymentEmailTemplate(input: unknown) {
  const event = paymentEmailSchema.parse(input);
  const refund = event.eventType === "payment_refunded";
  const title = refund ? "ההחזר שלכם בוצע" : event.eventType === "listing_renewed" ? "תקופת הפרסום חודשה" : "התשלום שלכם התקבל";
  const amount = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(event.amountAgorot / 100);
  const duration = event.durationMonths ? `${event.durationMonths} חודשים` : `${event.planDays} ימים`;
  const state = {
    awaiting_profile: refund ? "הזכות לפרסום שנרכשה בעסקה זו בוטלה." : "התשלום נשמר בחשבון. השלב הבא הוא השלמת פרטי העסק ושליחתו לאישור. העסק עדיין אינו מוצג לציבור.",
    awaiting_approval: "העסק ממתין לאישור מנהל ואינו מוצג לציבור עדיין.",
    active: "העסק מוצג במפה וברשימת העסקים.",
    paused: "הצגת העסק מושהית. לפרטים ולהפעלה פנו לתמיכה.",
    expired: "תקופת הפרסום הסתיימה והעסק אינו מוצג לציבור.",
  }[event.listingState];
  const details = [
    event.businessName ? `העסק: ${event.businessName}` : "פרסום העסק שלכם בפה קרוב",
    `${refund ? "סכום ההחזר" : "הסכום ששולם"}: ${amount}`,
    `משך הפרסום בעסקה: ${duration}`,
    event.expiresAt ? `${refund ? "תוקף הרישום לאחר ההחזר" : "תוקף הרישום"}: ${date(event.expiresAt)}` : null,
    `מועד הפעולה: ${date(event.occurredAt)} (שעון ישראל)`,
  ].filter((line): line is string => Boolean(line));
  const note = refund ? "ההחזר בוצע דרך ספק הסליקה. מועד הופעת הזיכוי בפירוט האשראי תלוי בחברת האשראי." : "זו הודעת עדכון על השירות. מסמך התשלום נשלח בנפרד דרך ספק הסליקה.";
  const html = notificationTemplate(title,
    `<p>${details.map(escape).join("<br>")}</p><p style="margin-top:20px;padding:16px;background:#FFF8DC;border:2px solid #17402D;border-radius:12px;"><strong>מצב הפרסום לאחר הפעולה</strong><br>${state}</p><p style="margin-top:18px;">${note}</p><p style="margin-top:12px;font-size:12px;word-break:break-all;">מספר אסמכתה: <span dir="ltr">${escape(event.attemptId)}</span></p>`,
    "לפרטי החיובים והפרסום", "https://pokarov.co.il/dashboard/billing");
  return { subject: `${title} | פה קרוב`, html, text: [title, ...details, "מצב הפרסום לאחר הפעולה:", state, note, `מספר אסמכתה: ${event.attemptId}`, "https://pokarov.co.il/dashboard/billing", "לתמיכה: support@pokarov.co.il"].join("\n") };
}
