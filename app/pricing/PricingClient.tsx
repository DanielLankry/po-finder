"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, MessageCircle, Mail, Zap } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { createClient } from "@/lib/supabase/client";
import { LAUNCH_OFFER, VENDOR_FAQS, BUSINESS_INFO, getWhatsAppHref } from "@/lib/site-config";
import { getPlanByIndex } from "@/lib/plans";
import type { Plan } from "@/lib/plans";

const BENEFITS = [
  "פרופיל עסק מלא עם תמונות",
  "הופעה על המפה בזמן אמת",
  "מיקום ושעות פעילות",
  "כפתור התקשרות ישיר",
  "ביקורות וסטטיסטיקות בסיסיות",
  "הקמת פרופיל ראשוני בחינם",
];

const whatsappHref = getWhatsAppHref();

export default function PricingClient({ plans }: { plans: Plan[] }) {
  const router = useRouter();
  const [planIndex, setPlanIndex] = useState(Math.min(2, plans.length - 1));
  const [loading, setLoading] = useState(false);
  const [showCancelBanner, setShowCancelBanner] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("payment") === "cancelled";
  });
  const [showPaywallBanner, setShowPaywallBanner] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("reason") === "no_subscription";
  });

  const plan = getPlanByIndex(plans, planIndex);

  async function handleCheckout() {
    setLoading(true);
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
        body: JSON.stringify({ planDays: plan.days }),
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
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      alert(`שגיאה בהפניה לתשלום. נסו שוב או צרו איתנו קשר.\n\n(${msg})`);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7]" dir="rtl">
      <Navbar />
      {showPaywallBanner ? (
        <div className="mt-[72px] bg-emerald-50 border-b border-emerald-200">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-emerald-900">לוח הבקרה זמין לעסקים פעילים</p>
              <p className="text-xs text-emerald-700 mt-0.5">בחרו מסלול השקה כדי להתחיל להופיע על המפה.</p>
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
              <p className="text-xs text-amber-700 mt-0.5">לא חויבת. ניתן לבחור מסלול מחדש ולנסות שוב.</p>
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
            <div className="inline-flex items-center gap-2 bg-[#ECFDF5] text-[#065F46] px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
              <Zap className="h-4 w-4" />
              הצטרפות עסקים
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#111] mb-4">
              הצטרפות לעסקים במחיר השקה
            </h1>
            <p className="text-[#555] text-lg max-w-3xl mx-auto leading-relaxed">
              {LAUNCH_OFFER.pricingSummary}
            </p>
          </section>

          <section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 mb-10">
            <div className="bg-white rounded-3xl border border-[#E5E7EB] p-8 shadow-sm">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-sm font-semibold">
                  מחיר רגיל: {LAUNCH_OFFER.regularPriceText}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#ECFDF5] text-[#065F46] text-sm font-semibold">
                  מחיר השקה: {LAUNCH_OFFER.launchPriceText}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-semibold">
                  {LAUNCH_OFFER.noCommitmentText}
                </span>
              </div>

              <p className="text-[#111] font-semibold text-lg mb-2">{LAUNCH_OFFER.mainCtaText}</p>
              <p className="text-[#666] text-sm mb-6">{LAUNCH_OFFER.secondaryText}</p>

              <div className="grid sm:grid-cols-3 gap-3 mb-6">
                {plans.map((item, index) => (
                  <button
                    key={item.days}
                    type="button"
                    onClick={() => setPlanIndex(index)}
                    className={`rounded-2xl border p-4 text-right transition-all ${
                      planIndex === index
                        ? "border-[#059669] bg-[#ECFDF5] shadow-sm"
                        : "border-[#E5E7EB] bg-white hover:border-[#059669]/40"
                    }`}
                  >
                    <p className="text-sm text-[#666] mb-1">{item.label}</p>
                    <p className="text-2xl font-extrabold text-[#111]">₪{Math.round(item.price / 100)}</p>
                    <p className="text-xs text-[#666] mt-1">₪99 לחודש</p>
                  </button>
                ))}
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full h-14 rounded-2xl text-white font-bold text-lg disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  boxShadow: "0 4px 20px rgba(5,150,105,0.35)",
                }}
              >
                {loading ? "מעבירים..." : `${LAUNCH_OFFER.primaryButtonText} • ₪${Math.round(plan.price / 100)}`}
              </button>
              <p className="text-center text-[#888] text-xs mt-3">
                בחירת מסלול נוכחי: {plan.label} • {LAUNCH_OFFER.noCommitmentText}
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-[#E5E7EB] p-8 shadow-sm">
              <h2 className="font-bold text-[#111] text-xl mb-4">מה כלול במסלול</h2>
              <div className="space-y-3 mb-6">
                {BENEFITS.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-[#ECFDF5] flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-[#059669]" />
                    </div>
                    <span className="text-[#444] text-sm">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-[#FAFAF7] border border-stone-200 p-4">
                <p className="text-sm text-stone-700 mb-3">
                  רוצים לדבר איתנו לפני ההצטרפות? אפשר לפנות אלינו ישירות.
                </p>
                <div className="flex flex-col gap-2">
                  {whatsappHref ? (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 h-11 rounded-full bg-[#25D366] text-white font-semibold hover:bg-[#1EB856] transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      דברו איתנו בוואטסאפ
                    </a>
                  ) : null}
                  <a
                    href={`mailto:${BUSINESS_INFO.contactEmail}`}
                    className="inline-flex items-center justify-center gap-2 h-11 rounded-full border border-stone-200 bg-white text-stone-700 font-semibold hover:bg-stone-50 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    {BUSINESS_INFO.contactEmail}
                  </a>
                  <Link
                    href="/vendors"
                    className="inline-flex items-center justify-center h-11 rounded-full text-[#059669] font-semibold hover:underline"
                  >
                    לעמוד ההצטרפות המלא
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl border border-[#E5E7EB] p-8 shadow-sm">
            <h2 className="text-2xl font-extrabold text-[#111] mb-6">שאלות נפוצות</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {VENDOR_FAQS.map((item) => (
                <div key={item.question} className="rounded-2xl border border-stone-200 bg-[#FAFAF7] p-5">
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
