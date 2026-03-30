import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "מדיניות ביטולים והחזרים — פה",
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
          <p className="text-stone-500 text-sm mb-8">עדכון אחרון: מרץ 2026</p>

          <div className="space-y-6 text-stone-700 leading-relaxed">
            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                1. זכות ביטול
              </h2>
              <p>
                בהתאם לחוק הגנת הצרכן, התשמ"א–1981, וכן לתקנות הגנת הצרכן (ביטול עסקה),
                התשע"א–2010, ניתן לבטל רכישה של מנוי בפלטפורמת <strong>פה</strong> תוך{" "}
                <strong>14 ימים</strong> מיום ביצוע העסקה.
              </p>
              <p className="mt-2">
                הביטול יכול להתבצע בכל דרך שבה בוצעה ההזמנה המקורית, או באמצעות פנייה
                ישירה לשירות הלקוחות.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                2. תהליך ביטול
              </h2>
              <p>
                לביטול עסקה, יש לפנות אלינו בדוא"ל:{" "}
                <a
                  href="mailto:support@pokarov.co.il"
                  className="text-blue-600 hover:underline"
                >
                  support@pokarov.co.il
                </a>{" "}
                ולציין את פרטי הבקשה הבאים:
              </p>
              <ul className="list-disc list-inside space-y-1 text-stone-600 mt-2">
                <li>שם מלא</li>
                <li>כתובת דוא"ל בה בוצע הרישום</li>
                <li>מספר הזמנה (מופיע בדוא"ל האישור)</li>
                <li>סיבת הביטול (אופציונלי, אך מסייע לשיפור השירות)</li>
              </ul>
              <p className="mt-2">
                נשיב לפנייתכם בתוך יום עסקים אחד.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                3. החזר כספי
              </h2>
              <p>
                לאחר אישור הביטול, ההחזר הכספי יבוצע תוך{" "}
                <strong>14 ימי עסקים</strong> לכרטיס האשראי המקורי בו בוצעה הרכישה.
              </p>
              <p className="mt-2">
                ההחזר יופיע בחשבון הבנק שלכם בהתאם למחזור החיוב של חברת האשראי, ועשוי
                להופיע בפירוט הכרטיס כ-"POKAROV" או "פה קרוב".
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                4. חריגים ותנאים מיוחדים
              </h2>
              <p>
                במנויים תקופתיים (חודשי / שנתי), ימים בהם השירות כבר ניתן בפועל
                יחושבו באופן יחסי:
              </p>
              <ul className="list-disc list-inside space-y-1 text-stone-600 mt-2">
                <li>
                  ימים שחלפו מתחילת תקופת המנוי יחויבו בהתאם לחלקם היחסי מסכום העסקה
                </li>
                <li>
                  ימים שטרם חלפו יוחזרו במלואם
                </li>
                <li>
                  ביטול לאחר תום 14 ימים מיום הרכישה אינו זכאי להחזר, אלא אם קיים פגם
                  בשירות
                </li>
              </ul>
              <p className="mt-2">
                דמי ביטול כמפורט בחוק (עד 5% ממחיר העסקה, ולא יותר מ-100 ₪) עשויים
                להיגבות בביטולים מסוימים.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                5. יצירת קשר
              </h2>
              <p>
                לשאלות בנושא ביטולים והחזרים:{" "}
                <a
                  href="mailto:support@pokarov.co.il"
                  className="text-blue-600 hover:underline"
                >
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
