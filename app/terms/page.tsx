import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LegalIdentity from "@/components/legal/LegalIdentity";
import { BRAND_NAME, BUSINESS_INFO } from "@/lib/site-config";

export const metadata = {
  title: "תנאי שימוש",
  description: "תנאי השימוש בפלטפורמת פה קרוב לבעלי עסקים ולמבקרים באתר.",
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F7F3EA] pt-[88px] pb-16" dir="rtl">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="font-display font-extrabold text-3xl text-stone-900 mb-2">
            תנאי שימוש
          </h1>
          <p className="text-stone-500 text-sm mb-8">עדכון אחרון: מאי 2026</p>

          <div className="space-y-8 text-stone-700 leading-relaxed">
            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                1. מפעיל השירות ויצירת קשר
              </h2>
              <p className="mb-3">
                השימוש בפלטפורמת <strong>{BRAND_NAME}</strong> כפוף לתנאים אלה. אם אינכם
                מסכימים לתנאים, אין להשתמש בשירות. בכל שאלה אפשר לפנות אל{" "}
                <a href={`mailto:${BUSINESS_INFO.contactEmail}`} className="text-[#2D6A4F] hover:underline">
                  {BUSINESS_INFO.contactEmail}
                </a>.
              </p>
              <LegalIdentity />
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                2. מה השירות מספק
              </h2>
              <p>
                {BRAND_NAME} מאפשרת למבקרים למצוא עסקים קטנים, דוכנים ועסקים ניידים לפי
                מיקום, קטגוריה, שעות פעילות ופרטי קשר. לבעלי עסקים השירות מאפשר ליצור
                פרופיל עסק, להציג מידע ציבורי, להעלות תמונות, לעדכן שעות ומיקומים ולקבל
                סטטיסטיקות בסיסיות.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                3. חשבונות משתמשים
              </h2>
              <ul className="list-disc list-inside space-y-2 text-stone-600">
                <li>יש למסור מידע נכון ומעודכן בעת הרשמה ושימוש בשירות.</li>
                <li>המשתמש אחראי לשמירת סודיות אמצעי ההתחברות לחשבון.</li>
                <li>אין להעביר חשבון לאחר ללא אישור מראש.</li>
                <li>אנו רשאים לחסום או להגביל חשבון במקרה של שימוש לרעה, הפרת דין או פגיעה בשירות.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                4. אחריות בעלי עסקים ותוכן ציבורי
              </h2>
              <p className="mb-2">
                בעלי עסקים אחראים לכל מידע שהם מפרסמים, לרבות שם העסק, תיאור, כתובת,
                מיקום, שעות פעילות, טלפון, קישורים, תמונות, סטטוס כשרות ומספר עוסק.
              </p>
              <ul className="list-disc list-inside space-y-2 text-stone-600">
                <li>אין לפרסם מידע מטעה, מפר זכויות, פוגעני, לא חוקי או שאינו שייך לכם.</li>
                <li>יש לעדכן מיקומים ושעות כך שלא יטעו לקוחות.</li>
                <li>אם נטענת טענת כשרות, רישיון, היתר או אישור אחר, בעל העסק אחראי לנכונותה.</li>
                <li>אנו רשאים להסיר תוכן או להסתיר עסק שלא עומד בתנאים או בדרישות הדין.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                5. ביקורות ודירוגים
              </h2>
              <p>ביקורות חייבות לשקף חוויה אמיתית ומותר לפרסם אותן רק בתום לב. אסור לפרסם:</p>
              <ul className="list-disc list-inside space-y-2 text-stone-600 mt-2">
                <li>ביקורות כוזבות, ממומנות ללא גילוי או ביקורות מטעם מתחרים ללא גילוי.</li>
                <li>פרטים אישיים של אדם אחר ללא הסכמתו.</li>
                <li>לשון הרע, איומים, הסתה, גזענות, הטרדה, ספאם או תוכן בלתי חוקי.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                6. תשלום, תקופת הצגה וחידוש
              </h2>
              <p className="mb-2">
                מסלולי התשלום מוצגים בעמוד <Link href="/pricing" className="text-[#2D6A4F] hover:underline">המחירים</Link>.
                התשלום מתבצע דרך דף תשלום מאובטח של ספק תשלום חיצוני. אלא אם נאמר אחרת
                במפורש, המסלול הוא לתקופה שנבחרה מראש ואינו חידוש אוטומטי.
              </p>
              <p>
                לאחר תום תקופת ההצגה, ייתכן שהעסק לא יופיע לציבור עד לחידוש. קבלה או
                חשבונית יישלחו בדוא&quot;ל בהתאם לפרטים שסופקו.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                7. ביטול, החזר וזכויות צרכניות
              </h2>
              <p>
                מדיניות הביטולים וההחזרים מופיעה בעמוד{" "}
                <Link href="/refund" className="text-[#2D6A4F] hover:underline">
                  מדיניות ביטולים והחזרים
                </Link>. אין בתנאים אלה כדי לגרוע מזכויות שלא ניתן להתנות עליהן לפי דין.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                8. פרטיות, עוגיות ודיוור
              </h2>
              <p>
                השימוש במידע מוסדר ב<Link href="/privacy" className="text-[#2D6A4F] hover:underline">מדיניות הפרטיות</Link>.
                עוגיות אנליטיקה מופעלות רק לאחר הסכמה. הודעות שירות, כגון אישור תשלום,
                איפוס סיסמה ומענה לתמיכה, אינן דיוור שיווקי. דיוור שיווקי, אם יופעל בעתיד,
                יישלח רק בהתאם להסכמה נפרדת ולכללי הסרה.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                9. קניין רוחני
              </h2>
              <p>
                כל זכויות הקניין הרוחני באתר, בממשק, במותג, בעיצוב ובקוד שייכות למפעיל
                השירות או לבעלי הזכויות הרלוונטיים. בהעלאת תוכן לאתר, המשתמש מעניק לנו
                רישיון לא בלעדי להשתמש בתוכן לצורך הפעלת השירות, הצגתו וקידומו במסגרת
                הפלטפורמה.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                10. הגבלת אחריות
              </h2>
              <p>
                השירות ניתן כפי שהוא ובהתאם לזמינותו. אנו עושים מאמץ לשמור על תקינות
                המידע, אך איננו מתחייבים שכל פרטי העסקים, הזמינות, המיקום, שעות הפעילות
                או הביקורות יהיו מדויקים בכל רגע. אין בכך כדי לגרוע מאחריות שלא ניתן
                להגביל לפי דין.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                11. דין וסמכות שיפוט
              </h2>
              <p>
                על תנאים אלה יחולו דיני מדינת ישראל. סמכות השיפוט המקומית תיקבע בהתאם
                לדין החל, ובכל מקרה לא תיגרע זכות צרכנית שלא ניתן להתנות עליה.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                12. שינויים בתנאים
              </h2>
              <p>
                אנו רשאים לעדכן תנאים אלה. שינוי מהותי יפורסם באתר, ובמקרים מתאימים
                תישלח הודעה למשתמשים רשומים לפני כניסת השינוי לתוקף.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
