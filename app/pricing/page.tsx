"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PLANS, getPlanByIndex, getPlanCount } from "@/lib/plans";
import { Check, Zap } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { motion, AnimatePresence } from "framer-motion";

const BENEFITS = [
  "הופעה על המפה בזמן אמת",
  "פרופיל עסק מלא עם תמונות",
  "ניהול שעות ומיקום יומי",
  "קבלת ביקורות מלקוחות",
  "כפתור התקשרות ישיר",
  "סטטיסטיקות צפיות וחיוגים",
];

// Quick-select markers (index into PLANS array, 0-8)
// LTR slider: index 0 = left = יום, index 13 = right = שנה
const MARKERS = [
  { index: 0,  label: "יום" },
  { index: 4,  label: "שבוע" },
  { index: 8,  label: "חודש", highlight: true },
  { index: 13, label: "שנה" },
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

  const trackRef = useRef<HTMLDivElement>(null);

  const plan = getPlanByIndex(planIndex);
  const maxIndex = getPlanCount() - 1;

  // Price per day (in agorot)
  const pricePerDay = Math.round(plan.price / plan.days);
  // Saving vs paying daily (₪20/day)
  const baseCostAtDaily = 2000 * plan.days; // ₪20/day in agorot
  const saving = plan.days > 1 && baseCostAtDaily > plan.price
    ? baseCostAtDaily - plan.price
    : 0;

  const animatedPrice = useAnimatedNumber(Math.round(plan.price / 100));
  const animatedPerDay = useAnimatedNumber(Math.round(pricePerDay / 100));

  // Slider fill %
  const fillPct = (planIndex / maxIndex) * 100;

  // Card background shifts from light to deeper green based on plan duration
  const t = planIndex / maxIndex;
  const cardBg = `rgb(${Math.round(255 - t * 15)}, ${Math.round(255 - t * 5)}, ${Math.round(247 - t * 10)})`;

  // Click-on-track handler for custom slider
  const handleTrackPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setPlanIndex(Math.round(pct * maxIndex));
    },
    [maxIndex],
  );

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
            <div className="inline-flex items-center gap-2 bg-[#ECFDF5] text-[#1d938d] px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
              <Zap className="h-4 w-4" />
              תשלום חד פעמי — ללא התחייבות
            </div>
            <h1 className="text-4xl font-extrabold text-[#111] mb-3">כמה זמן תרצו להופיע?</h1>
            <p className="text-[#666] text-lg">גררו את הסרגל ובחרו את התקופה המתאימה לכם</p>
          </div>

          {/* Pricing Card — animated background */}
          <motion.div
            className="rounded-3xl shadow-xl border border-[#E5E7EB] p-8 mb-6"
            animate={{
              backgroundColor: cardBg,
            }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
          >
            {/* Price Display with ticker animation */}
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
              {/* Duration label — ticker slide animation */}
              <div className="overflow-hidden h-7 relative">
                <AnimatePresence mode="popLayout">
                  <motion.p
                    key={plan.label}
                    className="text-[#888] text-base"
                    initial={{ y: -28, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 28, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    ל-{plan.label}
                    {plan.days > 1 && (
                      <> • ₪<span className="font-semibold text-[#1d938d]">{animatedPerDay}</span> ליום</>
                    )}
                  </motion.p>
                </AnimatePresence>
              </div>
              {saving > 0 && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-1 mt-2 bg-[#ECFDF5] text-[#1d938d] px-3 py-1 rounded-full text-sm font-semibold"
                >
                  חוסכים ₪{Math.round(saving / 100)} לעומת ₪20 ליום
                </motion.div>
              )}
            </div>

            {/* Animated Slider — dir=ltr to prevent RTL flip */}
            <div className="mb-8">
              {/* Labels */}
              <div className="flex justify-between text-xs text-[#AAA] mb-2 px-1" dir="ltr">
                <span>יום</span>
                <span>שנה</span>
              </div>

              {/* Custom slider track */}
              <div
                dir="ltr"
                ref={trackRef}
                className="relative h-10 flex items-center cursor-pointer"
                onPointerDown={handleTrackPointerDown}
              >
                {/* Track background */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 rounded-full bg-[#CCEFEE]" />

                {/* Filled track with glow */}
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full"
                  style={{ left: 0 }}
                  animate={{ width: `${fillPct}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <div
                    className="w-full h-full rounded-full"
                    style={{
                      background: "linear-gradient(90deg, #2dd4bf, #1d938d)",
                      boxShadow: "0 0 12px rgba(29,147,141,0.5)",
                    }}
                  />
                </motion.div>

                {/* Animated thumb */}
                <motion.div
                  className="absolute top-1/2 z-10"
                  animate={{ left: `${fillPct}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  style={{ translateY: "-50%", translateX: "-50%" }}
                >
                  <motion.div
                    className="w-8 h-8 rounded-full bg-white border-[3.5px] border-[#1d938d]"
                    style={{
                      boxShadow: "0 0 0 5px rgba(29,147,141,0.2), 0 2px 12px rgba(29,147,141,0.45)",
                    }}
                    whileHover={{ scale: 1.25 }}
                    whileTap={{ scale: 0.9 }}
                  />
                </motion.div>

                {/* Invisible native range for accessibility & drag */}
                <input
                  type="range"
                  min={0}
                  max={maxIndex}
                  step={1}
                  value={planIndex}
                  onChange={(e) => setPlanIndex(Number(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer z-20"
                />
              </div>

              {/* Quick-select pill buttons with spring animation */}
              <div className="relative mt-4 h-9 overflow-visible pr-1" dir="ltr">
                {MARKERS.map((m) => {
                  const isActive = planIndex === m.index;
                  return (
                    <motion.button
                      key={m.index}
                      onClick={() => setPlanIndex(m.index)}
                      animate={{
                        scale: isActive ? 1.12 : 1,
                        backgroundColor: isActive ? "#1d938d" : "#F3F4F6",
                        color: isActive ? "#ffffff" : "#6B7280",
                      }}
                      whileHover={{ scale: isActive ? 1.12 : 1.06 }}
                      whileTap={{ scale: 0.92 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      style={{
                        position: "absolute",
                        left: m.index === maxIndex ? "calc(100% - 2px)" : `${(m.index / maxIndex) * 100}%`,
                        transform: m.index === 0 ? "translateX(2px)" : m.index === maxIndex ? "translateX(-100%)" : "translateX(-50%)",
                        top: 0,
                      }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full flex flex-col items-center whitespace-nowrap"
                    >
                      {m.label}
                      {m.highlight && !isActive && (
                        <span className="text-[9px] font-bold text-amber-500 leading-none">מומלץ</span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* CTA */}
            <motion.button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full h-14 rounded-2xl text-white font-bold text-lg disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #1d938d 0%, #156460 100%)",
                boxShadow: "0 4px 20px rgba(29,147,141,0.4)",
              }}
              whileHover={{ scale: 1.01, boxShadow: "0 6px 28px rgba(29,147,141,0.5)" }}
              whileTap={{ scale: 0.99 }}
            >
              {loading ? "מעביר לתשלום..." : `התחילו עכשיו — ₪${Math.round(plan.price / 100)}`}
            </motion.button>
            <p className="text-center text-[#AAA] text-xs mt-3">
              תשלום מאובטח • ללא חיוב חוזר אוטומטי
            </p>
          </motion.div>

          {/* Benefits */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
            <h3 className="font-bold text-[#111] text-base mb-4">מה כולל הרישום?</h3>
            <div className="space-y-3">
              {BENEFITS.map((b) => (
                <div key={b} className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-[#ECFDF5] flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-[#1d938d]" />
                  </div>
                  <span className="text-[#444] text-sm">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
