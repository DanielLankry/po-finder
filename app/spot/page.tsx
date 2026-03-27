"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_LABELS, SPOT_DURATIONS } from "@/lib/types";
import type { BusinessCategory } from "@/lib/types";
import { MapPin, Phone, AlignLeft, Tag, Clock, ChevronLeft } from "lucide-react";
import Link from "next/link";

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [BusinessCategory, string][];

const CATEGORY_EMOJI: Record<string, string> = {
  coffee: "☕", food: "🍽️", sweets: "🍰", meat: "🥩",
  vegan: "🌿", celiac: "🌾", flowers: "🌸", jewelry: "💎", vintage: "👗",
};

export default function SpotPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(0); // index into SPOT_DURATIONS

  const [form, setForm] = useState({
    name: "",
    category: "food" as BusinessCategory,
    address: "",
    phone: "",
    description: "",
    photo_url: "",
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/auth/login?redirect=/spot");
      } else {
        setUser({ id: data.user.id, email: data.user.email ?? "" });
        setLoading(false);
      }
    });
  }, [router]);

  const chosen = SPOT_DURATIONS[selectedDuration];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.address) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/stripe/spot-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration_days: chosen.days,
          spot_data: {
            name: form.name,
            category: form.category,
            address: form.address,
            lat: 32.0853,
            lng: 34.7818,
            phone: form.phone || null,
            description: form.description || null,
            photo_url: form.photo_url || null,
          },
        }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch (err) {
      alert("שגיאה ביצירת תשלום: " + (err instanceof Error ? err.message : String(err)));
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-orange-200 border-t-[#F97316] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7]" dir="rtl">
      {/* Header */}
      <div
        className="w-full py-10 px-6 text-white"
        style={{ background: "linear-gradient(135deg, #FB923C 0%, #EA580C 100%)" }}
      >
        <div className="max-w-xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-1 text-white/80 text-sm mb-4 hover:text-white transition-colors">
            <ChevronLeft className="h-4 w-4 rotate-180" />
            חזרה למפה
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">
              ✦
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">הוסף Spot</h1>
              <p className="text-white/80 text-sm">דוכן זמני בולט על המפה</p>
            </div>
          </div>
          <p className="text-white/90 text-sm leading-relaxed">
            Spot הוא רישום זמני שמופיע בצבע כתום מהבהב — בולט מעל כל העסקים הרגילים.
            מתאים לדוכנים בשוק, עגלת קפה, תכשיטים, ואירועים חד-פעמיים.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto px-6 py-8 flex flex-col gap-6">

        {/* Duration picker */}
        <div>
          <label className="block text-[#111] font-bold text-sm mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#F97316]" />
            כמה זמן תרצה להופיע?
          </label>
          <div className="grid grid-cols-5 gap-2">
            {SPOT_DURATIONS.map((d, i) => (
              <button
                key={d.days}
                type="button"
                onClick={() => setSelectedDuration(i)}
                className={[
                  "flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all duration-200 text-center",
                  selectedDuration === i
                    ? "border-[#F97316] bg-orange-50 shadow-sm"
                    : "border-[#E5E7EB] bg-white hover:border-orange-300",
                ].join(" ")}
              >
                <span className="font-bold text-[11px] text-[#111]">{d.label}</span>
                <span
                  className="font-extrabold text-[13px]"
                  style={{ color: selectedDuration === i ? "#EA580C" : "#555" }}
                >
                  ₪{d.price / 100}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-[#111] font-bold text-sm mb-2">שם הדוכן *</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="למשל: שרו פלאפל, קפה גל, תכשיטי נועה..."
            className="w-full h-12 rounded-xl border border-[#E5E7EB] bg-white px-4 text-[#111] placeholder:text-[#AAA] focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent transition-all"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-[#111] font-bold text-sm mb-2 flex items-center gap-2">
            <Tag className="h-4 w-4 text-[#F97316]" />
            קטגוריה
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setForm({ ...form, category: key })}
                className={[
                  "flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm transition-all duration-200",
                  form.category === key
                    ? "border-[#F97316] bg-orange-50 font-semibold text-[#EA580C]"
                    : "border-[#E5E7EB] bg-white text-[#555] hover:border-orange-200",
                ].join(" ")}
              >
                <span>{CATEGORY_EMOJI[key]}</span>
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-[#111] font-bold text-sm mb-2 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#F97316]" />
            כתובת *
          </label>
          <input
            required
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="רחוב, עיר (לדוגמא: שוק הכרמל, תל אביב)"
            className="w-full h-12 rounded-xl border border-[#E5E7EB] bg-white px-4 text-[#111] placeholder:text-[#AAA] focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent transition-all"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-[#111] font-bold text-sm mb-2 flex items-center gap-2">
            <Phone className="h-4 w-4 text-[#F97316]" />
            טלפון
          </label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="050-0000000"
            className="w-full h-12 rounded-xl border border-[#E5E7EB] bg-white px-4 text-[#111] placeholder:text-[#AAA] focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent transition-all"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-[#111] font-bold text-sm mb-2 flex items-center gap-2">
            <AlignLeft className="h-4 w-4 text-[#F97316]" />
            תיאור קצר
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="ספר על הדוכן שלך — מה תמצאו, מה מיוחד..."
            rows={3}
            className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-[#111] placeholder:text-[#AAA] focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent transition-all resize-none"
          />
        </div>

        {/* Photo URL */}
        <div>
          <label className="block text-[#111] font-bold text-sm mb-2">תמונה (קישור URL)</label>
          <input
            value={form.photo_url}
            onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
            placeholder="https://..."
            className="w-full h-12 rounded-xl border border-[#E5E7EB] bg-white px-4 text-[#111] placeholder:text-[#AAA] focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent transition-all"
          />
        </div>

        {/* Summary */}
        <div className="rounded-2xl bg-orange-50 border border-orange-200 p-4 flex items-center justify-between">
          <div>
            <p className="font-bold text-[#111] text-sm">{form.name || "הדוכן שלך"}</p>
            <p className="text-[#666] text-xs">{chosen.label} • מחכה לאישור תוך 24 שעות</p>
          </div>
          <div className="text-right">
            <p className="font-extrabold text-[#EA580C] text-xl">₪{chosen.price / 100}</p>
            <p className="text-[#888] text-xs">תשלום חד פעמי</p>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !form.name || !form.address}
          className="w-full h-14 rounded-2xl text-white font-bold text-[16px] transition-all duration-300 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, #FB923C 0%, #EA580C 100%)", boxShadow: "0 4px 16px rgba(249,115,22,0.4)" }}
        >
          {submitting ? "מעביר לתשלום..." : `המשך לתשלום — ₪${chosen.price / 100}`}
        </button>

        <p className="text-center text-[#AAA] text-xs">
          תשלום מאובטח דרך Stripe • הדוכן יאושר ידנית תוך 24 שעות
        </p>
      </form>
    </div>
  );
}
