import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "מדיניות פרטיות — פה קרוב",
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
            עדכון אחרון: אפריל 2026 · בתוקף מיום פרסומה · מסמך זה עומד בדרישות תיקון 13 לחוק הגנת הפרטיות, התשמ&quot;א–1981
          </p>

          <div className="space-y-8 text-stone-700 leading-relaxed">

            {/* 1 */}
            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                1. מיהו בעל מאגר המידע?
              </h2>
              <p>
                פלטפורמת <strong>פה קרוב</strong> (להלן: "השירות" או "אנחנו") מופעלת תחת הדומיין{" "}
                <span className="font-mono text-sm">pokarov.co.il</span>.
                לפניות בנושא פרטיות:{" "}
                <a href="mailto:privacy@pokarov.co.il" className="text-[#059669] hover:underline">
                  privacy@pokarov.co.il
                </a>
              </p>
            </section>

            {/* 2 */}
            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                2. מידע שאנו אוספים
              </h2>
              <p className="mb-2">
                השירות אוסף מידע בשתי דרכים:
              </p>
              <p className="font-semibold text-stone-800 mb-1">מידע שמסרתם ישירות:</p>
              <ul className="list-disc list-inside space-y-1 text-stone-600 mb-3">
                <li>שם מלא, כתובת דוא&quot;ל, סיסמה מוצפנת (בהרשמה)</li>
                <li>פרטי העסק: שם, כתובת, שעות, תמונות, טלפון (לבעלי עסקים)</li>
                <li>ביקורות ודירוגים שפרסמתם</li>
                <li>פניות שיצרתם דרך טופס יצירת קשר</li>
              </ul>
              <p className="font-semibold text-stone-800 mb-1">מידע שנאסף אוטומטית (בהסכמה בלבד):</p>
              <ul className="list-disc list-inside space-y-1 text-stone-600">
                <li>נתוני גלישה ואנליטיקה — רק לאחר הסכמה מפורשת לעוגיות</li>
                <li>מיקום גיאוגרפי — רק אם הרשיתם גישה מפורשת בדפדפן</li>
                <li>כתובת IP, סוג מכשיר, דפדפן — לצורכי אבטחה ואנליטיקה</li>
              </ul>
            </section>

            {/* 3 */}
            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                3. מטרות עיבוד המידע והבסיס החוקי
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-stone-100 text-stone-800">
                      <th className="text-right p-3 border border-stone-200 font-semibold">מטרה</th>
                      <th className="text-right p-3 border border-stone-200 font-semibold">בסיס חוקי</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["הפעלת השירות ואימות זהות", "הסכם (תנאי שימוש)"],
                      ["הצגת עסקים על המפה", "הסכם"],
                      ["שמירת ביקורות", "הסכם + הסכמה"],
                      ["שליחת הודעות שירות חיוניות (אימות, שחזור סיסמה)", "הסכם"],
                      ["אנליטיקה ושיפור השירות", "הסכמה (ניתנת דרך בנאר העוגיות)"],
                      ["עמידה בחובות חוקיות ורגולטוריות", "חובה חוקית"],
                    ].map(([purpose, basis]) => (
                      <tr key={purpose} className="even:bg-stone-50">
                        <td className="p-3 border border-stone-200">{purpose}</td>
                        <td className="p-3 border border-stone-200 text-stone-500">{basis}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-stone-500 text-sm mt-3">
                <strong>אין אנו משתמשים במידע לצורכי שיווק ואין אנו מוכרים מידע לצדדים שלישיים.</strong>
              </p>
            </section>

            {/* 4 */}
            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                4. מעבדי נתונים צד שלישי
              </h2>
              <p className="mb-3">
                אנו משתמשים בספקים חיצוניים לצורך הפעלת השירות. כל ספק מחויב לעיבוד המידע בהתאם למדיניות הפרטיות שלו:
              </p>
              <div className="space-y-3">
                {[
                  {
                    name: "Supabase",
                    role: "מסד נתונים, אימות, אחסון תמונות",
                    location: "ארה&quot;ב / AWS (eu-west-1)",
                    link: "https://supabase.com/privacy",
                  },
                  {
                    name: "Vercel",
                    role: "אחסון ופריסה של השירות, אנליטיקה אנונימית",
                    location: "ארה&quot;ב / רשת גלובלית",
                    link: "https://vercel.com/legal/privacy-policy",
                  },
                  {
                    name: "PostHog",
                    role: "אנליטיקה התנהגותית — רק בהסכמה מפורשת",
                    location: "שרתים אירופאיים (eu.i.posthog.com)",
                    link: "https://posthog.com/privacy",
                  },
                  {
                    name: "Google Maps Platform",
                    role: "הצגת מפה וחיפוש מיקומים",
                    location: "גלובלי",
                    link: "https://policies.google.com/privacy",
                  },
                  {
                    name: "Resend",
                    role: "שליחת מיילים עסקיים (אימות, איפוס סיסמה)",
                    location: "ארה&quot;ב",
                    link: "https://resend.com/privacy",
                  },
                ].map((p) => (
                  <div key={p.name} className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-stone-900">{p.name}</span>
                      <span className="text-xs text-stone-400">·</span>
                      <span className="text-xs text-stone-500">{p.location}</span>
                    </div>
                    <p className="text-sm text-stone-600 mb-1">{p.role}</p>
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#059669] hover:underline"
                    >
                      מדיניות פרטיות של {p.name} ←
                    </a>
                  </div>
                ))}
              </div>
            </section>

            {/* 5 */}
            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                5. שמירת מידע
              </h2>
              <ul className="list-disc list-inside space-y-1 text-stone-600">
                <li>נתוני חשבון — נשמרים כל עוד החשבון פעיל</li>
                <li>ביקורות ופעילות עסקית — נשמרות לצורכי שירות; ניתן למחיקה לפי בקשה</li>
                <li>לוגים ואנליטיקה — עד 12 חודשים</li>
                <li>נתוני תשלום — נשמרים אצל ספק התשלום בהתאם לדרישות החוק (7 שנים לצורכי מע&quot;מ)</li>
                <li>לאחר מחיקת חשבון — פרטים אישיים נמחקים תוך 30 ימי עסקים</li>
              </ul>
            </section>

            {/* 6 */}
            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                6. זכויות הנושא לפי חוק הגנת הפרטיות (תיקון 13)
              </h2>
              <p className="mb-3">
                בהתאם לתיקון 13 לחוק הגנת הפרטיות (התשמ&quot;א–1981), יש לכם הזכויות הבאות:
              </p>
              <ul className="list-disc list-inside space-y-2 text-stone-600">
                <li>
                  <strong>עיון:</strong> לקבל עותק של המידע האישי שמצוי אצלנו אודותיכם
                </li>
                <li>
                  <strong>תיקון:</strong> לתקן מידע שגוי, לא מדויק, או מיושן
                </li>
                <li>
                  <strong>מחיקה:</strong> לבקש מחיקת חשבונכם וכל המידע האישי הקשור אליו
                </li>
                <li>
                  <strong>התנגדות:</strong> להתנגד לעיבוד מידע לצורכי שיווק (לא רלוונטי כיום — אנו אינם משווקים)
                </li>
                <li>
                  <strong>ניידות:</strong> לקבל את המידע שלכם בפורמט נגיש (JSON / CSV)
                </li>
              </ul>
              <div className="mt-4 bg-[#ECFDF5] border border-[#D1FAE5] rounded-xl p-4">
                <p className="text-[#065F46] text-sm font-medium mb-1">כיצד לממש את זכויותיכם?</p>
                <p className="text-[#047857] text-sm">
                  שלחו מייל ל-{" "}
                  <a href="mailto:privacy@pokarov.co.il" className="font-semibold hover:underline">
                    privacy@pokarov.co.il
                  </a>{" "}
                  עם בקשתכם. <strong>נענה תוך 30 ימים</strong> ממועד קבלת הבקשה,
                  כנדרש בתיקון 13 לחוק הגנת הפרטיות.
                </p>
              </div>
              <p className="text-stone-500 text-sm mt-3">
                אם אינכם מרוצים מהטיפול בפנייתכם, תוכלו להגיש תלונה ל
                <a
                  href="https://www.gov.il/he/departments/the-privacy-protection-authority"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#059669] hover:underline mx-1"
                >
                  הרשות להגנת הפרטיות
                </a>
                (ממשל זמין).
              </p>
            </section>

            {/* 7 */}
            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                7. עוגיות (Cookies)
              </h2>
              <p className="mb-3">
                אנו משתמשים בשתי קטגוריות עוגיות:
              </p>
              <div className="space-y-2">
                <div className="border border-stone-200 rounded-xl p-4">
                  <p className="font-semibold text-stone-800 mb-1">עוגיות הכרחיות</p>
                  <p className="text-sm text-stone-600">
                    ניהול סשן (Supabase Auth) — נדרשות לפעולת השירות. לא ניתן לבטל.
                  </p>
                </div>
                <div className="border border-stone-200 rounded-xl p-4">
                  <p className="font-semibold text-stone-800 mb-1">עוגיות אנליטיקה (PostHog, Vercel Analytics)</p>
                  <p className="text-sm text-stone-600">
                    פועלות <strong>רק לאחר הסכמתכם</strong> דרך בנאר העוגיות שמוצג בכניסה הראשונה.
                    ניתן לשנות את ההסכמה בכל עת על ידי מחיקת נתוני הגלישה או פנייה אלינו.
                  </p>
                </div>
              </div>
            </section>

            {/* 8 */}
            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                8. אבטחת מידע
              </h2>
              <ul className="list-disc list-inside space-y-1 text-stone-600">
                <li>כל התקשורת מוצפנת ב-TLS/HTTPS</li>
                <li>הסיסמאות מוצפנות עם bcrypt (לא נשמרות בטקסט גלוי)</li>
                <li>מסד הנתונים מוגן עם Row Level Security (RLS) ב-Supabase</li>
                <li>גישה למידע מוגבלת לעובדים מורשים בלבד</li>
              </ul>
            </section>

            {/* 9 */}
            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                9. שינויים במדיניות
              </h2>
              <p>
                שינויים מהותיים יפורסמו בדף זה ויישלח עדכון בדוא&quot;ל לכל המשתמשים הרשומים
                לפחות <strong>14 ימים לפני כניסתם לתוקף</strong>.
              </p>
            </section>

            {/* 10 */}
            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                10. יצירת קשר
              </h2>
              <p>
                לכל שאלה, בקשה, או תלונה הנוגעת לפרטיות:{" "}
                <a href="mailto:privacy@pokarov.co.il" className="text-[#059669] hover:underline">
                  privacy@pokarov.co.il
                </a>
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
