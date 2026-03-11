"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Check, MapPin, Camera, Clock, Star, BarChart3, Shield } from "lucide-react";
import Link from "next/link";
import { PLANS } from "@/lib/plans";

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const showBanner = typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("reason") === "subscription_required";

  async function handleSubscribe() {
    setLoading(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (res.status === 401) {
        window.location.href = "/auth/login?redirectTo=/pricing";
      } else {
        setCheckoutError(data.error ?? "אירעה שגיאה. נסו שוב מאוחר יותר.");
      }
    } catch {
      setCheckoutError("בעיית חיבור. בדקו את החיבור לאינטרנט ונסו שוב.");
    } finally {
      setLoading(false);
    }
  }

  const plan = PLANS.business;
  const featureIcons = [MapPin, Camera, Clock, Camera, Star, BarChart3];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FAFAF7] pt-[88px] pb-16" dir="rtl">
        <div className="max-w-4xl mx-auto px-4">
          {showBanner && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-amber-800 text-sm text-center font-medium">
              ⚡ כדי לגשת ללוח הבקרה ולהופיע על המפה, יש צורך במנוי פעיל
            </div>
          )}
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-stone-900 mb-3">
              הביאו את העסק שלכם למפה
            </h1>
            <p className="text-stone-500 text-lg max-w-xl mx-auto">
              מנוי חודשי פשוט — בלי התחייבות, בלי הפתעות
            </p>
          </div>

          {/* Pricing Card */}
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-3xl border-2 border-[#059669] shadow-hover p-8 relative">
              {/* Badge */}
              <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                <span className="bg-[#059669] text-white text-xs font-bold px-4 py-1.5 rounded-full">
                  מנוי חודשי
                </span>
              </div>

              <div className="text-center mt-2 mb-6">
                <h2 className="font-display font-bold text-xl text-stone-900 mb-3">
                  {plan.name}
                </h2>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-display font-extrabold text-5xl text-stone-900">
                    {plan.priceDisplay}
                  </span>
                  <span className="text-stone-500 text-sm">/חודש</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => {
                  const Icon = featureIcons[i] || Check;
                  return (
                    <li key={feature} className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-3.5 w-3.5 text-[#059669]" aria-hidden="true" />
                      </div>
                      <span className="text-stone-700 text-sm">{feature}</span>
                    </li>
                  );
                })}
              </ul>

              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full h-12 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed btn-press"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    מעבד...
                  </span>
                ) : (
                  "התחילו עכשיו"
                )}
              </button>

              {checkoutError && (
                <p role="alert" className="text-red-600 text-sm text-center bg-red-50 rounded-xl px-4 py-2.5 mt-2">
                  {checkoutError}
                </p>
              )}
              <p className="text-center text-stone-400 text-xs mt-3">
                ניתן לבטל בכל עת. ללא התחייבות.
              </p>
            </div>
          </div>

          {/* Trust section */}
          <div className="mt-12 text-center">
            <div className="flex items-center justify-center gap-6 text-stone-400 text-sm">
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4" aria-hidden="true" />
                <span>תשלום מאובטח</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4" aria-hidden="true" />
                <span>ביטול בכל עת</span>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-16 max-w-2xl mx-auto">
            <h2 className="font-display font-bold text-2xl text-stone-900 text-center mb-8">
              שאלות נפוצות
            </h2>
            <div className="space-y-4">
              <FaqItem
                question="מה קורה אחרי שאני נרשם?"
                answer="לאחר הרישום והתשלום, תוכלו ליצור פרופיל עסק מלא, להוסיף תמונות, לנהל שעות פעילות, ולהופיע על המפה מיד."
              />
              <FaqItem
                question="האם אפשר לבטל בכל עת?"
                answer="כן! אין התחייבות. ניתן לבטל את המנוי בכל עת דרך לוח הבקרה ולא תחויבו שוב."
              />
              <FaqItem
                question="איך מתבצע התשלום?"
                answer="התשלום מתבצע בצורה מאובטחת דרך Stripe. אנחנו תומכים בכרטיסי אשראי ודביט."
              />
              <FaqItem
                question="האם יש תקופת ניסיון?"
                answer="כרגע אין תקופת ניסיון חינמית, אבל ניתן לבטל בכל עת בחודש הראשון ולקבל החזר מלא."
              />
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <p className="text-stone-500 mb-3">יש שאלות נוספות?</p>
            <Link
              href="/contact"
              className="text-[#059669] font-medium hover:underline"
            >
              צרו קשר
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group bg-stone-50 rounded-xl border border-stone-200 overflow-hidden">
      <summary className="flex items-center justify-between cursor-pointer p-4 text-sm font-medium text-stone-900 hover:bg-stone-100 transition-colors list-none">
        <span>{question}</span>
        <span className="text-stone-400 group-open:rotate-45 transition-transform text-lg">+</span>
      </summary>
      <div className="px-4 pb-4 text-sm text-stone-600 leading-relaxed">
        {answer}
      </div>
    </details>
  );
}
