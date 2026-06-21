import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LegalIdentity from "@/components/legal/LegalIdentity";
import { BRAND_NAME, BUSINESS_INFO, SITE_DOMAIN } from "@/lib/site-config";

const contactEmail = BUSINESS_INFO.contactEmail;

export const metadata = {
  title: "מדיניות פרטיות",
  description: "מדיניות הפרטיות של פה קרוב: איזה מידע נאסף, לאילו מטרות, למי הוא נמסר ואיך אפשר לממש זכויות.",
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FAFAF7] pt-[88px] pb-16" dir="rtl">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="font-display font-extrabold text-3xl text-stone-900 mb-2">
            מדיניות פרטיות
          </h1>
          <p className="text-stone-500 text-sm mb-8">
            עדכון אחרון: מאי 2026 · בתוקף מיום פרסומה
          </p>

          <div className="space-y-8 text-stone-700 leading-relaxed">
            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                1. מי מפעיל את השירות?
              </h2>
              <p className="mb-3">
                פלטפורמת <strong>{BRAND_NAME}</strong> פועלת בדומיין{" "}
                <span className="font-mono text-sm" dir="ltr">{SITE_DOMAIN}</span>. לפניות בנושא פרטיות,
                אבטחת מידע או מימוש זכויות אפשר לפנות אל{" "}
                <a href={`mailto:${contactEmail}`} className="text-[#059669] hover:underline">
                  {contactEmail}
                </a>.
              </p>
              <LegalIdentity />
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                2. איזה מידע נאסף?
              </h2>
              <ul className="list-disc list-inside space-y-2 text-stone-600">
                <li>פרטי חשבון: שם, דוא&quot;ל, תפקיד משתמש ונתוני התחברות המנוהלים ב-Supabase Auth.</li>
                <li>פרטי עסק שמוזנים על ידי בעל העסק: שם, תיאור, קטגוריה, כתובת, מיקום, שעות פעילות, תמונות, טלפון, WhatsApp, אתר, Instagram, כשרות ומספר עוסק אם נמסר.</li>
                <li>תוכן משתמשים: ביקורות, דירוגים, מועד פרסום ופעולות מועדפים.</li>
                <li>פניות שירות: שם, דוא&quot;ל, נושא הפנייה ותוכן ההודעה בטופס יצירת קשר.</li>
                <li>נתוני תשלום מוגבלים: מזהה ניסיון תשלום, סכום, תקופה, סטטוס, מזהה עסקה, קוד אישור ומספר כרטיס מוסווה אם הוחזר מספק התשלום. איננו שומרים מספר כרטיס מלא או CVV.</li>
                <li>נתוני שימוש ואבטחה: כתובת IP, סוג דפדפן, עמודים שנצפו, אירועי לחיצה בסיסיים ולוגים הנדרשים להפעלה, אבטחה ומניעת ניצול לרעה.</li>
                <li>נתוני מיקום דפדפן נאספים רק אם המשתמש אישר זאת בדפדפן. אפשר להשתמש באתר גם ללא הרשאת מיקום.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                3. מטרות השימוש במידע
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-stone-100 text-stone-800">
                      <th className="border border-stone-200 p-3 text-right font-semibold">מטרה</th>
                      <th className="border border-stone-200 p-3 text-right font-semibold">דוגמאות שימוש</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["הפעלת השירות", "יצירת חשבון, הצגת עסקים, שמירת שעות, תמונות וביקורות"],
                      ["תשלומים וחיוב", "הפניה לדף תשלום מאובטח, בדיקת סטטוס עסקה, החזרים ותיעוד חשבונאי"],
                      ["שירות לקוחות", "מענה לפניות, טיפול בבקשות פרטיות, נגישות, חיוב ותמיכה"],
                      ["אבטחה ומניעת שימוש לרעה", "הגבלת קצב, לוגים, איתור תקלות ושמירה על תקינות השירות"],
                      ["אנליטיקה ושיפור", "מדידת שימוש באתר רק לאחר הסכמה לעוגיות אנליטיקה"],
                      ["חובות חוקיות", "שמירת רשומות תשלום וחשבונאות, מענה לרשות מוסמכת לפי דין"],
                    ].map(([purpose, examples]) => (
                      <tr key={purpose} className="even:bg-stone-50">
                        <td className="border border-stone-200 p-3 font-medium text-stone-800">{purpose}</td>
                        <td className="border border-stone-200 p-3 text-stone-600">{examples}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-sm text-stone-500">
                איננו מוכרים מידע אישי. דיוור שיווקי, אם יופעל בעתיד, יישלח רק בהתאם להסכמה
                נפרדת ולכללי הסרה מדיוור.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                4. מידע ציבורי בפלטפורמה
              </h2>
              <p>
                פרטי עסק שבעל העסק מזין לצורך פרסום, כגון שם העסק, תיאור, מיקום, שעות,
                תמונות, קישורי קשר וביקורות, מיועדים להצגה לציבור. יש להימנע מהזנת מידע
                אישי שאינכם רוצים שיופיע באתר.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                5. ספקים חיצוניים
              </h2>
              <p className="mb-3">
                אנו משתמשים בספקים חיצוניים להפעלת השירות. העברת מידע אליהם נעשית לפי
                הצורך התפעולי והחוזי של השירות:
              </p>
              <div className="space-y-3">
                {[
                  ["Supabase", "מסד נתונים, אימות משתמשים ואחסון תמונות", "https://supabase.com/privacy"],
                  ["Vercel", "אחסון, פריסה, תשתית אתר ואנליטיקה לאחר הסכמה", "https://vercel.com/legal/privacy-policy"],
                  ["PostHog", "אנליטיקה התנהגותית לאחר הסכמה", "https://posthog.com/privacy"],
                  ["Google Maps Platform", "מפה, חיפוש כתובות ותצוגת מיקומים", "https://policies.google.com/privacy"],
                  ["Resend", "שליחת הודעות שירות ודוא\"ל תמיכה", "https://resend.com/privacy"],
                  ["HYP / YaadPay", "דף תשלום מאובטח, אימות עסקה, ביטול והחזר", "https://yaadpay.co.il"],
                  ["Sentry", "ניטור שגיאות ותקלות תוכנה", "https://sentry.io/privacy/"],
                ].map(([name, role, href]) => (
                  <div key={name} className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                    <p className="font-semibold text-stone-900">{name}</p>
                    <p className="text-sm text-stone-600">{role}</p>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#059669] hover:underline"
                    >
                      מידע נוסף על {name}
                    </a>
                  </div>
                ))}
              </div>
            </section>

            <section id="cookies">
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                6. עוגיות ואחסון מקומי
              </h2>
              <ul className="list-disc list-inside space-y-2 text-stone-600">
                <li>עוגיות הכרחיות: סשן התחברות, אבטחה ותפעול בסיסי. לא ניתן לספק חשבון משתמש בלעדיהן.</li>
                <li>אחסון מקומי הכרחי/פונקציונלי: העדפות נגישות, מועדפים לאורחים, מצב סיור והעדפת עוגיות.</li>
                <li>אנליטיקה: PostHog ו-Vercel Analytics מופעלים רק לאחר לחיצה על &quot;אישור&quot; בבאנר העוגיות.</li>
              </ul>
              <p className="mt-3 text-sm text-stone-500">
                אפשר לפתוח מחדש את בחירת העוגיות דרך הקישור &quot;העדפות עוגיות&quot; בתחתית האתר.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                7. שמירת מידע
              </h2>
              <ul className="list-disc list-inside space-y-2 text-stone-600">
                <li>חשבון משתמש נשמר כל עוד החשבון פעיל, אלא אם נדרשת שמירה נוספת לפי דין.</li>
                <li>פרטי עסקים ותוכן ציבורי נשמרים כל עוד העסק פעיל או נדרש לתיעוד השירות.</li>
                <li>פניות שירות נשמרות בדרך כלל עד 24 חודשים, אלא אם נדרש אחרת לצורך טיפול במחלוקת.</li>
                <li>רשומות תשלום וחשבונאות נשמרות לפי דרישות הדין החלות על מס, הנהלת חשבונות ומחלוקות.</li>
                <li>אנליטיקה ולוגים תפעוליים נשמרים לתקופה מוגבלת בהתאם להגדרות הספקים ולצורך אבטחה ותפעול.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                8. זכויות משתמשים
              </h2>
              <p className="mb-3">
                בהתאם לדין החל, ניתן לבקש לעיין במידע אישי שמוחזק עליכם, לתקן מידע שאינו
                נכון, למחוק חשבון או להסיר מידע שאינו דרוש עוד לשירות, בכפוף לחובות שמירה
                ולחריגים בדין.
              </p>
              <div className="rounded-xl border border-[#D1FAE5] bg-[#ECFDF5] p-4">
                <p className="text-sm text-[#065F46]">
                  למימוש זכויות שלחו בקשה אל{" "}
                  <a href={`mailto:${contactEmail}`} className="font-semibold hover:underline">
                    {contactEmail}
                  </a>. ייתכן שנבקש מידע נוסף לאימות זהות לפני טיפול בבקשה.
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                9. אבטחת מידע
              </h2>
              <ul className="list-disc list-inside space-y-2 text-stone-600">
                <li>האתר מוגש ב-HTTPS.</li>
                <li>סיסמאות מנוהלות על ידי Supabase Auth ואינן נשמרות אצלנו בטקסט גלוי.</li>
                <li>מסד הנתונים מוגן באמצעות Row Level Security והרשאות שירות מוגבלות.</li>
                <li>גישה ניהולית למידע מיועדת למורשים בלבד ולצורכי תפעול, תמיכה, חיוב ואבטחה.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                10. שינויים ופניות לרשות
              </h2>
              <p>
                נעדכן מדיניות זו מעת לעת. שינוי מהותי יפורסם באתר, ובמקרים מתאימים נמסור
                הודעה למשתמשים רשומים. אם אינכם מרוצים מהטיפול בבקשת פרטיות, ניתן לפנות אל{" "}
                <a
                  href="https://www.gov.il/he/departments/the-privacy-protection-authority"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#059669] hover:underline"
                >
                  הרשות להגנת הפרטיות
                </a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
