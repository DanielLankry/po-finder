"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, MessageCircle, Mail, Zap, Sparkles } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { createClient } from "@/lib/supabase/client";
import { LAUNCH_OFFER, VENDOR_FAQS, BUSINESS_INFO, getWhatsAppHref } from "@/lib/site-config";
import { PLANS } from "@/lib/plans";
import type { Plan } from "@/lib/plans";

const LISTING_BENEFITS = [
  "פרופיל עסק מלא עם תמונות",
  "הופעה על המפה בזמן אמת",
  "מיקום ושעות פעילות",
  "כפתור התקשרות ישיר",
  "ביקורות וסטטיסטיקות בסיסיות",
  "הקמת פרופיל ראשוני בחינם",
];

const BOOST_BENEFITS = [
  "מופיעים ראשונים בחיפוש ובמפה",
  "תג ״מקודם״ בולט על העסק",
  "חשיפה מוגברת בעמוד הבית",
];

const whatsappHref = getWhatsAppHref();

export default function PricingClient({ plans }: { plans: Plan[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"listing" | "boost" | null>(null);
  const [showCancelBanner, setShowCancelBanner] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("payment") === "cancelled";
  });
  const [showPaywallBanner, setShowPaywallBanner] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("reason") === "no_subscription";
  });

  const listing = plans.find((p) => p.kind === "listing") ?? PLANS[0];
  const boost = plans.find((p) => p.kind === "boost") ?? PLANS[1];

  async function handleListingCheckout() {
    setLoading("listing");
    try {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push("/auth/register?redirectTo=/pricing");
        return;
      }

      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "listing" }),
      });

      if (res.status === 401) {
        router.push("/auth/register?redirectTo=/pricing");
        return;
      }

      const raw = await res.text();
      let data: { ok?: boolean; url?: string; detail?: string; error?: string } = {};
      try {
        data = JSON.parse(raw);
      } catch {
        data = {};
      }

      if (!res.ok || data.ok === false || !data.url) {
        const detail = data.detail
          ? `\n\n(${data.detail})`
          : raw && !data.url
            ? `\n\n(HTTP ${res.status}: ${raw.slice(0, 200)})`
            : "";
        alert(`שגיאה בהפניה לתשלום. נסו שוב או צרו איתנו קשר.${detail}`);
        setLoading(null);
        return;
      }

      window.location.href = data.url;
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      alert(`שגיאה בהפניה לתשלום. נסו שוב או צרו איתנו קשר.\n\n(${msg})`);
      setLoading(null);
    }
  }

  // Boost applies to an existing business — buying happens from the
  // dashboard billing page, where the user picks which business to boost.
  function handleBoostCta() {
    setLoading("boost");
    router.push("/dashboard/billing");
  }

  const listingPrice = Math.round(listing.price / 100);
  const boostPrice = Math.round(boost.price / 100);

  return (
    <div className="min-h-screen bg-[#F7F3EA]" dir="rtl">
      <Navbar />
      {showPaywallBanner ? (
        <div className="mt-[72px] bg-emerald-50 border-b border-emerald-200">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-emerald-900">לוח הבקרה זמין לעסקים פעילים</p>
              <p className="text-xs text-emerald-700 mt-0.5">השלימו רישום שנתי כדי להתחיל להופיע על המפה.</p>
            </div>
            <button
              onClick={() => setShowPaywallBanner(false)}
              aria-label="סגירת ההודעה"
              className="flex-shrink-0 h-7 w-7 rounded-full text-emerald-700 hover:bg-emerald-100 flex items-center justify-center text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}
      {showCancelBanner ? (
        <div className={`${showPaywallBanner ? "" : "mt-[72px]"} bg-amber-50 border-b border-amber-200`}>
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-amber-900">התשלום בוטל</p>
              <p className="text-xs text-amber-700 mt-0.5">לא חויבת. ניתן לנסות שוב בכל רגע.</p>
            </div>
            <button
              onClick={() => setShowCancelBanner(false)}
              aria-label="סגירת ההודעה"
              className="flex-shrink-0 h-7 w-7 rounded-full text-amber-700 hover:bg-amber-100 flex items-center justify-center text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <section className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#EFF5F0] text-[#17402D] px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
              <Zap className="h-4 w-4" />
              הצטרפות עסקים
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#111] mb-4">
              מחיר אחד פשוט. בולטות למי שרוצה.
            </h1>
            <p className="text-[#555] text-lg max-w-3xl mx-auto leading-relaxed">
              {LAUNCH_OFFER.pricingSummary}
            </p>
          </section>

          <section className="grid md:grid-cols-2 gap-6 mb-10">
            {/* Listing card — primary */}
            <div className="bg-white rounded-3xl border-2 border-[#2D6A4F] p-6 md:p-8 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#EFF5F0] text-[#17402D] text-sm font-semibold">
                  {listing.label}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                  {LAUNCH_OFFER.noCommitmentText}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-4xl font-extrabold text-[#111]">
                  ₪{listingPrice}
                  <span className="text-base font-semibold text-[#666]"> לשנה</span>
                </p>
                <p className="text-[#666] text-sm mt-1">תשלום אחד. העסק שלכם על המפה לשנה שלמה.</p>
              </div>

              <div className="space-y-3 mb-6 flex-1">
                {LISTING_BENEFITS.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-[#EFF5F0] flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-[#2D6A4F]" />
                    </div>
                    <span className="text-[#444] text-sm">{benefit}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleListingCheckout}
                disabled={loading !== null}
                className="w-full h-14 rounded-2xl text-white font-bold text-lg disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #2D6A4F 0%, #1F5038 100%)",
                  boxShadow: "0 4px 20px rgba(45,106,79,0.35)",
                }}
              >
                {loading === "listing" ? "מעבירים..." : `${LAUNCH_OFFER.primaryButtonText} • ₪${listingPrice}`}
              </button>
              <p className="text-center text-[#888] text-xs mt-3 leading-relaxed">
                בהמשך לתשלום אתם מאשרים שקראתם את{" "}
                <Link href="/terms" className="text-[#2D6A4F] hover:underline">תנאי השימוש</Link>,{" "}
                <Link href="/refund" className="text-[#2D6A4F] hover:underline">מדיניות הביטולים וההחזרים</Link>{" "}
                ואת <Link href="/privacy" className="text-[#2D6A4F] hover:underline">מדיניות הפרטיות</Link>.
              </p>
            </div>

            {/* Boost card — add-on */}
            <div className="bg-white rounded-3xl border border-amber-300 p-6 md:p-8 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold">
                  <Sparkles className="h-4 w-4" />
                  {boost.label}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                  תוספת רשות
                </span>
              </div>

              <div className="mb-4">
                <p className="text-4xl font-extrabold text-[#111]">
                  ₪{boostPrice}
                  <span className="text-base font-semibold text-[#666]"> לחודש</span>
                </p>
                <p className="text-[#666] text-sm mt-1">
                  נרכש חודש-חודש, בלי מנוי ובלי התחייבות. רוצים עוד חודש? קונים שוב.
                </p>
              </div>

              <div className="space-y-3 mb-6 flex-1">
                {BOOST_BENEFITS.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-3 w-3 text-amber-600" />
                    </div>
                    <span className="text-[#444] text-sm">{benefit}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleBoostCta}
                disabled={loading !== null}
                className="w-full h-14 rounded-2xl font-bold text-lg border-2 border-amber-400 text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors disabled:opacity-60"
              >
                {loading === "boost" ? "מעבירים..." : "לקידום העסק — ללוח הבקרה"}
              </button>
              <p className="text-center text-[#888] text-xs mt-3">
                הקידום נרכש מלוח הבקרה, לעסק קיים לאחר הרישום.
              </p>
            </div>
          </section>

          <section className="bg-white rounded-3xl border border-[#E5E7EB] p-6 md:p-8 shadow-sm mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <p className="text-sm text-stone-700">
                רוצים לדבר איתנו לפני ההצטרפות? אפשר לפנות אלינו ישירות.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                {whatsappHref ? (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-[#25D366] text-white font-semibold hover:bg-[#1EB856] transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    דברו איתנו בוואטסאפ
                  </a>
                ) : null}
                <a
                  href={`mailto:${BUSINESS_INFO.contactEmail}`}
                  className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full border border-stone-200 bg-white text-stone-700 font-semibold hover:bg-stone-50 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  {BUSINESS_INFO.contactEmail}
                </a>
                <Link
                  href="/vendors"
                  className="inline-flex items-center justify-center h-11 px-5 rounded-full text-[#2D6A4F] font-semibold hover:underline"
                >
                  לעמוד ההצטרפות המלא
                </Link>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl border border-[#E5E7EB] p-6 md:p-8 shadow-sm">
            <h2 className="text-2xl font-extrabold text-[#111] mb-6">שאלות נפוצות</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {VENDOR_FAQS.map((item) => (
                <div key={item.question} className="rounded-2xl border border-stone-200 bg-[#F7F3EA] p-5">
                  <h3 className="font-bold text-[#111] mb-2">{item.question}</h3>
                  <p className="text-sm text-[#666] leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
