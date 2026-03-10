import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { MapPin, Users, Heart, Shield } from "lucide-react";

export const metadata = {
  title: "אודות — פה",
  description: "אודות פלטפורמת פה — גלו עסקים קטנים קרובים אליכם",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FAFAF7] pt-[88px] pb-16" dir="rtl">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="font-display font-extrabold text-3xl text-stone-900 mb-2">
            אודות פה
          </h1>
          <p className="text-stone-500 text-sm mb-8">מי אנחנו ומה המשימה שלנו</p>

          <div className="space-y-8 text-stone-700 leading-relaxed">
            {/* Mission */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-[#059669]" aria-hidden="true" />
                </div>
                <h2 className="font-display font-bold text-xl text-stone-900">
                  המשימה שלנו
                </h2>
              </div>
              <p>
                <strong>פה</strong> נולדה מתוך אמונה פשוטה: לכל עסק קטן מגיע להיראות.
                הפלטפורמה שלנו מחברת בין צרכנים לעסקים קטנים, ניידים ומקומיים — עגלות
                קפה, דוכני פלאפל, מאפיות שכונתיות, וכל מי שמביא טעם לשכונה.
              </p>
              <p className="mt-3">
                באמצעות מפה אינטראקטיבית וחיפוש חכם, אנו עוזרים לכם למצוא את העסקים
                הקטנים הכי קרובים אליכם — בדיוק כשהם פתוחים.
              </p>
            </section>

            {/* Values */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Heart className="h-5 w-5 text-[#059669]" aria-hidden="true" />
                </div>
                <h2 className="font-display font-bold text-xl text-stone-900">
                  הערכים שלנו
                </h2>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#059669] mt-0.5">●</span>
                  <div>
                    <strong>תמיכה בעסקים קטנים</strong> — אנחנו מאמינים שעסקים קטנים הם
                    הלב של הקהילה. הפלטפורמה נבנתה כדי לתת להם במה.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#059669] mt-0.5">●</span>
                  <div>
                    <strong>שקיפות</strong> — ביקורות אמיתיות, מידע מדויק, ושעות פעילות
                    מעודכנות. מה שאתם רואים זה מה שיש.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#059669] mt-0.5">●</span>
                  <div>
                    <strong>נגישות לכולם</strong> — האתר נבנה בהתאם לתקן הישראלי 5568
                    (WCAG 2.1 AA) ומונגש לכלל המשתמשים.
                  </div>
                </li>
              </ul>
            </section>

            {/* Community */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-[#059669]" aria-hidden="true" />
                </div>
                <h2 className="font-display font-bold text-xl text-stone-900">
                  הקהילה
                </h2>
              </div>
              <p>
                פה היא יותר ממנוע חיפוש — היא קהילה. משתמשים יכולים לכתוב ביקורות,
                לדרג עסקים, ולעזור לאחרים לגלות את הטוב ביותר שהשכונה שלהם מציעה.
              </p>
            </section>

            {/* Privacy & Security */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-[#059669]" aria-hidden="true" />
                </div>
                <h2 className="font-display font-bold text-xl text-stone-900">
                  פרטיות ואבטחה
                </h2>
              </div>
              <p>
                אנחנו מחויבים לפרטיות שלכם. המידע שלכם מאוחסן בצורה מאובטחת ואין אנו
                מוכרים מידע לצדדים שלישיים. לפרטים נוספים, עיינו ב
                <a href="/privacy" className="text-[#059669] hover:underline mx-1">
                  מדיניות הפרטיות
                </a>
                שלנו.
              </p>
            </section>

            {/* Legal info */}
            <section className="bg-stone-50 rounded-2xl p-6 border border-stone-200">
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                פרטי החברה
              </h2>
              <ul className="space-y-2 text-stone-600 text-sm">
                <li>
                  <strong>שם העסק:</strong> פה — פלטפורמת גילוי עסקים קטנים
                </li>
                <li>
                  <strong>מספר עוסק:</strong>{" "}
                  <span className="text-stone-400">[יעודכן בקרוב]</span>
                </li>
                <li>
                  <strong>כתובת:</strong>{" "}
                  <span className="text-stone-400">[יעודכן בקרוב]</span>
                </li>
                <li>
                  <strong>דוא&quot;ל:</strong>{" "}
                  <a
                    href="mailto:support@po.co.il"
                    className="text-[#059669] hover:underline"
                  >
                    support@po.co.il
                  </a>
                </li>
              </ul>
            </section>

            {/* Contact CTA */}
            <section className="text-center py-4">
              <p className="text-stone-600 mb-4">
                יש לכם שאלות? רוצים לשתף פעולה?
              </p>
              <a
                href="/contact"
                className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-2"
              >
                צרו קשר
              </a>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
