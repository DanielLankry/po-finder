import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Mail, MessageCircle, ArrowLeft, MapPin, CreditCard, Users, CircleHelp } from "lucide-react";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { BRAND_NAME, BUSINESS_INFO, LAUNCH_OFFER, getWhatsAppHref } from "@/lib/site-config";

export const metadata = {
  title: "אודות",
  description: "מי אנחנו, למי פה קרוב מתאימה, איך השירות עובד ואיך יוצרים קשר.",
};

const whatsappHref = getWhatsAppHref();

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FAFAF7] pt-[88px] pb-16" dir="rtl">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-4">
            <AnimatedShinyText className="inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-1.5 rounded-full border border-[#D1FAE5] bg-[#ECFDF5] text-[#047857]" shimmerWidth={120}>
              פלטפורמה לעסקים קטנים ועסקים ניידים
            </AnimatedShinyText>
          </div>

          <h1 className="font-display font-extrabold text-3xl text-stone-900 mb-2">
            אודות {BRAND_NAME}
          </h1>
          <p className="text-stone-500 text-sm mb-8">
            מידע ברור על השירות, התשלום ודרכי יצירת הקשר לפני שמצטרפים.
          </p>

          <div className="space-y-8 text-stone-700 leading-relaxed">
            <section className="bg-white rounded-3xl border border-stone-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-[#059669]" aria-hidden="true" />
                </div>
                <h2 className="font-display font-bold text-xl text-stone-900">מי אנחנו</h2>
              </div>
              <p>
                {BRAND_NAME} עוזרת לאנשים למצוא עסקים קטנים, דוכנים, עגלות קפה ועסקים ניידים
                לפי מיקום, קטגוריה ושעות פעילות. המטרה שלנו היא להפוך את הגילוי של עסקים
                מקומיים לפשוט, ברור ונגיש בלי לבקש מהלקוחות להוריד אפליקציה.
              </p>
            </section>

            <section className="bg-white rounded-3xl border border-stone-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-[#059669]" aria-hidden="true" />
                </div>
                <h2 className="font-display font-bold text-xl text-stone-900">למי הפלטפורמה מתאימה</h2>
              </div>
              <p>
                השירות מתאים לדוכנים, עגלות קפה, ירידים, שווקים, עסקים ניידים ועסקים מקומיים
                קטנים שרוצים שלקוחות ימצאו אותם לפי מיקום בזמן אמת.
              </p>
            </section>

            <section className="bg-white rounded-3xl border border-stone-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <ArrowLeft className="h-5 w-5 text-[#059669]" aria-hidden="true" />
                </div>
                <h2 className="font-display font-bold text-xl text-stone-900">איך השירות עובד</h2>
              </div>
              <div className="space-y-3">
                <p>1. פותחים חשבון עסקי ומצטרפים דרך עמוד ההצטרפות.</p>
                <p>2. מקימים פרופיל עסק עם תמונות, קטגוריה, מיקום ושעות פעילות.</p>
                <p>3. הלקוחות רואים את העסק על המפה, נכנסים לפרופיל ויכולים ליצור קשר ישירות.</p>
              </div>
            </section>

            <section className="bg-white rounded-3xl border border-stone-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="h-5 w-5 text-[#059669]" aria-hidden="true" />
                </div>
                <h2 className="font-display font-bold text-xl text-stone-900">איך התשלום עובד</h2>
              </div>
              <p>{LAUNCH_OFFER.pricingSummary}</p>
              <p className="mt-3">{LAUNCH_OFFER.secondaryText}</p>
            </section>

            <section className="bg-white rounded-3xl border border-stone-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CircleHelp className="h-5 w-5 text-[#059669]" aria-hidden="true" />
                </div>
                <h2 className="font-display font-bold text-xl text-stone-900">איך מבטלים</h2>
              </div>
              <p>
                אפשר לבטל בהתאם למדיניות הביטולים וההחזרים המפורסמת באתר. בתקופת ההשקה אין
                התחייבות, ואפשר לפנות אלינו במייל לפני חיוב נוסף או שאלה על החשבון.
              </p>
              <Link href="/refund" className="inline-flex mt-3 text-[#059669] font-medium hover:underline">
                למדיניות הביטולים וההחזרים
              </Link>
            </section>

            <section className="bg-stone-50 rounded-3xl p-6 border border-stone-200">
              <h2 className="font-display font-bold text-xl text-stone-900 mb-3">יצירת קשר</h2>
              <p className="text-stone-700">
                {whatsappHref
                  ? "לפרטים, הצטרפות או שאלות לגבי השירות ניתן לפנות אלינו בוואטסאפ או במייל."
                  : "לפרטים, הצטרפות או שאלות לגבי השירות ניתן לפנות אלינו במייל."}
              </p>
              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                {whatsappHref ? (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-[#25D366] text-white font-semibold hover:bg-[#1EB856] transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    דברו איתנו בוואטסאפ
                  </a>
                ) : null}
                <a
                  href={`mailto:${BUSINESS_INFO.contactEmail}`}
                  className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full border border-stone-200 bg-white text-stone-700 font-semibold hover:bg-stone-50 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  {BUSINESS_INFO.contactEmail}
                </a>
              </div>
              {BUSINESS_INFO.legalBusinessName || BUSINESS_INFO.businessId || BUSINESS_INFO.address || BUSINESS_INFO.founderName ? (
                <ul className="mt-5 space-y-2 text-sm text-stone-600">
                  {BUSINESS_INFO.legalBusinessName ? <li><strong>שם משפטי:</strong> {BUSINESS_INFO.legalBusinessName}</li> : null}
                  {BUSINESS_INFO.businessId ? <li><strong>מספר עסק:</strong> {BUSINESS_INFO.businessId}</li> : null}
                  {BUSINESS_INFO.address ? <li><strong>כתובת:</strong> {BUSINESS_INFO.address}</li> : null}
                  {BUSINESS_INFO.founderName ? <li><strong>מי עומד מאחורי האתר:</strong> {BUSINESS_INFO.founderName}</li> : null}
                </ul>
              ) : null}
            </section>

            <section className="text-center py-4">
              <p className="text-stone-600 mb-6">רוצים לבדוק אם השירות מתאים לעסק שלכם?</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Link href="/pricing">
                  <ShimmerButton
                    shimmerColor="#a7f3d0"
                    background="rgba(5,150,105,1)"
                    className="h-11 px-6 text-sm font-semibold"
                  >
                    <span className="flex items-center gap-2">
                      {LAUNCH_OFFER.primaryButtonText}
                      <ArrowLeft className="h-4 w-4" />
                    </span>
                  </ShimmerButton>
                </Link>
                <Link href="/" className="inline-flex items-center gap-2 h-11 px-6 rounded-full border border-stone-200 bg-white text-stone-700 text-sm font-medium hover:bg-stone-50 transition-colors">
                  חזרה למפה
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
