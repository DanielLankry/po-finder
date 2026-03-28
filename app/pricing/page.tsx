"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PRICING_PLANS, getPriceForMonths, getPricePerMonth } from "@/lib/plans";
import { Check, Zap } from "lucide-react";
import Navbar from "@/components/layout/Navbar";

const BENEFITS = [
  "הופעה על המפה בזמן אמת",
  "פרופיל עסק מלא עם תמונות",
  "ניהול שעות ומיקום יומי",
  "קבלת ביקורות מלקוחות",
  "כפתור התקשרות ישיר",
  "סטטיסטיקות צפיות וחיוגים",
];

function useAnimatedNumber(target: number, duration = 300) {
  const [display, setDisplay] = useState(target);
  const raf = useRef<number | null>(null);
  const start = useRef<number | null>(null);
  const from = useRef(target);

  useEffect(() => {
    from.current = display;
    start.current = null;
    if (raf.current) cancelAnimationFrame(raf.current);

    const animate = (ts: number) => {
      if (!start.current) start.current = ts;
      const progress = Math.min((ts - start.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from.current + (target - from.current) * eased));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target]);

  return display;
}

export default function PricingPage() {
  const router = useRouter();
  const [months, setMonths] = useState(3);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const price = getPriceForMonths(months);
  const perMonth = getPricePerMonth(months);
  const saving = months > 1 ? (2900 * months - price) : 0;

  const animatedPrice = useAnimatedNumber(Math.round(price / 100));
  const animatedPerMonth = useAnimatedNumber(Math.round(perMonth / 100));

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setChecking(false);
    });
  }, []);

  async function handleCheckout() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login?redirect=/pricing"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ months }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch (err) {
      alert("שגיאה: " + (err instanceof Error ? err.message : String(err)));
      setLoading(false);
    }
  }

  const monthLabel = months === 1 ? "חודש" : months === 2 ? "חודשיים" : `${months} חודשים`;

  return (
    <div className="min-h-screen bg-[#FAFAF7]" dir="rtl">
      <Navbar />
      <div className="py-16 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#ECFDF5] text-[#059669] px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <Zap className="h-4 w-4" />
            תשלום חד פעמי — ללא התחייבות
          </div>
          <h1 className="text-4xl font-extrabold text-[#111] mb-3">כמה זמן תרצו להופיע?</h1>
          <p className="text-[#666] text-lg">גררו את הסרגל ובחרו את התקופה המתאימה לכם</p>
        </div>

        {/* Pricing Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-[#E5E7EB] p-8 mb-6">
          {/* Price Display */}
          <div className="text-center mb-8">
            <div className="flex items-end justify-center gap-2 mb-1">
              <span className="text-[#888] text-xl font-medium">₪</span>
              <span className="text-7xl font-extrabold text-[#111] leading-none tabular-nums" style={{ fontVariantNumeric: "tabular-nums" }}>
                {animatedPrice}
              </span>
            </div>
            <p className="text-[#888] text-base">
              ל-{monthLabel} • ₪<span className="font-semibold text-[#059669]">{animatedPerMonth}</span> לחודש
            </p>
            {saving > 0 && (
              <div className="inline-flex items-center gap-1 mt-2 bg-[#ECFDF5] text-[#059669] px-3 py-1 rounded-full text-sm font-semibold">
                חוסכים ₪{Math.round(saving / 100)} לעומת תשלום חודשי
              </div>
            )}
          </div>

          {/* Slider */}
          <div className="mb-8">
            <div className="flex justify-between text-xs text-[#AAA] mb-2 px-1">
              <span>חודש</span>
              <span>שנה</span>
            </div>
            <div className="relative" dir="ltr">
              <input
                type="range"
                min={1}
                max={12}
                step={1}
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="w-full h-2 appearance-none cursor-pointer rounded-full outline-none"
                style={{
                  background: `linear-gradient(to right, #059669 ${((months - 1) / 11) * 100}%, #E5E7EB ${((months - 1) / 11) * 100}%)`,
                  WebkitAppearance: "none",
                  direction: "ltr",
                }}
              />
            </div>
            {/* Month markers */}
            <div className="flex justify-between mt-3 px-0.5">
              {[1, 3, 6, 9, 12].map((m) => (
                <button
                  key={m}
                  onClick={() => setMonths(m)}
                  className={`text-xs font-semibold px-2 py-1 rounded-full transition-all ${
                    months === m
                      ? "bg-[#059669] text-white"
                      : "text-[#888] hover:text-[#059669]"
                  }`}
                >
                  {m === 12 ? "שנה" : m === 1 ? "חודש" : `${m}M`}
                  {m === 3 && <div className="text-[9px] font-bold text-amber-500">מומלץ</div>}
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleCheckout}
            disabled={loading || checking}
            className="w-full h-14 rounded-2xl text-white font-bold text-lg transition-all hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
              boxShadow: "0 4px 20px rgba(5,150,105,0.4)",
            }}
          >
            {loading ? "מעביר לתשלום..." : `התחילו עכשיו — ₪${Math.round(price / 100)}`}
          </button>
          <p className="text-center text-[#AAA] text-xs mt-3">
            תשלום מאובטח • ללא חיוב חוזר אוטומטי
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
          <h3 className="font-bold text-[#111] text-base mb-4">מה כולל הרישום?</h3>
          <div className="space-y-3">
            {BENEFITS.map((b) => (
              <div key={b} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-[#ECFDF5] flex items-center justify-center flex-shrink-0">
                  <Check className="h-3 w-3 text-[#059669]" />
                </div>
                <span className="text-[#444] text-sm">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          border: 3px solid #059669;
          box-shadow: 0 2px 8px rgba(5,150,105,0.3);
          cursor: pointer;
          transition: transform 0.15s;
        }
        input[type='range']::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        input[type='range']::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          border: 3px solid #059669;
          cursor: pointer;
        }
      `}</style>
      </div>
    </div>
  );
}
