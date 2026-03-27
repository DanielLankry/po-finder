import Link from "next/link";

export default function SpotSuccessPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center px-6" dir="rtl">
      <div className="text-center max-w-sm">
        <div
          className="h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl"
          style={{ background: "linear-gradient(135deg, #FB923C, #EA580C)", boxShadow: "0 8px 24px rgba(249,115,22,0.35)" }}
        >
          ✦
        </div>
        <h1 className="font-extrabold text-[#111] text-2xl mb-3">הדוכן נשלח לאישור!</h1>
        <p className="text-[#666] text-base leading-relaxed mb-2">
          תודה על הרשמתך. הצוות שלנו יאשר את הדוכן תוך 24 שעות.
        </p>
        <p className="text-[#999] text-sm mb-8">
          תקבל עדכון במייל ברגע שהדוכן עולה למפה.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center h-12 px-8 rounded-full text-white font-semibold transition-all hover:shadow-lg hover:scale-105"
          style={{ background: "linear-gradient(135deg, #FB923C 0%, #EA580C 100%)" }}
        >
          חזרה למפה
        </Link>
      </div>
    </div>
  );
}
