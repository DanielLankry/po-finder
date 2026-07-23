import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Mail, MessageCircle, PenLine, MapPin, Handshake, Search, Clock3, Percent, Heart } from "lucide-react";
import Reveal from "@/components/ui/reveal";
import { Marquee } from "@/components/ui/marquee";
import { BRAND_NAME, BUSINESS_INFO, LAUNCH_OFFER, VENDOR_FAQS, getWhatsAppHref } from "@/lib/site-config";

export const metadata = {
  title: "הצטרפות עסקים",
  description:
    "הצטרפו לפה קרוב והופיעו על מפה בזמן אמת עם פרופיל עסק, תמונות, שעות פעילות, מיקום וכפתור התקשרות.",
};

const whatsappHref = getWhatsAppHref();

const MARQUEE_ITEMS = [
  "קפה נייד", "דוכני אוכל", "פרחים", "וינטג׳", "תכשיטים", "מאפים",
  "פירות וירקות", "אומנות", "יד שנייה", "פלאפל", "שווקים", "עגלות גלידה",
];

const STEPS = [
  {
    step: "1",
    title: "יוצרים טיוטה בחינם",
    desc: "פותחים חשבון, ממלאים את פרטי העסק ורואים תצוגה מקדימה פרטית בלי לשלם.",
    Icon: PenLine,
  },
  {
    step: "2",
    title: "מאמתים ובוחרים זמן",
    desc: "אחרי אימות העסק בוחרים מיום אחד ועד 12 חודשי הופעה ומשלמים פעם אחת.",
    Icon: MapPin,
  },
  {
    step: "3",
    title: "מופיעים עד סוף התקופה",
    desc: "לאחר תשלום מוצלח הלקוחות רואים אתכם במפה וברשימה. בסיום העסק יורד אוטומטית.",
    Icon: Handshake,
  },
];

const BENEFITS = [
  {
    Icon: Search,
    title: "לקוחות מוצאים אתכם לפי מיקום",
    desc: "גם מי שלא מכיר אתכם יכול לראות את העסק על המפה בזמן אמת.",
  },
  {
    Icon: Clock3,
    title: "שעות ומיקום במקום אחד",
    desc: "מעדכנים מיקום ושעות פעילות כדי שלקוחות יגיעו כשבאמת פתוח.",
  },
  {
    Icon: Percent,
    title: "ללא עמלה על מכירות",
    desc: "התשלום הוא על ההופעה בפלטפורמה בלבד, לא על כל מכירה.",
  },
  {
    Icon: Heart,
    title: "עברית ברורה ושירות ישיר",
    desc: "ממשק פשוט, טיוטה בחינם ובחירת זמן אחת בלי חבילות מבלבלות.",
  },
];

