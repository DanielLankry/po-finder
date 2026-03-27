import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const ADMIN_EMAIL = "lankrydaniel7@gmail.com";
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

// ── Email to Daniel: new Spot pending approval ──────────────────────────────
export async function sendNewSpotAlert(spot: {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string | null;
  duration_days: number;
  amount_paid: number;
  owner_email: string;
}) {
  const adminUrl = `https://pokarov.co.il/admin/spots?secret=${process.env.ADMIN_SECRET}`;
  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `✦ Spot חדש ממתין לאישור — ${spot.name}`,
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #F97316;">Spot חדש נרשם לפוקרוב</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; color: #555;">שם:</td><td style="padding: 8px; font-weight: bold;">${spot.name}</td></tr>
          <tr style="background:#fff7ed;"><td style="padding: 8px; color: #555;">קטגוריה:</td><td style="padding: 8px;">${spot.category}</td></tr>
          <tr><td style="padding: 8px; color: #555;">כתובת:</td><td style="padding: 8px;">${spot.address}</td></tr>
          <tr style="background:#fff7ed;"><td style="padding: 8px; color: #555;">טלפון:</td><td style="padding: 8px;">${spot.phone ?? "—"}</td></tr>
          <tr><td style="padding: 8px; color: #555;">משך:</td><td style="padding: 8px;">${spot.duration_days} ימים</td></tr>
          <tr style="background:#fff7ed;"><td style="padding: 8px; color: #555;">שולם:</td><td style="padding: 8px; font-weight: bold;">₪${spot.amount_paid / 100}</td></tr>
          <tr><td style="padding: 8px; color: #555;">מייל הבעלים:</td><td style="padding: 8px;">${spot.owner_email}</td></tr>
        </table>
        <a href="${adminUrl}" style="display: inline-block; background: #F97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          עבור לאישור Spots
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

// ── Email to spot owner: spot approved ──────────────────────────────────────
export async function sendSpotApprovedEmail(to: string, spotName: string, expiresAt: Date) {
  const expiryStr = expiresAt.toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `✦ הSpot שלך אושר — ${spotName}`,
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #F97316;">הSpot שלך עלה למפה! ✦</h2>
        <p>שלום,</p>
        <p>הדוכן <strong>${spotName}</strong> אושר ועלה לאוויר בפוקרוב.</p>
        <p>הדוכן יופיע על המפה עד <strong>${expiryStr}</strong>.</p>
        <a href="https://pokarov.co.il" style="display: inline-block; background: #F97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          ראה את הדוכן שלי על המפה
        </a>
        <p style="color: #888; font-size: 13px; margin-top: 24px;">צוות פוקרוב</p>
      </div>
    `,
  });
}
