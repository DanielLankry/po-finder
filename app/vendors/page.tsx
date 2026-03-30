import Link from "next/link";
import Navbar from "@/components/layout/Navbar";

export const metadata = {
  title: "לרוכלים | פוקרוב",
  description: "הכניסו את הדוכן שלכם למפה — לקוחות יגלו אתכם בזמן אמת, בלי אפליקציה, בלי חשבון.",
};

export default function VendorsPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#FAFAF7] font-sans">
      <Navbar />

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#ECFDF5] via-[#F0FDF4] to-[#FAFAF7] pt-24 pb-20 px-4">
        {/* decorative blobs */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-[#059669]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-56 h-56 bg-[#059669]/8 rounded-full blur-2xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-block mb-4 bg-[#059669]/10 text-[#047857] text-sm font-semibold px-4 py-1.5 rounded-full border border-[#059669]/20">
            🛒 לרוכלים ובעלי דוכנים
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#1A1A1A] leading-tight mb-6">
            הכניסו את הדוכן שלכם למפה
          </h1>

          <p className="text-lg md:text-xl text-[#555] max-w-xl mx-auto mb-10 leading-relaxed">
            לקוחות יגלו אתכם בזמן אמת —<br className="hidden sm:block" />
            בלי אפליקציה, בלי חשבון, בלי סיבוך
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#059669] hover:bg-[#047857] active:scale-95 text-white font-bold text-base px-8 py-4 rounded-2xl shadow-lg shadow-[#059669]/25 transition-all duration-200"
            >
              הוסיפו את העסק שלכם בחינם
              <span className="text-lg">←</span>
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-[#ECFDF5] active:scale-95 text-[#059669] font-semibold text-base px-8 py-4 rounded-2xl border border-[#059669]/30 transition-all duration-200"
            >
              ראו את המפה החיה
              <span className="text-lg">🗺️</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-3">איך זה עובד?</h2>
            <p className="text-[#777] text-lg">שלושה צעדים פשוטים — ואתם על המפה</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "נרשמים תוך דקה",
                desc: "ממלאים פרטי דוכן + לוח זמנים — לוקח פחות מ-60 שניות",
                icon: "✍️",
              },
              {
                step: "2",
                title: "מופיעים על המפה",
                desc: "לקוחות רואים אתכם בזמן אמת ויודעים בדיוק איפה אתם",
                icon: "📍",
              },
              {
                step: "3",
                title: "מקבלים לקוחות",
                desc: "הם מתקשרים / מגיעים ישירות — ללא מתווכים",
                icon: "🤝",
              },
            ].map(({ step, title, desc, icon }) => (
              <div
                key={step}
                className="relative bg-[#FAFAF7] border border-stone-200 rounded-3xl p-7 text-center hover:border-[#059669]/40 hover:shadow-md transition-all duration-200"
              >
                <div className="absolute -top-4 right-1/2 translate-x-1/2 w-8 h-8 bg-[#059669] text-white font-extrabold text-sm rounded-full flex items-center justify-center shadow-md shadow-[#059669]/30">
                  {step}
                </div>
                <div className="text-4xl mb-4 mt-2">{icon}</div>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">{title}</h3>
                <p className="text-[#666] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BENEFITS ─── */}
      <section className="py-20 px-4 bg-[#FAFAF7]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-3">למה פוקרוב?</h2>
            <p className="text-[#777] text-lg">הפלטפורמה שנבנתה בשביל רוכלים ישראלים</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                icon: "🔍",
                title: "לקוחות מוצאים אתכם",
                desc: "גם מי שלא מכיר אתכם — מחפש על המפה ונתקל בדוכן שלכם",
              },
              {
                icon: "🕐",
                title: "לוח זמנים גמיש",
                desc: "משנים מיקום? מעדכנים בשנייה — הלקוחות תמיד יודעים איפה אתם",
              },
              {
                icon: "💰",
                title: "ללא עמלה על מכירות",
                desc: "שלמו רק על הנוכחות — כל שקל ממכירה נשאר אצלכם",
              },
              {
                icon: "🇮🇱",
                title: "תמיכה בעברית",
                desc: "אנחנו כאן — ממשק עברי מלא ותמיכה ישראלית",
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="flex gap-4 items-start bg-white border border-stone-200 rounded-2xl p-6 hover:border-[#059669]/40 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-[#ECFDF5] rounded-2xl flex items-center justify-center text-2xl">
                  {icon}
                </div>
                <div>
                  <h3 className="font-bold text-[#1A1A1A] text-base mb-1">{title}</h3>
                  <p className="text-[#666] text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING TEASER ─── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-xl mx-auto text-center">
          <div className="inline-block bg-[#ECFDF5] border border-[#A7F3D0] rounded-3xl px-8 py-8">
            <p className="text-[#047857] font-semibold text-sm mb-2 uppercase tracking-wide">תמחור</p>
            <p className="text-4xl font-extrabold text-[#1A1A1A] mb-2">
              החל מ-<span className="text-[#059669]">₪20</span>{" "}
              <span className="text-2xl font-bold">ליום</span>
            </p>
            <p className="text-[#666] text-sm mb-5">ללא עמלות. ללא הפתעות. ביטול בכל עת.</p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 text-[#059669] font-semibold text-sm hover:underline"
            >
              לכל פרטי התוכניות ←
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER CTA ─── */}
      <section className="py-24 px-4 bg-gradient-to-br from-[#059669] to-[#047857]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            מוכנים להתחיל?
          </h2>
          <p className="text-[#A7F3D0] text-lg mb-10">
            הוסיפו את הדוכן שלכם עכשיו — ולקוחות יתחילו למצוא אתכם היום
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 bg-white hover:bg-[#ECFDF5] active:scale-95 text-[#059669] font-extrabold text-lg px-10 py-4 rounded-2xl shadow-xl transition-all duration-200"
          >
            הוסיפו את העסק שלכם בחינם
            <span className="text-xl">←</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
