"use client";

import { useState } from "react";
import { PLANS } from "@/lib/plans";
import { Save, Info } from "lucide-react";

// Local editable state — mirrors PLANS
type EditablePlan = { days: number; label: string; price: number };

export default function AdminPricingPage() {
  const [plans, setPlans] = useState<EditablePlan[]>(
    PLANS.map((p) => ({ days: p.days, label: p.label, price: p.price }))
  );
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  function updatePlan(index: number, field: keyof EditablePlan, value: string | number) {
    setPlans((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, [field]: field === "label" ? value : Number(value) } : p
      )
    );
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/admin/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plans }),
    });
    if (res.ok) {
      setSaved(true);
    } else {
      alert("שגיאה בשמירה");
    }
    setSaving(false);
  }

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="font-extrabold text-2xl text-[#111]">עריכת מחירון</h1>
          <p className="text-[#888] text-sm">שנה מחירים וכותרות — ישמר לקובץ ויפרס אוטומטית</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #059669, #047857)" }}
        >
          <Save className="h-4 w-4" />
          {saving ? "שומר..." : saved ? "✅ נשמר" : "שמור שינויים"}
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl p-4 mb-6">
        <Info className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
        <p className="text-[#047857] text-sm">
          המחירים מוצגים בשקלים. הקפד שהמחיר יעלה בהדרגה ככל שמספר הימים גדל (לא ייתכן שחודש יהיה זול יותר מ-3 שבועות).
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 gap-0 border-b border-[#E5E7EB] bg-[#F9FAFB] px-5 py-3">
          <span className="col-span-1 text-xs font-bold text-[#888]">#</span>
          <span className="col-span-4 text-xs font-bold text-[#888]">שם תוכנית</span>
          <span className="col-span-3 text-xs font-bold text-[#888]">ימים</span>
          <span className="col-span-3 text-xs font-bold text-[#888]">מחיר (₪)</span>
          <span className="col-span-1 text-xs font-bold text-[#888]">ליום</span>
        </div>

        {plans.map((plan, i) => {
          const prev = i > 0 ? plans[i - 1] : null;
          const isDropping = prev && plan.price < prev.price;
          return (
            <div
              key={plan.days}
              className={`grid grid-cols-12 gap-0 border-b border-[#F5F5F5] px-5 py-3 items-center ${
                isDropping ? "bg-red-50" : i % 2 === 0 ? "bg-white" : "bg-[#FAFAF7]"
              }`}
            >
              <span className="col-span-1 text-sm text-[#888]">{i + 1}</span>
              <div className="col-span-4 pl-2">
                <input
                  value={plan.label}
                  onChange={(e) => updatePlan(i, "label", e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#E5E7EB] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] bg-white"
                />
              </div>
              <div className="col-span-3 px-2">
                <input
                  type="number"
                  value={plan.days}
                  onChange={(e) => updatePlan(i, "days", e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#E5E7EB] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] bg-white"
                  dir="ltr"
                />
              </div>
              <div className="col-span-3 px-2">
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] text-sm">₪</span>
                  <input
                    type="number"
                    value={Math.round(plan.price / 100)}
                    onChange={(e) => updatePlan(i, "price", Number(e.target.value) * 100)}
                    className={`w-full h-9 rounded-lg border px-3 pr-7 text-sm focus:outline-none focus:ring-2 bg-white ${
                      isDropping
                        ? "border-red-300 focus:ring-red-400 text-red-600"
                        : "border-[#E5E7EB] focus:ring-[#059669]"
                    }`}
                    dir="ltr"
                    min={1}
                  />
                </div>
                {isDropping && (
                  <p className="text-red-500 text-[10px] mt-0.5">⚠️ נמוך מהתוכנית הקודמת</p>
                )}
              </div>
              <span className="col-span-1 text-xs text-[#888]" dir="ltr">
                ₪{Math.round(plan.price / plan.days / 100)}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-[#AAA] text-xs mt-4 text-center">
        שינויים ישמרו ב-lib/plans.ts ויפרסו בbuild הבא
      </p>
    </div>
  );
}
