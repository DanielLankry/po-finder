import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LegalIdentity from "@/components/legal/LegalIdentity";
import { BRAND_NAME, BUSINESS_INFO } from "@/lib/site-config";

export const metadata = {
  title: "מדיניות ביטולים והחזרים",
  description: "מדיניות הביטולים וההחזרים לשירותי ההצטרפות העסקית של פה קרוב.",
};

export default function RefundPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FAFAF7] pt-[88px] pb-16" dir="rtl">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="font-display font-extrabold text-3xl text-stone-900 mb-2">
            מדיניות ביטולים והחזרים
          </h1>
          <p className="text-stone-500 text-sm mb-8">עדכון אחרון: מאי 2026</p>

          <div className="space-y-8 text-stone-700 leading-relaxed">
            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                1. פרטי העסקה והמפעיל
              </h2>
              <p className="mb-3">
                מדיניות זו חלה על רכישת תקופת הצגה עסקית בפלטפורמת <strong>{BRAND_NAME}</strong>.
                פרטי המסלול, התקופה והמחיר מוצגים בעמוד המחירים לפני מעבר לתשלום.
              </p>
              <LegalIdentity />
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                2. איך מבקשים ביטול
              </h2>
              <p>
                אפשר לבקש ביטול באמצעות{" "}
                <Link href="/contact" className="text-[#059669] hover:underline">
                  טופס יצירת קשר
                </Link>{" "}
                או בדוא&quot;ל אל{" "}
                <a href={`mailto:${BUSINESS_INFO.contactEmail}`} className="text-[#059669] hover:underline">
                  {BUSINESS_INFO.contactEmail}
                </a>. בבקשה יש לציין שם מלא, דוא&quot;ל שבו בוצעה ההרשמה, מזהה עסקה או
                תאריך תשלום אם ידוע, ואת העסק הרלוונטי.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                3. ביטול בתוך 14 ימים
              </h2>
              <p>
                ניתן לבקש ביטול בתוך 14 ימים ממועד ביצוע העסקה, בכפוף להוראות הדין החלות
                על עסקת מכר מרחוק ועל השירות שניתן בפועל. כאשר השירות כבר הופעל והעסק
                הוצג לציבור, ייתכן חיוב יחסי עבור התקופה שבה השירות סופק בפועל, וכן דמי
                ביטול אם הדין מאפשר זאת.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                4. ביטול לאחר 14 ימים
              </h2>
              <p>
                אם המסלול אינו מתחדש אוטומטית, הביטול לאחר 14 ימים בדרך כלל יעצור שימוש
                עתידי אך לא יקנה החזר יחסי, אלא אם קיימת חובה אחרת לפי דין או פגם מהותי
                בשירות. אם יופעל בעתיד מסלול מתחדש, ניתן יהיה לבטל המשך חיוב עתידי בכל
                עת בהתאם לדין ולהוראות שיוצגו במסלול.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                5. החזר כספי
              </h2>
              <p>
                החזר שאושר יבוצע לאמצעי התשלום המקורי כאשר הדבר אפשרי. זמני הופעת ההחזר
                בפירוט האשראי תלויים גם בספק התשלום ובחברת האשראי. אם ספק התשלום אינו
                מאפשר ביטול אוטומטי, נטפל בהחזר ידנית דרך מערכת הספק.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                6. לא גורע מזכויות לפי דין
              </h2>
              <p>
                מדיניות זו נועדה להסביר את דרך הפעולה שלנו ואינה גורעת מזכויות שלא ניתן
                להתנות עליהן לפי חוק הגנת הצרכן, תקנות ביטול עסקה או כל דין חל אחר.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
