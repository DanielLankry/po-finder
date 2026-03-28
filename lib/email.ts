import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const ADMIN_EMAIL = "support@pokarov.co.il"; // forwards to lankrydaniel7@gmail.com via Cloudflare
export const FROM_EMAIL = "פוקרוב <noreply@pokarov.co.il>";

// ── Email to Daniel: new business pending approval ──────────────────────────
export async function sendNewBusinessAlert(business: {
  id: string;
  name: string;
  category: string;
  phone: string | null;
  owner_email: string;
}) {
  const adminUrl = `https://pokarov.co.il/admin/businesses?secret=${process.env.ADMIN_SECRET}`;
  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `🏪 עסק חדש ממתין לאישור — ${business.name}`,
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #059669;">עסק חדש נרשם לפוקרוב</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; color: #555;">שם:</td><td style="padding: 8px; font-weight: bold;">${business.name}</td></tr>
          <tr style="background:#f9f9f9;"><td style="padding: 8px; color: #555;">קטגוריה:</td><td style="padding: 8px;">${business.category}</td></tr>
          <tr><td style="padding: 8px; color: #555;">טלפון:</td><td style="padding: 8px;">${business.phone ?? "—"}</td></tr>
          <tr style="background:#f9f9f9;"><td style="padding: 8px; color: #555;">מייל הבעלים:</td><td style="padding: 8px;">${business.owner_email}</td></tr>
        </table>
        <a href="${adminUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          עבור לאישור עסקים
        </a>
      </div>
    `,
  });
}

// ── Email to business owner: business approved ──────────────────────────────
export async function sendBusinessApprovedEmail(to: string, businessName: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `✅ העסק שלך אושר — ${businessName}`,
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #059669;">העסק שלך עלה למפה! 🎉</h2>
        <p>שלום,</p>
        <p>העסק <strong>${businessName}</strong> אושר ועלה לאוויר בפוקרוב.</p>
        <p>לקוחות בסביבתך יוכלו למצוא אותך עכשיו על המפה.</p>
        <a href="https://pokarov.co.il" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          צפה בפוקרוב
        </a>
        <p style="color: #888; font-size: 13px; margin-top: 24px;">צוות פוקרוב</p>
      </div>
    `,
  });
}
