// High-quality HTML email templates for Pah Karov
// Uses Google Fonts (Rubik), inline CSS for email client compatibility

const BASE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Rubik', Arial, sans-serif; background: #F3F4F6; direction: rtl; }
`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const FOOTER_HTML = `
<table cellpadding="0" cellspacing="0" border="0" width="100%">
  <tr>
    <td align="center" style="padding: 32px 24px 24px; border-top: 1px solid #E5E7EB; margin-top: 32px;">
      <p style="font-family: 'Rubik', Arial, sans-serif; font-size: 13px; color: #9CA3AF; margin-bottom: 6px;">
        פה קרוב — גלו עסקים קטנים וניידים קרוב אליכם
      </p>
      <p style="font-family: 'Rubik', Arial, sans-serif; font-size: 12px; color: #D1D5DB;">
        <a href="https://pokarov.co.il" style="color: #2D6A4F; text-decoration: none;">pokarov.co.il</a>
        &nbsp;·&nbsp;
        <a href="mailto:support@pokarov.co.il" style="color: #9CA3AF; text-decoration: none;">support@pokarov.co.il</a>
      </p>
    </td>
  </tr>
</table>
`;

function wrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <style>${BASE_STYLES}</style>
</head>
<body style="background-color: #F3F4F6; margin: 0; padding: 0; direction: rtl;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #F3F4F6; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="560" style="max-width: 560px; width: 100%;">
          <!-- Card -->
          <tr>
            <td style="background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.07);">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                ${content}
                <tr><td style="padding: 0 32px 8px;">${FOOTER_HTML}</td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── 1. Business Approved Email ───────────────────────────────────────────────
export function businessApprovedTemplate(businessName: string, expiresAt?: Date): string {
  const safeBusinessName = escapeHtml(businessName);
  const expiryStr = expiresAt
    ? expiresAt.toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return wrapper(`
    <!-- Header gradient -->
    <tr>
      <td>
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="background: linear-gradient(135deg, #2D6A4F 0%, #1F5038 100%); padding: 40px 32px 36px; text-align: center; border-radius: 20px 20px 0 0;">
              <!-- Logo white version -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 20px;">
                <tr>
                  <td>
                    <svg width="44" height="55" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));">
                      <path d="M20 0C9.507 0 1 8.507 1 19c0 13.255 17.5 29.5 18.25 30.188a1.125 1.125 0 0 0 1.5 0C21.5 48.5 39 32.255 39 19 39 8.507 30.493 0 20 0z" fill="rgba(255,255,255,0.95)"/>
                      <text x="20" y="26" text-anchor="middle" font-family="Arial, sans-serif" font-weight="800" font-size="20" fill="#2D6A4F">פ</text>
                    </svg>
                  </td>
                  <td style="padding-right: 10px; vertical-align: middle;">
                    <span style="font-family: 'Rubik', Arial, sans-serif; font-size: 22px; font-weight: 800; color: white; letter-spacing: -0.5px;">פה קרוב</span>
                  </td>
                </tr>
              </table>
              <!-- Checkmark -->
              <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                  <tr><td align="center" style="font-size: 32px; line-height: 64px; width: 64px; height: 64px;">✓</td></tr>
                </table>
              </div>
              <h1 style="font-family: 'Rubik', Arial, sans-serif; font-size: 26px; font-weight: 800; color: white; margin: 0 0 8px;">העסק שלך אושר! 🎉</h1>
              <p style="font-family: 'Rubik', Arial, sans-serif; font-size: 15px; color: rgba(255,255,255,0.85); margin: 0;">${safeBusinessName} עבר אימות ומוכן לרישום</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 36px 32px 20px;">
        <p style="font-family: 'Rubik', Arial, sans-serif; font-size: 16px; color: #374151; line-height: 1.7; margin-bottom: 24px;">
          שלום! 👋<br><br>
          אנחנו שמחים לבשר שהעסק <strong style="color: #111827;">${safeBusinessName}</strong> עבר את תהליך האימות בפה קרוב.
          <br><br>
          כדי לפרסם אותו ללקוחות במפה וברשימה, אפשר לבחור עכשיו את משך ההופעה מלוח החיובים.
        </p>

        <!-- Info box -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #F0FDF4; border-radius: 14px; border: 1px solid #DDEBE0; margin-bottom: 24px;">
          <tr>
            <td style="padding: 20px 24px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding-bottom: 12px;">
                    <span style="font-size: 18px;">📍</span>
                    <span style="font-family: 'Rubik', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #17402D; margin-right: 8px;">מוכן להפעלה לאחר תשלום</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 12px;">
                    <span style="font-size: 18px;">⭐</span>
                    <span style="font-family: 'Rubik', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #17402D; margin-right: 8px;">לקוחות יכולים להשאיר ביקורות</span>
                  </td>
                </tr>
                ${expiryStr ? `
                <tr>
                  <td>
                    <span style="font-size: 18px;">📅</span>
                    <span style="font-family: 'Rubik', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #17402D; margin-right: 8px;">פעיל עד ${expiryStr}</span>
                  </td>
                </tr>` : ""}
              </table>
            </td>
          </tr>
        </table>

        <!-- CTA -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td align="center" style="padding-bottom: 8px;">
              <a href="https://pokarov.co.il/dashboard/billing" style="display: inline-block; background: linear-gradient(135deg, #2D6A4F, #1F5038); color: white; font-family: 'Rubik', Arial, sans-serif; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 40px; border-radius: 50px; box-shadow: 0 4px 16px rgba(45,106,79,0.35);">
                בחירת משך הופעה ←
              </a>
            </td>
          </tr>
        </table>

        <p style="font-family: 'Rubik', Arial, sans-serif; font-size: 13px; color: #9CA3AF; text-align: center; margin-top: 16px;">
          שאלות? <a href="mailto:support@pokarov.co.il" style="color: #2D6A4F; text-decoration: none;">support@pokarov.co.il</a>
        </p>
      </td>
    </tr>
  `);
}

// ── 2. New Business Alert (to admin) ────────────────────────────────────────
export function newBusinessAlertTemplate(business: {
  name: string;
  category: string;
  phone: string | null;
  owner_email: string;
  adminUrl: string;
}): string {
  const safeBusiness = {
    name: escapeHtml(business.name),
    category: escapeHtml(business.category),
    phone: business.phone ? escapeHtml(business.phone) : "—",
    owner_email: escapeHtml(business.owner_email),
    adminUrl: escapeHtml(business.adminUrl),
  };

  return wrapper(`
    <!-- Header -->
    <tr>
      <td>
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="background: linear-gradient(135deg, #1E3A5F 0%, #1E40AF 100%); padding: 32px; text-align: center; border-radius: 20px 20px 0 0;">
              <p style="font-family: 'Rubik', Arial, sans-serif; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px;">לוח ניהול פה קרוב</p>
              <h1 style="font-family: 'Rubik', Arial, sans-serif; font-size: 24px; font-weight: 800; color: white; margin: 0;">🏪 עסק חדש ממתין לאישור</h1>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Business details -->
    <tr>
      <td style="padding: 32px 32px 24px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #F8FAFC; border-radius: 14px; border: 1px solid #E2E8F0; overflow: hidden;">
          <tr>
            <td style="padding: 0;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr style="border-bottom: 1px solid #E2E8F0;">
                  <td style="padding: 14px 20px; background: #F1F5F9; font-family: 'Rubik', Arial, sans-serif; font-size: 12px; font-weight: 600; color: #64748B; width: 110px;">שם העסק</td>
                  <td style="padding: 14px 20px; font-family: 'Rubik', Arial, sans-serif; font-size: 15px; font-weight: 700; color: #0F172A;">${safeBusiness.name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #E2E8F0;">
                  <td style="padding: 14px 20px; background: #F1F5F9; font-family: 'Rubik', Arial, sans-serif; font-size: 12px; font-weight: 600; color: #64748B;">קטגוריה</td>
                  <td style="padding: 14px 20px; font-family: 'Rubik', Arial, sans-serif; font-size: 14px; color: #374151;">
                    <span style="background: #DCFCE7; color: #166534; padding: 3px 10px; border-radius: 20px; font-size: 13px; font-weight: 600;">${safeBusiness.category}</span>
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid #E2E8F0;">
                  <td style="padding: 14px 20px; background: #F1F5F9; font-family: 'Rubik', Arial, sans-serif; font-size: 12px; font-weight: 600; color: #64748B;">טלפון</td>
                  <td style="padding: 14px 20px; font-family: 'Rubik', Arial, sans-serif; font-size: 14px; color: #374151;">${safeBusiness.phone}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 20px; background: #F1F5F9; font-family: 'Rubik', Arial, sans-serif; font-size: 12px; font-weight: 600; color: #64748B;">מייל בעלים</td>
                  <td style="padding: 14px 20px; font-family: 'Rubik', Arial, sans-serif; font-size: 14px; color: #374151;">
                    <a href="mailto:${safeBusiness.owner_email}" style="color: #2563EB; text-decoration: none;">${safeBusiness.owner_email}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- CTA -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 24px;">
          <tr>
            <td align="center">
              <a href="${safeBusiness.adminUrl}" style="display: inline-block; background: linear-gradient(135deg, #1E40AF, #1E3A5F); color: white; font-family: 'Rubik', Arial, sans-serif; font-size: 15px; font-weight: 700; text-decoration: none; padding: 13px 36px; border-radius: 50px;">
                עבור לאישור ←
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `);
}

// ── 3. Contact Form Auto-Reply ────────────────────────────────────────────────
export function contactAutoReplyTemplate(name: string, subjectLabel: string): string {
  const safeName = escapeHtml(name);
  const safeSubjectLabel = escapeHtml(subjectLabel);

  return wrapper(`
    <!-- Header -->
    <tr>
      <td>
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="padding: 40px 32px 32px; text-align: center; border-radius: 20px 20px 0 0;">
              <!-- Logo -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 24px;">
                <tr>
                  <td>
                    <svg width="44" height="55" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;">
                      <defs><linearGradient id="pg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6FA583"/><stop offset="100%" stop-color="#2D6A4F"/></linearGradient></defs>
                      <path d="M20 0C9.507 0 1 8.507 1 19c0 13.255 17.5 29.5 18.25 30.188a1.125 1.125 0 0 0 1.5 0C21.5 48.5 39 32.255 39 19 39 8.507 30.493 0 20 0z" fill="url(#pg2)"/>
                      <text x="20" y="26" text-anchor="middle" font-family="Arial, sans-serif" font-weight="800" font-size="20" fill="white">פ</text>
                    </svg>
                  </td>
                  <td style="padding-right: 10px; vertical-align: middle;">
                    <span style="font-family: 'Rubik', Arial, sans-serif; font-size: 22px; font-weight: 800; color: #2D6A4F;">פה קרוב</span>
                  </td>
                </tr>
              </table>
              <h1 style="font-family: 'Rubik', Arial, sans-serif; font-size: 24px; font-weight: 800; color: #111827; margin: 0 0 8px;">קיבלנו את פנייתך 📬</h1>
              <p style="font-family: 'Rubik', Arial, sans-serif; font-size: 15px; color: #6B7280; margin: 0;">תודה על פנייתך, ${safeName}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Divider -->
    <tr><td style="padding: 0 32px;"><div style="height: 1px; background: linear-gradient(to left, transparent, #E5E7EB, transparent);"></div></td></tr>

    <!-- Body -->
    <tr>
      <td style="padding: 28px 32px 24px;">
        <p style="font-family: 'Rubik', Arial, sans-serif; font-size: 15px; color: #374151; line-height: 1.7; margin-bottom: 20px;">
          קיבלנו את פנייתך בנושא <strong style="color: #111827;">${safeSubjectLabel}</strong> ונשיב אליך בהקדם האפשרי.
        </p>

        <!-- Timeline -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #F7F3EA; border-radius: 14px; border: 1px solid #E5E7EB; margin-bottom: 24px;">
          <tr>
            <td style="padding: 20px 24px;">
              <p style="font-family: 'Rubik', Arial, sans-serif; font-size: 13px; font-weight: 700; color: #2D6A4F; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.5px;">⏱ מה קורה עכשיו?</p>
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding-bottom: 10px;">
                    <span style="font-size: 16px; margin-left: 6px;">✅</span>
                    <span style="font-family: 'Rubik', Arial, sans-serif; font-size: 14px; color: #374151;">הפנייה נקלטה במערכת</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 10px;">
                    <span style="font-size: 16px; margin-left: 6px;">🔍</span>
                    <span style="font-family: 'Rubik', Arial, sans-serif; font-size: 14px; color: #374151;">הצוות יבדוק את פנייתך</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <span style="font-size: 16px; margin-left: 6px;">💬</span>
                    <span style="font-family: 'Rubik', Arial, sans-serif; font-size: 14px; color: #374151;">נחזור אליך תוך <strong>3 ימי עסקים</strong></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- CTA -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td align="center">
              <a href="https://pokarov.co.il" style="display: inline-block; background: linear-gradient(135deg, #2D6A4F, #1F5038); color: white; font-family: 'Rubik', Arial, sans-serif; font-size: 15px; font-weight: 700; text-decoration: none; padding: 13px 36px; border-radius: 50px; box-shadow: 0 4px 14px rgba(45,106,79,0.3);">
                בחזרה לפה קרוב ←
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `);
}

// ── 4. Expiry Reminder ────────────────────────────────────────────────────────
export function expiryReminderTemplate(
  businessName: string,
  expiresAt: Date,
  renewUrl: string,
  daysBefore: 30 | 7 | 1
): string {
  const safeBusinessName = escapeHtml(businessName);
  const safeRenewUrl = escapeHtml(renewUrl);
  const expiryStr = expiresAt.toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });

  return wrapper(`
    <!-- Header amber -->
    <tr>
      <td>
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="background: linear-gradient(135deg, #D97706 0%, #B45309 100%); padding: 36px 32px; text-align: center; border-radius: 20px 20px 0 0;">
              <p style="font-size: 40px; margin-bottom: 12px;">⏰</p>
              <h1 style="font-family: 'Rubik', Arial, sans-serif; font-size: 22px; font-weight: 800; color: white; margin: 0 0 6px;">הרישום שלך עומד לפוג</h1>
              <p style="font-family: 'Rubik', Arial, sans-serif; font-size: 15px; color: rgba(255,255,255,0.85); margin: 0;">נשארו <strong>${daysBefore} ימים</strong> לרישום ${safeBusinessName}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding: 32px 32px 24px;">
        <p style="font-family: 'Rubik', Arial, sans-serif; font-size: 15px; color: #374151; line-height: 1.7; margin-bottom: 24px;">
          הרישום של <strong>${safeBusinessName}</strong> בפה קרוב יפוג בתאריך <strong>${expiryStr}</strong>.
          <br><br>
          לאחר מכן העסק שלך לא יופיע יותר על המפה ולקוחות לא יוכלו למצוא אותך.
        </p>

        <!-- Urgency box -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #FEF3C7; border-radius: 14px; border: 1px solid #FDE68A; margin-bottom: 24px;">
          <tr>
            <td style="padding: 18px 24px;">
              <p style="font-family: 'Rubik', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #92400E; margin: 0;">
                🔔 חדשו עכשיו ושמרו על המיקום שלכם במפה!
              </p>
            </td>
          </tr>
        </table>

        <!-- CTA -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td align="center">
              <a href="${safeRenewUrl}" style="display: inline-block; background: linear-gradient(135deg, #D97706, #B45309); color: white; font-family: 'Rubik', Arial, sans-serif; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 40px; border-radius: 50px; box-shadow: 0 4px 14px rgba(217,119,6,0.35);">
                חדשו את הרישום ←
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `);
}
