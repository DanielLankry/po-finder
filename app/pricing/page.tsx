"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PLANS, getPlanByIndex, getPlanCount } from "@/lib/plans";
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

// Quick-select markers (index into PLANS array, 0-8)
const MARKERS = [
  { index: 0, label: "יום" },
  { index: 2, label: "שבוע" },
  { index: 3, label: "שבועיים" },
  { index: 4, label: "חודש", highlight: true },
  { index: 8, label: "שנה" },
];

function useAnimatedNumber(target: number, duration = 250) {
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
  const [planIndex, setPlanIndex] = useState(8); // default: חודש
  const [loading, setLoading] = useState(false);

  const plan = getPlanByIndex(planIndex);
  const maxIndex = getPlanCount() - 1;

  // Price per day
  const pricePerDay = Math.round(plan.price / plan.days);
  // Saving vs base rate (₪20/day)
  const baseCost = 2900 * plan.days; // ₪20/day in agorot
  const saving = baseCost > plan.price ? baseCost - plan.price : 0;

  const animatedPrice = useAnimatedNumber(Math.round(plan.price / 100));
  const animatedPerDay = useAnimatedNumber(Math.round(pricePerDay / 100));

  // Slider fill %
  const fillPct = (planIndex / maxIndex) * 100;

  async function handleCheckout() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login?redirect=/pricing"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: plan.days, months: Math.ceil(plan.days / 30) }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch (err) {
      alert("שגיאה: " + (err instanceof Error ? err.message : String(err)));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7]" dir="rtl">
      <Navbar />
      <div className="py-16 px-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
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
                <span
                  className="text-7xl font-extrabold text-[#111] leading-none"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {animatedPrice}
                </span>
              </div>
              <p className="text-[#888] text-base">
                ל-{plan.label} • ₪<span className="font-semibold text-[#059669]">{animatedPerDay}</span> ליום
              </p>
              {saving > 0 && (
                <div className="inline-flex items-center gap-1 mt-2 bg-[#ECFDF5] text-[#059669] px-3 py-1 rounded-full text-sm font-semibold">
                  חוסכים ₪{Math.round(saving / 100)} לעומת מחיר יומי
                </div>
              )}
            </div>

            {/* Slider — dir=ltr to prevent RTL flip */}
            <div className="mb-8">
              <div className="flex justify-between text-xs text-[#AAA] mb-2 px-1" dir="rtl">
                <span>יום</span>
                <span>שנה</span>
              </div>
              <div dir="ltr">
                <input
                  type="range"
                  min={0}
                  max={maxIndex}
                  step={1}
                  value={planIndex}
                  onChange={(e) => setPlanIndex(Number(e.target.value))}
                  className="w-full h-2 appearance-none cursor-pointer rounded-full outline-none"
                  style={{
                    background: `linear-gradient(to right, #059669 ${fillPct}%, #E5E7EB ${fillPct}%)`,
                    WebkitAppearance: "none",
                  }}
                />
              </div>

              {/* Quick-select markers — absolutely positioned under slider */}
              <div className="relative mt-3 h-8" dir="ltr">
                {MARKERS.map((m) => {
                  const pct = (m.index / maxIndex) * 100;
                  const isActive = planIndex === m.index;
                  return (
                    <button
                      key={m.index}
                      onClick={() => setPlanIndex(m.index)}
                      style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
                      className={`absolute top-0 text-xs font-semibold px-2 py-1 rounded-full transition-all flex flex-col items-center whitespace-nowrap ${
                        isActive
                          ? "bg-[#059669] text-white"
                          : "text-[#888] hover:text-[#059669]"
                      }`}
                    >
                      {m.label}
                      {m.highlight && !isActive && (
                        <span className="text-[9px] font-bold text-amber-500 leading-none">מומלץ</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full h-14 rounded-2xl text-white font-bold text-lg transition-all hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                boxShadow: "0 4px 20px rgba(5,150,105,0.4)",
              }}
            >
              {loading ? "מעביר לתשלום..." : `התחילו עכשיו — ₪${Math.round(plan.price / 100)}`}
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
  );
}
