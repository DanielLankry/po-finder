import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { BRAND_NAME, BUSINESS_INFO } from "@/lib/site-config";

export const metadata = {
  title: "הצהרת נגישות",
  description: "הצהרת הנגישות של פה קרוב ודרכי יצירת קשר בנושא נגישות.",
};

export default function AccessibilityPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F7F3EA] pt-[88px] pb-16" dir="rtl">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="font-display font-extrabold text-3xl text-stone-900 mb-2">
            הצהרת נגישות
          </h1>
          <p className="text-stone-500 text-sm mb-8">
            עדכון אחרון: מאי 2026 · האתר מכוון לתאימות תקן ישראלי 5568 ו-WCAG ברמה AA
          </p>

          <div className="space-y-8 text-stone-700 leading-relaxed">
            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                מחויבות לנגישות
              </h2>
              <p>
                פלטפורמת <strong>{BRAND_NAME}</strong> מיועדת לשימוש כלל הציבור, לרבות
                אנשים עם מוגבלות. אנו פועלים לשפר את נגישות האתר בהתאם לחוק שוויון זכויות
                לאנשים עם מוגבלות, תקנות הנגישות הרלוונטיות ותקן ישראלי 5568.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                פעולות נגישות באתר
              </h2>
              <ul className="list-disc list-inside space-y-2 text-stone-600">
                <li>מבנה עמודים סמנטי וכותרות היררכיות.</li>
                <li>ניווט מקלדת, מיקוד נראה וקישור &quot;דלגו לתוכן הראשי&quot;.</li>
                <li>תמיכה בכיוון כתיבה עברי ובתוויות ARIA לרכיבים אינטראקטיביים.</li>
                <li>ניגודיות צבעים משופרת ברכיבי פעולה וטקסט מרכזיים.</li>
                <li>תפריט נגישות לשינוי גודל טקסט, ניגודיות, הדגשת קישורים וסמן מוגדל.</li>
                <li>התחשבות בהעדפת תנועה מופחתת כאשר היא מוגדרת בדפדפן.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                טכנולוגיות שנבדקות
              </h2>
              <ul className="list-disc list-inside space-y-2 text-stone-600">
                <li>Chrome ו-Edge במחשב שולחני.</li>
                <li>Safari ו-Chrome במובייל.</li>
                <li>קוראי מסך נפוצים כגון NVDA, VoiceOver ו-TalkBack לפי זמינות בדיקה.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                מגבלות ידועות וחלופות
              </h2>
              <p className="mb-2">
                רכיבי צד שלישי, ובמיוחד מפות Google, עשויים שלא להיות נגישים באופן מלא בכל
                מצב או טכנולוגיה מסייעת. לכן האתר מציג גם רשימת עסקים לצד המפה, כך שניתן
                להגיע למידע המרכזי ללא שימוש במפה בלבד.
              </p>
              <p>
                אם נתקלתם במידע שאינו נגיש, ננסה לספק חלופה סבירה ולתקן את הבעיה.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                פנייה בנושא נגישות
              </h2>
              <p>
                לפניות, בקשות התאמה או דיווח על תקלה בנגישות אפשר לפנות אל{" "}
                <a href={`mailto:${BUSINESS_INFO.contactEmail}`} className="text-[#2D6A4F] hover:underline">
                  {BUSINESS_INFO.contactEmail}
                </a>{" "}
                או דרך <a href="/contact" className="text-[#2D6A4F] hover:underline">טופס יצירת קשר</a>.
              </p>
              <p className="mt-3 text-sm text-stone-500">
                כדי שנוכל לטפל מהר, ציינו את כתובת העמוד, תיאור הבעיה, סוג המכשיר,
                הדפדפן וטכנולוגיית העזר שבה השתמשתם אם קיימת.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
