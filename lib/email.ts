import { Resend } from "resend";
import {
  businessApprovedTemplate,
  newBusinessAlertTemplate,
  contactAutoReplyTemplate,
  expiryReminderTemplate,
} from "./email-templates";

const resend = new Resend(process.env.RESEND_API_KEY);

export const ADMIN_EMAIL = "support@pokarov.co.il";
export const FROM_EMAIL = "פוקרוב <noreply@pokarov.co.il>";

// ── Admin alert: new business pending approval ────────────────────────────────
export async function sendNewBusinessAlert(business: {
  id: string;
  name: string;
  category: string;
  phone: string | null;
  owner_email: string;
}) {
  const adminUrl = `https://pokarov.co.il/admin`;
  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `🏪 עסק חדש ממתין לאישור — ${business.name}`,
    html: newBusinessAlertTemplate({
      name: business.name,
      category: business.category,
      phone: business.phone,
      owner_email: business.owner_email,
      adminUrl,
    }),
  });
}

// ── Business owner: listing approved ─────────────────────────────────────────
export async function sendBusinessApprovedEmail(to: string, businessName: string, expiresAt?: Date) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `✅ העסק שלך אושר — ${businessName}`,
    html: businessApprovedTemplate(businessName, expiresAt),
  });
}

// ── Contact form auto-reply ───────────────────────────────────────────────────
export async function sendContactAutoReply(to: string, name: string, subjectLabel: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `קיבלנו את פנייתך — פוקרוב`,
    html: contactAutoReplyTemplate(name, subjectLabel),
  });
}

// ── Expiry reminder ───────────────────────────────────────────────────────────
export async function sendExpiryReminder(to: string, businessName: string, expiresAt: Date) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `⏰ הרישום של ${businessName} עומד לפוג בעוד 7 ימים`,
    html: expiryReminderTemplate(businessName, expiresAt, "https://pokarov.co.il/pricing"),
  });
}
