import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "מדיניות פרטיות — פה",
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
          <p className="text-stone-500 text-sm mb-8">עדכון אחרון: ינואר 2026</p>

          <div className="prose prose-stone max-w-none space-y-6 text-stone-700 leading-relaxed">
            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                1. מידע שאנו אוספים
              </h2>
              <p>
                פלטפורמת <strong>פה</strong> אוספת את המידע הבא:
              </p>
              <ul className="list-disc list-inside space-y-1 text-stone-600 mt-2">
                <li>שם, כתובת מייל, וסיסמה (מוצפנת)</li>
                <li>מיקום גיאוגרפי — רק בהסכמה מפורשת</li>
                <li>ביקורות ותגובות שפרסמתם</li>
                <li>נתוני עסק שהוזנו על-ידי בעלי עסקים (כתובת, שעות, תמונות)</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                2. שימוש במידע
              </h2>
              <p>
                אנו משתמשים במידע אך ורק לצורך:
              </p>
              <ul className="list-disc list-inside space-y-1 text-stone-600 mt-2">
                <li>הפעלת שירות הפלטפורמה</li>
                <li>הצגת עסקים על המפה</li>
                <li>שיפור חוויית המשתמש</li>
                <li>עמידה בדרישות חוקיות</li>
              </ul>
              <p className="mt-3">
                <strong>אין אנו מוכרים מידע לצדדים שלישיים.</strong>
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                3. אחסון ואבטחה
              </h2>
              <p>
                המידע מאוחסן בשירות Supabase (PostgreSQL) עם הצפנה מלאה. אנו עומדים
                בתקני אבטחה מחמירים ומבצעים גיבויים שוטפים.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                4. זכויות המשתמש
              </h2>
              <p>
                בהתאם לחוק הגנת הפרטיות הישראלי, יש לכם זכות:
              </p>
              <ul className="list-disc list-inside space-y-1 text-stone-600 mt-2">
                <li>לעיין במידע האישי שלכם</li>
                <li>לתקן מידע שגוי</li>
                <li>לבקש מחיקת החשבון וכל המידע הקשור אליו</li>
                <li>לקבל את המידע שלכם בפורמט נגיש</li>
              </ul>
              <p className="mt-3">
                לפנייה: <a href="mailto:privacy@po.co.il" className="text-[#059669] hover:underline">privacy@po.co.il</a>
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                5. עוגיות (Cookies)
              </h2>
              <p>
                אנו משתמשים בעוגיות הכרחיות לניהול הסשן בלבד. לא נעשה שימוש בעוגיות
                פרסומיות ללא הסכמתכם המפורשת.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
