import { mkdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { notificationTemplate } from "../lib/email-templates.ts";

// Supabase expands these Go-template variables; never replace them with a test token.
const account = '<span dir="ltr" style="unicode-bidi:isolate;word-break:break-all;">{{ .Email }}</span>';
const old = '<span dir="ltr" style="unicode-bidi:isolate;word-break:break-all;">{{ .OldEmail }}</span>';
const next = '<span dir="ltr" style="unicode-bidi:isolate;word-break:break-all;">{{ .NewEmail }}</span>';
export const securityTemplates = [
  {
    slug: "password-changed",
    subject: "הסיסמה שלכם שונתה | פה קרוב",
    html: notificationTemplate("הסיסמה שלכם שונתה", `<p>הסיסמה של החשבון ${account} שונתה בהצלחה.</p><p style="margin-top:16px;">אם ביצעתם את השינוי, אין צורך בפעולה נוספת.</p><p style="margin-top:16px;padding:16px;background:#FFF8DC;border:2px solid #17402D;border-radius:12px;"><strong>לא אתם שיניתם את הסיסמה?</strong><br>אפסו את הסיסמה בהקדם ופנו אלינו ב־<a href="mailto:support@pokarov.co.il">support@pokarov.co.il</a>. לעולם לא נבקש מכם לשלוח לנו סיסמה או קוד אימות במייל.</p>`, "לאיפוס הסיסמה", "https://pokarov.co.il/auth/forgot-password"),
  },
  {
    slug: "email-address-changed",
    subject: "כתובת המייל בחשבון שלכם שונתה | פה קרוב",
    html: notificationTemplate("כתובת המייל שלכם שונתה", `<p>כתובת המייל המשויכת לחשבון שלכם עודכנה.</p><p style="margin-top:16px;">הכתובת הקודמת: ${old}<br>הכתובת החדשה: ${account}</p><p style="margin-top:16px;padding:16px;background:#FFF8DC;border:2px solid #17402D;border-radius:12px;"><strong>לא ביקשתם את השינוי?</strong><br>פנו אלינו בהקדם ב־support@pokarov.co.il כדי שנוכל לעזור לאבטח את החשבון. אל תשלחו סיסמאות או קודי אימות.</p>`, "לפנייה לתמיכה", "mailto:support@pokarov.co.il"),
  },
  {
    slug: "change-email-address",
    subject: "אישור שינוי כתובת המייל | פה קרוב",
    html: notificationTemplate("אישור שינוי כתובת המייל", `<p>קיבלנו בקשה לשנות את כתובת המייל בחשבון שלכם.</p><p style="margin-top:16px;">הכתובת הנוכחית: ${account}<br>הכתובת המבוקשת: ${next}</p><p style="margin-top:16px;">לחצו על הכפתור כדי לאשר את השינוי. ייתכן שנדרש אישור גם בכתובת המייל השנייה.</p><p style="margin-top:16px;padding:16px;background:#FFF8DC;border:2px solid #17402D;border-radius:12px;">אם לא ביקשתם את השינוי, אל תאשרו אותו ופנו אלינו ב־<a href="mailto:support@pokarov.co.il">support@pokarov.co.il</a>.</p>`, "לאישור שינוי המייל", "{{ .ConfirmationURL }}"),
  },
];

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dir = new URL("../supabase/templates/", import.meta.url);
  mkdirSync(dir, { recursive: true });
  for (const template of securityTemplates) writeFileSync(new URL(`${template.slug}.html`, dir), template.html);
}
