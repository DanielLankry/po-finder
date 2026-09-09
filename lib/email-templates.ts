// Transactional HTML email templates for Pah Karov.
// The visual language mirrors the site's warm paper, green ink, terracotta
// actions, strong borders, and offset print-shop shadows.

const BASE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700;800&family=Karantina:wght@700&family=Rubik:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Assistant', Arial, sans-serif; background: #F7F3EA; direction: rtl; }
`;

const BODY_FONT = "'Assistant', Arial, sans-serif";
const DISPLAY_FONT = "'Karantina', 'Assistant', Arial, sans-serif";

const BRAND_LOCKUP_HTML = `
<table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
  <tr>
    <td style="vertical-align: middle; padding-left: 10px;">
      <img src="https://pokarov.co.il/logo.png" width="42" height="42" alt="" style="display: block; width: 42px; height: 42px; border: 0;" />
    </td>
    <td style="vertical-align: middle;">
      <span style="font-family: ${DISPLAY_FONT}; font-size: 32px; line-height: 1; font-weight: 700; color: #17402D;">פה קרוב</span>
    </td>
  </tr>
</table>`;

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
    <td align="center" style="padding: 28px 24px 22px; border-top: 2px dashed #17402D;">
      <p style="font-family: ${BODY_FONT}; font-size: 13px; color: #17402D; margin-bottom: 6px;">
        פה קרוב — גלו עסקים קטנים וניידים קרוב אליכם
      </p>
      <p style="font-family: ${BODY_FONT}; font-size: 12px; color: #57534E;">
        <a href="https://pokarov.co.il" style="color: #2D6A4F; text-decoration: underline;">pokarov.co.il</a>
        &nbsp;·&nbsp;
        <a href="mailto:support@pokarov.co.il" style="color: #2D6A4F; text-decoration: underline;">support@pokarov.co.il</a>
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
<body style="background-color: #F7F3EA; margin: 0; padding: 0; direction: rtl;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #F7F3EA; background-image: linear-gradient(rgba(23,64,45,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(23,64,45,0.045) 1px, transparent 1px); background-size: 32px 32px;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="560" style="max-width: 560px; width: 100%;">
          <!-- Card -->
          <tr>
            <td style="background: #FFFDF7; border: 2px solid #17402D; border-radius: 18px; overflow: hidden; box-shadow: 7px 7px 0 #17402D;">
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

// ── 1. Business Registration Received ───────────────────────────────────────
/** Builds the owner receipt shown immediately after a business draft is saved.
 * It confirms the review state and points owners toward profile improvements
 * while keeping the launch-offer start date tied explicitly to approval.
 */
export function businessRegistrationReceivedTemplate(businessName: string): string {
  const safeBusinessName = escapeHtml(businessName);

  return wrapper(`
    <tr>
      <td style="background: #EFF5F0; border-bottom: 2px solid #17402D; padding: 30px 28px 28px; text-align: center;">
        ${BRAND_LOCKUP_HTML}
        <table cellpadding="0" cellspacing="0" border="0" style="margin: 20px auto 14px;">
          <tr>
            <td align="center" style="width: 58px; height: 58px; background: #FFF8DC; border: 2px solid #17402D; border-radius: 14px; box-shadow: 4px 4px 0 #17402D; color: #17402D; font-size: 28px; line-height: 58px;">📌</td>
          </tr>
        </table>
        <h1 style="font-family: ${DISPLAY_FONT}; font-size: 38px; line-height: 1; font-weight: 700; color: #17402D; margin: 0 0 10px;">העסק נרשם בהצלחה</h1>
        <p style="font-family: ${BODY_FONT}; font-size: 16px; color: #2D6A4F; margin: 0; font-weight: 700;">${safeBusinessName} מחכה לבדיקה שלנו</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 34px 32px 24px;">
        <p style="font-family: ${BODY_FONT}; font-size: 16px; color: #44403C; line-height: 1.7; margin-bottom: 24px;">
          קיבלנו את פרטי העסק <strong style="color: #17402D;">${safeBusinessName}</strong>. נבדוק אותם ונשלח מייל נוסף ברגע שהעסק יעלה לאוויר.
        </p>
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #FFF8DC; border-radius: 14px; border: 2px solid #17402D; box-shadow: 3px 3px 0 #17402D; margin-bottom: 26px;">
          <tr>
            <td style="padding: 20px 22px;">
              <p style="font-family: ${BODY_FONT}; font-size: 14px; font-weight: 800; color: #17402D; margin: 0 0 10px;">בינתיים כדאי להשלים:</p>
              <p style="font-family: ${BODY_FONT}; font-size: 14px; color: #44403C; line-height: 1.8; margin: 0;">📷 תמונות טובות &nbsp;·&nbsp; 🕒 שעות פעילות &nbsp;·&nbsp; ✍️ תיאור קצר ומדויק</p>
            </td>
          </tr>
        </table>
        <p style="font-family: ${BODY_FONT}; font-size: 14px; color: #57534E; line-height: 1.7; margin: 0 0 24px;">
          אם העסק זכאי למבצע שלושת החודשים, התקופה תתחיל רק ביום אישור העסק — זמן ההמתנה לא ייגרע ממנה.
        </p>
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td align="center">
              <a href="https://pokarov.co.il/dashboard/profile" style="display: inline-block; background: #C4552D; color: #FFFFFF; border: 2px solid #8A3618; font-family: ${BODY_FONT}; font-size: 16px; font-weight: 800; text-decoration: none; padding: 13px 34px; border-radius: 12px; box-shadow: 4px 4px 0 #8A3618;">להשלמת פרטי העסק ←</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `);
}

// ── 2. Business Approved Email ───────────────────────────────────────────────
export function businessApprovedTemplate(businessName: string, expiresAt?: Date): string {
  const safeBusinessName = escapeHtml(businessName);
  const expiryStr = expiresAt
    ? expiresAt.toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return wrapper(`
    <!-- Neighborhood field-note header -->
    <tr>
      <td style="background: #EFF5F0; border-bottom: 2px solid #17402D; padding: 30px 28px 28px; text-align: center;">
        ${BRAND_LOCKUP_HTML}
        <table cellpadding="0" cellspacing="0" border="0" style="margin: 20px auto 14px;">
          <tr>
            <td align="center" style="width: 58px; height: 58px; background: #C4552D; border: 2px solid #8A3618; border-radius: 14px; box-shadow: 4px 4px 0 #8A3618; color: #FFFFFF; font-family: Arial, sans-serif; font-size: 30px; line-height: 58px; font-weight: 800;">✓</td>
          </tr>
        </table>
        <h1 style="font-family: ${DISPLAY_FONT}; font-size: 38px; line-height: 1; font-weight: 700; color: #17402D; margin: 0 0 10px;">העסק שלך על המפה</h1>
        <p style="font-family: ${BODY_FONT}; font-size: 16px; color: #2D6A4F; margin: 0; font-weight: 700;">${expiryStr ? `${safeBusinessName} אושר ועלה לאוויר` : `${safeBusinessName} אושר ומוכן להפעלה`}</p>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 36px 32px 20px;">
        <p style="font-family: 'Rubik', Arial, sans-serif; font-size: 16px; color: #374151; line-height: 1.7; margin-bottom: 24px;">
          שלום! 👋<br><br>
          אנחנו שמחים לבשר שהעסק <strong style="color: #111827;">${safeBusinessName}</strong> עבר את תהליך האימות בפה קרוב.
          <br><br>
          ${expiryStr
            ? `הפרסום התחיל עכשיו ויישאר פעיל עד <strong>${expiryStr}</strong>. זמן ההמתנה לאישור לא ירד מתקופת ההטבה.`
            : "כדי לפרסם אותו ללקוחות במפה וברשימה, אפשר לבחור עכשיו את משך ההופעה מלוח החיובים."}
        </p>

        <!-- Info box -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #FFF8DC; border-radius: 14px; border: 2px solid #17402D; box-shadow: 3px 3px 0 #17402D; margin-bottom: 26px;">
          <tr>
            <td style="padding: 20px 24px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding-bottom: 12px;">
                    <span style="font-size: 18px;">📍</span>
                    <span style="font-family: 'Rubik', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #17402D; margin-right: 8px;">${expiryStr ? "מופיע עכשיו במפה וברשימה" : "מוכן להפעלה לאחר תשלום"}</span>
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

        ${expiryStr ? `
        <p style="font-family: ${BODY_FONT}; font-size: 14px; color: #57534E; line-height: 1.7; margin: 0 0 24px;">
          עכשיו כשהעסק מפורסם, כדאי לעבור עליו כמו לקוח: להוסיף תמונות עדכניות, לוודא ששעות הפעילות נכונות ולחדד את התיאור.
        </p>` : ""}

        <!-- CTA -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td align="center" style="padding-bottom: 8px;">
              <a href="https://pokarov.co.il/${expiryStr ? "dashboard" : "dashboard/billing"}" style="display: inline-block; background: #C4552D; color: #FFFFFF; border: 2px solid #8A3618; font-family: ${BODY_FONT}; font-size: 16px; font-weight: 800; text-decoration: none; padding: 13px 34px; border-radius: 12px; box-shadow: 4px 4px 0 #8A3618;">
                ${expiryStr ? "לצפייה ושיפור העסק ←" : "לבחירת משך פרסום ←"}
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

