import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Mail, MessageCircle } from "lucide-react";
import { BRAND_NAME, BUSINESS_INFO, LAUNCH_OFFER, VENDOR_FAQS, getWhatsAppHref } from "@/lib/site-config";

export const metadata = {
  title: "הצטרפות עסקים",
  description:
    "הצטרפו לפה קרוב והופיעו על מפה בזמן אמת עם פרופיל עסק, תמונות, שעות פעילות, מיקום וכפתור התקשרות.",
};

const whatsappHref = getWhatsAppHref();

export default function VendorsPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#FAFAF7] font-sans">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-[#ECFDF5] via-[#F0FDF4] to-[#FAFAF7] pt-24 pb-20 px-4">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-[#059669]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-56 h-56 bg-[#059669]/8 rounded-full blur-2xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <span className="inline-block mb-4 bg-[#059669]/10 text-[#047857] text-sm font-semibold px-4 py-1.5 rounded-full border border-[#059669]/20">
            הצטרפות לעסקים קטנים, דוכנים ועסקים ניידים
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#1A1A1A] leading-tight mb-6">
            הופיעו על המפה של {BRAND_NAME}
          </h1>

          <p className="text-lg md:text-xl text-[#555] max-w-2xl mx-auto mb-6 leading-relaxed">
            לקוחות רואים אתכם בזמן אמת לפי מיקום, שעות פעילות וקטגוריה, בלי אפליקציה ובלי תהליך מסובך.
          </p>

          <div className="max-w-2xl mx-auto rounded-3xl border border-[#A7F3D0] bg-white/80 backdrop-blur p-6 mb-8">
            <p className="text-xl font-bold text-[#111] mb-2">{LAUNCH_OFFER.mainCtaText}</p>
            <p className="text-[#666]">{LAUNCH_OFFER.secondaryText}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#059669] hover:bg-[#047857] active:scale-95 text-white font-bold text-base px-8 py-4 rounded-2xl shadow-lg shadow-[#059669]/25 transition-all duration-200"
            >
              {LAUNCH_OFFER.primaryButtonText}
              <span className="text-lg">←</span>
            </Link>
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1EB856] active:scale-95 text-white font-semibold text-base px-8 py-4 rounded-2xl transition-all duration-200"
              >
                <MessageCircle className="h-4 w-4" />
                דברו איתנו בוואטסאפ
              </a>
            ) : (
              <a
                href={`mailto:${BUSINESS_INFO.contactEmail}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-[#ECFDF5] active:scale-95 text-[#059669] font-semibold text-base px-8 py-4 rounded-2xl border border-[#059669]/30 transition-all duration-200"
              >
                <Mail className="h-4 w-4" />
                {BUSINESS_INFO.contactEmail}
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-3">איך זה עובד?</h2>
            <p className="text-[#777] text-lg">שלושה צעדים פשוטים עד שהעסק מופיע על המפה</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "מצטרפים במחיר השקה",
                desc: "פותחים חשבון ובוחרים מסלול השקה של חודש, חודשיים או 3 חודשים.",
                icon: "✍️",
              },
              {
                step: "2",
                title: "מקימים פרופיל עסק",
                desc: "מוסיפים תמונות, קטגוריה, מיקום, שעות פעילות ופרטי קשר. בתקופת ההשקה הקמת פרופיל ראשוני בחינם.",
                icon: "📍",
              },
              {
                step: "3",
                title: "מופיעים ומקבלים פניות",
                desc: "הלקוחות רואים אתכם בזמן אמת, מתקשרים או מגיעים ישירות אליכם.",
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

      <section className="py-20 px-4 bg-[#FAFAF7]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-3">למה {BRAND_NAME}?</h2>
            <p className="text-[#777] text-lg">הצעה ברורה לעסק קטן שרוצה שימצאו אותו לפי מיקום</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                icon: "🔍",
                title: "לקוחות מוצאים אתכם לפי מיקום",
                desc: "גם מי שלא מכיר אתכם יכול לראות את העסק על המפה בזמן אמת.",
              },
              {
                icon: "🕐",
                title: "שעות ומיקום במקום אחד",
                desc: "מעדכנים מיקום ושעות פעילות כדי שלקוחות יגיעו כשבאמת פתוח.",
              },
              {
                icon: "💰",
                title: "ללא עמלה על מכירות",
                desc: "התשלום הוא על ההופעה בפלטפורמה בלבד, לא על כל מכירה.",
              },
              {
                icon: "🇮🇱",
                title: "עברית ברורה ושירות ישיר",
                desc: "ממשק פשוט, מסר ברור והקמה ראשונית כלולה לעסקים הראשונים.",
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

      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-3">שאלות נפוצות</h2>
            <p className="text-[#777] text-lg">כל מה שעסק קטן צריך לדעת לפני הצטרפות</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {VENDOR_FAQS.map((item) => (
              <div key={item.question} className="rounded-2xl border border-stone-200 bg-[#FAFAF7] p-5">
                <h3 className="font-bold text-[#111] mb-2">{item.question}</h3>
                <p className="text-sm text-[#666] leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-gradient-to-br from-[#059669] to-[#047857]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">מוכנים להצטרף?</h2>
          <p className="text-[#D1FAE5] text-lg mb-3">{LAUNCH_OFFER.mainCtaText}</p>
          <p className="text-[#ECFDF5] text-sm mb-10">{LAUNCH_OFFER.secondaryText}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-[#ECFDF5] active:scale-95 text-[#059669] font-extrabold text-lg px-10 py-4 rounded-2xl shadow-xl transition-all duration-200"
            >
              {LAUNCH_OFFER.primaryButtonText}
              <span className="text-xl">←</span>
            </Link>
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1EB856] active:scale-95 text-white font-extrabold text-lg px-10 py-4 rounded-2xl shadow-xl transition-all duration-200"
              >
                <MessageCircle className="h-5 w-5" />
                דברו איתנו בוואטסאפ
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