export default function VendorsPage() {
  return (
    <div dir="rtl" className="brand-canvas min-h-screen font-sans">
      <Navbar />

      {/* ── Hero — poster style ── */}
      <section className="relative overflow-hidden pt-28 pb-16 px-4">
        <div className="relative max-w-4xl mx-auto text-center">
          <Reveal>
            <span className="inline-block mb-6 bg-white text-[#1F5038] text-sm font-bold px-4 py-1.5 rounded-full border-2 border-[#17402D] shadow-[2px_2px_0_0_#17402D]">
              הצטרפות לעסקים קטנים, דוכנים ועסקים ניידים
            </span>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="font-display text-6xl md:text-7xl lg:text-8xl text-[#17402D] leading-none mb-6">
              הופיעו על <span className="marker-highlight">המפה</span> של {BRAND_NAME}
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="text-lg md:text-xl text-[#57534E] max-w-2xl mx-auto mb-8 leading-relaxed">
              לקוחות רואים אתכם בזמן אמת לפי מיקום, שעות פעילות וקטגוריה — בלי אפליקציה ובלי תהליך מסובך.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="sticker max-w-2xl mx-auto p-6 mb-10 -rotate-1">
              <p className="text-xl font-bold text-[#17402D] mb-1">{LAUNCH_OFFER.mainCtaText}</p>
              <p className="text-[#57534E]">{LAUNCH_OFFER.secondaryText}</p>
            </div>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/pricing"
                className="poster-hover w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#C4552D] hover:bg-[#A8441F] text-white font-bold text-lg px-8 py-4 rounded-2xl border-2 border-[#8A3618] shadow-[4px_4px_0_0_#8A3618]"
              >
                {LAUNCH_OFFER.primaryButtonText}
                <span className="text-xl">←</span>
              </Link>
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="poster-hover w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-[#17402D] font-bold text-lg px-8 py-4 rounded-2xl border-2 border-[#17402D] shadow-[4px_4px_0_0_#17402D]"
                >
                  <MessageCircle className="h-5 w-5 text-[#25D366]" />
                  דברו איתנו בוואטסאפ
                </a>
              ) : (
                <a
                  href={`mailto:${BUSINESS_INFO.contactEmail}`}
                  className="poster-hover w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-[#17402D] font-bold text-lg px-8 py-4 rounded-2xl border-2 border-[#17402D] shadow-[4px_4px_0_0_#17402D]"
                >
                  <Mail className="h-5 w-5" />
                  {BUSINESS_INFO.contactEmail}
                </a>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Category marquee ── */}
      <section className="py-6 border-y-2 border-[#17402D] bg-white overflow-hidden">
        <Marquee direction="right" duration={30} pauseOnHover>
          {MARQUEE_ITEMS.map((item) => (
            <span
              key={item}
              className="font-display text-2xl text-[#17402D] whitespace-nowrap px-4 flex items-center gap-4"
            >
              {item}
              <span className="text-[#C4552D] text-lg">✦</span>
            </span>
          ))}
        </Marquee>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-14">
            <h2 className="font-display text-5xl md:text-6xl text-[#17402D] mb-3">איך זה עובד?</h2>
            <p className="text-[#78716C] text-lg">שלושה צעדים פשוטים עד שהעסק מופיע על המפה</p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map(({ step, title, desc, Icon }, i) => (
              <Reveal key={step} delay={i * 0.12}>
                <div className="sticker poster-hover relative p-7 pt-10 text-center h-full">
                  <div className="absolute -top-5 right-1/2 translate-x-1/2 w-10 h-10 bg-[#C4552D] text-white font-display text-2xl rounded-full flex items-center justify-center border-2 border-[#8A3618]">
                    {step}
                  </div>
                  <div className="stamp-wiggle inline-flex w-14 h-14 bg-[#EFF5F0] border-2 border-[#17402D] rounded-xl items-center justify-center mb-4">
                    <Icon className="h-7 w-7 text-[#2D6A4F]" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-bold text-[#17402D] mb-2">{title}</h3>
                  <p className="text-[#57534E] text-sm leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why us ── */}
      <section className="py-20 px-4 bg-white border-y-2 border-[#17402D]">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-14">
            <h2 className="font-display text-5xl md:text-6xl text-[#17402D] mb-3">
              למה <span className="marker-highlight">{BRAND_NAME}</span>?
            </h2>
            <p className="text-[#78716C] text-lg">הצעה ברורה לעסק קטן שרוצה שימצאו אותו לפי מיקום</p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {BENEFITS.map(({ Icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 0.08}>
                <div className="poster-hover flex gap-4 items-start bg-[#F7F3EA] border-2 border-[#17402D] rounded-2xl p-6 h-full shadow-[3px_3px_0_0_#17402D]">
                  <div className="stamp-wiggle flex-shrink-0 w-12 h-12 bg-white border-2 border-[#17402D] rounded-xl flex items-center justify-center">
                    <Icon className="h-6 w-6 text-[#C4552D]" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#17402D] text-base mb-1">{title}</h3>
                    <p className="text-[#57534E] text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-12">
            <h2 className="font-display text-5xl md:text-6xl text-[#17402D] mb-3">שאלות נפוצות</h2>
            <p className="text-[#78716C] text-lg">כל מה שעסק קטן צריך לדעת לפני הצטרפות</p>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-5">
            {VENDOR_FAQS.map((item, i) => (
              <Reveal key={item.question} delay={(i % 2) * 0.08}>
                <div className="rounded-2xl border-2 border-[#17402D]/15 bg-white p-5 h-full hover:border-[#17402D] transition-colors">
                  <h3 className="font-bold text-[#17402D] mb-2">{item.question}</h3>
                  <p className="text-sm text-[#57534E] leading-relaxed">{item.answer}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-4 bg-[#17402D]">
        <div className="max-w-2xl mx-auto text-center">
          <Reveal>
            <h2 className="font-display text-5xl md:text-6xl text-[#F7F3EA] mb-4">מוכנים להצטרף?</h2>
            <p className="text-[#C3DCC9] text-lg mb-2">{LAUNCH_OFFER.mainCtaText}</p>
            <p className="text-[#9DC4A8] text-sm mb-10">{LAUNCH_OFFER.secondaryText}</p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/pricing"
                className="poster-hover inline-flex items-center justify-center gap-2 bg-[#C4552D] hover:bg-[#A8441F] text-white font-bold text-lg px-10 py-4 rounded-2xl border-2 border-[#F7F3EA] shadow-[4px_4px_0_0_rgba(247,243,234,0.35)]"
              >
                {LAUNCH_OFFER.primaryButtonText}
                <span className="text-xl">←</span>
              </Link>
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="poster-hover inline-flex items-center justify-center gap-2 bg-[#F7F3EA] text-[#17402D] font-bold text-lg px-10 py-4 rounded-2xl border-2 border-[#F7F3EA]"
                >
                  <MessageCircle className="h-5 w-5 text-[#25D366]" />
                  דברו איתנו בוואטסאפ
                </a>
              ) : null}
            </div>
          </Reveal>
        </div>
      </section>
      <Footer />
    </div>
  );
}