// ── 3. New Business Alert (to admin) ────────────────────────────────────────
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
    <!-- Admin field-note header -->
    <tr>
      <td style="background: #EFF5F0; border-bottom: 2px solid #17402D; padding: 28px 28px 26px; text-align: center;">
        ${BRAND_LOCKUP_HTML}
        <p style="font-family: ${BODY_FONT}; font-size: 12px; font-weight: 800; color: #8A3618; letter-spacing: 1px; margin: 18px 0 8px;">פתק חדש למנהל</p>
        <h1 style="font-family: ${DISPLAY_FONT}; font-size: 35px; line-height: 1; font-weight: 700; color: #17402D; margin: 0;">עסק חדש מחכה לבדיקה</h1>
      </td>
    </tr>

    <!-- Business details -->
    <tr>
      <td style="padding: 32px 32px 24px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #FFF8DC; border-radius: 14px; border: 2px solid #17402D; box-shadow: 3px 3px 0 #17402D; overflow: hidden;">
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
              <a href="${safeBusiness.adminUrl}" style="display: inline-block; background: #C4552D; color: #FFFFFF; border: 2px solid #8A3618; font-family: ${BODY_FONT}; font-size: 15px; font-weight: 800; text-decoration: none; padding: 13px 34px; border-radius: 12px; box-shadow: 4px 4px 0 #8A3618;">
                לבדיקה ואישור ←
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `);
}

// ── 4. Contact Form Auto-Reply ────────────────────────────────────────────────
export function contactAutoReplyTemplate(name: string, subjectLabel: string): string {
  const safeName = escapeHtml(name);
  const safeSubjectLabel = escapeHtml(subjectLabel);

  return wrapper(`
    <!-- Friendly field-note header -->
    <tr>
      <td style="background: #EFF5F0; border-bottom: 2px solid #17402D; padding: 30px 28px 28px; text-align: center;">
        ${BRAND_LOCKUP_HTML}
        <p style="font-family: ${BODY_FONT}; font-size: 13px; font-weight: 800; color: #8A3618; margin: 18px 0 8px;">הפתק שלך הגיע אלינו</p>
        <h1 style="font-family: ${DISPLAY_FONT}; font-size: 36px; line-height: 1; font-weight: 700; color: #17402D; margin: 0 0 8px;">קיבלנו את פנייתך</h1>
        <p style="font-family: ${BODY_FONT}; font-size: 15px; color: #2D6A4F; margin: 0;">תודה שפנית אלינו, ${safeName}</p>
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
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #FFF8DC; border-radius: 14px; border: 2px solid #17402D; box-shadow: 3px 3px 0 #17402D; margin-bottom: 24px;">
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
                    <span style="font-family: 'Rubik', Arial, sans-serif; font-size: 14px; color: #374151;">נחזור אליך תוך <strong>2 ימי עסקים</strong></span>
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
              <a href="https://pokarov.co.il" style="display: inline-block; background: #C4552D; color: #FFFFFF; border: 2px solid #8A3618; font-family: ${BODY_FONT}; font-size: 15px; font-weight: 800; text-decoration: none; padding: 13px 34px; border-radius: 12px; box-shadow: 4px 4px 0 #8A3618;">
                בחזרה לפה קרוב ←
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `);
}

// ── 5. Personal Support Reply ────────────────────────────────────────────────
/** Builds a branded, human reply without exposing the administrator's mailbox. */
export function supportReplyTemplate(
  name: string,
  subjectLabel: string,
  message: string
): string {
  const safeName = escapeHtml(name);
  const safeSubjectLabel = escapeHtml(subjectLabel);
  const safeMessage = escapeHtml(message).replace(/\r?\n/g, "<br>");

  return wrapper(`
    <tr>
      <td style="background: #EFF5F0; border-bottom: 2px solid #17402D; padding: 30px 28px 28px; text-align: center;">
        ${BRAND_LOCKUP_HTML}
        <p style="font-family: ${BODY_FONT}; font-size: 13px; font-weight: 800; color: #8A3618; margin: 18px 0 8px;">תשובה אישית מצוות התמיכה</p>
        <h1 style="font-family: ${DISPLAY_FONT}; font-size: 36px; line-height: 1; font-weight: 700; color: #17402D; margin: 0 0 8px;">חזרנו אליך</h1>
        <p style="font-family: ${BODY_FONT}; font-size: 15px; color: #2D6A4F; margin: 0;">בנושא: ${safeSubjectLabel}</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 28px 32px 24px;">
        <p style="font-family: ${BODY_FONT}; font-size: 16px; color: #17402D; line-height: 1.7; margin: 0 0 18px;">שלום ${safeName},</p>
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #FFF8DC; border: 2px solid #17402D; border-radius: 14px; box-shadow: 4px 4px 0 #17402D;">
          <tr>
            <td style="padding: 22px 24px; font-family: ${BODY_FONT}; font-size: 16px; color: #292524; line-height: 1.75;">
              ${safeMessage}
            </td>
          </tr>
        </table>
        <p style="font-family: ${BODY_FONT}; font-size: 14px; color: #57534E; line-height: 1.7; margin: 24px 0 0;">
          אפשר להשיב ישירות למייל הזה — התשובה תגיע אל <strong style="color: #17402D;">support@pokarov.co.il</strong>.
        </p>
      </td>
    </tr>
  `);
}

// ── 6. Expiry Reminder ────────────────────────────────────────────────────────
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
    <!-- Expiry field-note header -->
    <tr>
      <td style="background: #F7E7DE; border-bottom: 2px solid #8A3618; padding: 30px 28px 28px; text-align: center;">
        ${BRAND_LOCKUP_HTML}
        <table cellpadding="0" cellspacing="0" border="0" style="margin: 18px auto 12px;">
          <tr>
            <td align="center" style="width: 58px; height: 58px; background: #FFF8DC; border: 2px solid #8A3618; border-radius: 14px; box-shadow: 4px 4px 0 #8A3618; font-size: 29px; line-height: 58px;">⏳</td>
          </tr>
        </table>
        <h1 style="font-family: ${DISPLAY_FONT}; font-size: 36px; line-height: 1; font-weight: 700; color: #8A3618; margin: 0 0 8px;">הפרסום עומד להסתיים</h1>
        <p style="font-family: ${BODY_FONT}; font-size: 15px; color: #8A3618; margin: 0; font-weight: 700;">נשארו ${daysBefore} ימים לפרסום ${safeBusinessName}</p>
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
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #FFF8DC; border-radius: 14px; border: 2px solid #8A3618; box-shadow: 3px 3px 0 #8A3618; margin-bottom: 24px;">
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
              <a href="${safeRenewUrl}" style="display: inline-block; background: #C4552D; color: #FFFFFF; border: 2px solid #8A3618; font-family: ${BODY_FONT}; font-size: 16px; font-weight: 800; text-decoration: none; padding: 13px 34px; border-radius: 12px; box-shadow: 4px 4px 0 #8A3618;">
                להארכת הפרסום ←
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `);
}
