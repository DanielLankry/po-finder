import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "הצהרת נגישות — פה",
};

export default function AccessibilityPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FAFAF7] pt-[88px] pb-16" dir="rtl">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="font-display font-extrabold text-3xl text-stone-900 mb-2">
            הצהרת נגישות
          </h1>
          <p className="text-stone-500 text-sm mb-8">
            בהתאם לתקן ישראלי 5568 (WCAG 2.1 AA) | עדכון: ינואר 2026
          </p>

          <div className="space-y-6 text-stone-700 leading-relaxed">
            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                מחויבות לנגישות
              </h2>
              <p>
                פלטפורמת <strong>פה</strong> מחויבת להנגשת שירותיה לכלל המשתמשים,
                לרבות בעלי מוגבלויות, בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות
                ולתקן ישראלי 5568.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                רמת הנגישות
              </h2>
              <p>
                האתר עומד ברמת תאימות <strong>AA</strong> של WCAG 2.1. בין היתר:
              </p>
              <ul className="list-disc list-inside space-y-2 text-stone-600 mt-2">
                <li>ניגודיות צבעים מינימלית של 4.5:1 לכל הטקסט</li>
                <li>ניווט מלא במקלדת — כולל מיקוד גלוי על כל אלמנט אינטראקטיבי</li>
                <li>תמיכה בקוראי מסך עם תגי ARIA בעברית</li>
                <li>טקסט חלופי (alt) לכל התמונות</li>
                <li>גודל מגע מינימלי של 44×44 פיקסלים</li>
                <li>כבוד להעדפת תנועה מופחתת (prefers-reduced-motion)</li>
                <li>קישור "דלגו לתוכן הראשי" בראש כל עמוד</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                טכנולוגיות נגישות נתמכות
              </h2>
              <ul className="list-disc list-inside space-y-1 text-stone-600">
                <li>NVDA + Chrome (Windows)</li>
                <li>VoiceOver + Safari (macOS / iOS)</li>
                <li>TalkBack (Android)</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                מגבלות ידועות
              </h2>
              <p>
                מפת גוגל המוטמעת עשויה להגביל נגישות מלאה. אנו עובדים על פתרונות
                חלופיים לגישה לרשימת עסקים ללא מפה.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                פנייה בנושא נגישות
              </h2>
              <p>
                נתקלתם בבעיית נגישות? נשמח לשמוע ולתקן:
              </p>
              <ul className="list-none space-y-1 mt-2">
                <li>
                  📧 מייל:{" "}
                  <a href="mailto:accessibility@po.co.il" className="text-[#059669] hover:underline">
                    accessibility@po.co.il
                  </a>
                </li>
                <li>📞 טלפון: 03-XXXXXXX (א׳–ה׳, 9:00–17:00)</li>
              </ul>
              <p className="mt-3 text-stone-500 text-sm">
                אנו מתחייבים להשיב תוך 5 ימי עסקים.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
