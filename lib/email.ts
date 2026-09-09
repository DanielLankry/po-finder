import { Resend } from "resend";
import {
  businessRegistrationReceivedTemplate,
  businessApprovedTemplate,
  newBusinessAlertTemplate,
  contactAutoReplyTemplate,
  expiryReminderTemplate,
  supportReplyTemplate,
} from "./email-templates";

const resend = new Resend(process.env.RESEND_API_KEY);

export const ADMIN_EMAIL = "support@pokarov.co.il";
export const FROM_EMAIL = "פה קרוב <noreply@pokarov.co.il>";
export const SUPPORT_FROM_EMAIL = "פה קרוב <support@pokarov.co.il>";

// ── Business owner: registration received ────────────────────────────────────
/** Sends a non-marketing receipt so an owner knows the draft reached review.
 * Resend receives the shared branded HTML and routes any direct reply to support.
 */
export async function sendBusinessRegistrationReceivedEmail(to: string, businessName: string) {
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    replyTo: ADMIN_EMAIL,
    subject: `קיבלנו את העסק שלך — ${businessName}`,
    html: businessRegistrationReceivedTemplate(businessName),
  });
  if (error) throw new Error(error.message);
}

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
    replyTo: business.owner_email,
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
    replyTo: ADMIN_EMAIL,
    subject: `✅ העסק שלך אושר — ${businessName}`,
    html: businessApprovedTemplate(businessName, expiresAt),
  });
}

// ── Contact form auto-reply ───────────────────────────────────────────────────
export async function sendContactAutoReply(to: string, name: string, subjectLabel: string) {
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    replyTo: ADMIN_EMAIL,
    subject: `קיבלנו את פנייתך — פה קרוב`,
    html: contactAutoReplyTemplate(name, subjectLabel),
  });
  if (error) throw new Error(error.message);
}

/** Send an administrator's reply from the public support identity. */
export async function sendSupportReply(
  to: string,
  name: string,
  subjectLabel: string,
  message: string
) {
  const { data, error } = await resend.emails.send({
    from: SUPPORT_FROM_EMAIL,
    to,
    replyTo: ADMIN_EMAIL,
    subject: `מענה לפנייתך: ${subjectLabel} — פה קרוב`,
    html: supportReplyTemplate(name, subjectLabel, message),
  });
  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

// ── Expiry reminder ───────────────────────────────────────────────────────────
export async function sendExpiryReminder(
  to: string,
  businessName: string,
  expiresAt: Date,
  daysBefore: 30 | 7 | 1
) {
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    replyTo: ADMIN_EMAIL,
    subject: `⏰ הרישום של ${businessName} עומד לפוג בעוד ${daysBefore} ימים`,
    html: expiryReminderTemplate(
      businessName,
      expiresAt,
      "https://pokarov.co.il/dashboard/billing",
      daysBefore
    ),
  });
  if (error) throw new Error(error.message);
}
