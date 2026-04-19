import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "תנאי שימוש — פה",
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FAFAF7] pt-[88px] pb-16" dir="rtl">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="font-display font-extrabold text-3xl text-stone-900 mb-2">
            תנאי שימוש
          </h1>
          <p className="text-stone-500 text-sm mb-8">עדכון אחרון: ינואר 2026</p>

          <div className="space-y-6 text-stone-700 leading-relaxed">
            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                1. הסכמה לתנאים
              </h2>
              <p>
                השימוש בפלטפורמת <strong>פה</strong> מהווה הסכמה מלאה לתנאי שימוש אלה.
                אם אינכם מסכימים לתנאים, נא הימנעו מהשימוש.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                2. אחריות בעלי עסקים
              </h2>
              <p>
                בעלי עסקים אחראים לדיוק המידע שהם מפרסמים. הפלטפורמה אינה אחראית
                לאי-דיוקים בפרטי העסק, בשעות הפעילות, או במיקום.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                3. מדיניות ביקורות
              </h2>
              <p>
                ביקורות חייבות לשקף חוויה אמיתית. אסור לפרסם:
              </p>
              <ul className="list-disc list-inside space-y-1 text-stone-600 mt-2">
                <li>ביקורות כוזבות או ספאם</li>
                <li>תוכן פוגעני, מסית, או מאיים</li>
                <li>פרסומת מוסווית</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                4. הגבלת אחריות
              </h2>
              <p>
                הפלטפורמה מסופקת "כפי שהיא" ללא אחריות מפורשת או מרומזת. אנו לא
                נישא באחריות לנזקים ישירים, עקיפים, או נסיבתיים.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                5. שינויים בתנאים
              </h2>
              <p>
                אנו שומרים לעצמנו את הזכות לעדכן תנאים אלה. הודעה תשלח למשתמשים
                רשומים בדוא"ל 14 ימים לפני כניסת השינויים לתוקף.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                6. יצירת קשר
              </h2>
              <p>
                לשאלות ופניות:{" "}
                <a href="mailto:support@pokarov.co.il" className="text-[#059669] hover:underline">
                  support@pokarov.co.il
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
