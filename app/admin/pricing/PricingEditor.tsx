"use client";

import { useState } from "react";
import { Save, Info, Store, Sparkles } from "lucide-react";
import { PLANS } from "@/lib/plans";
import type { Plan, PlanKind } from "@/lib/plans";

type EditablePlan = { kind: PlanKind; days: number; label: string; price: number };

const KIND_META: Record<
  PlanKind,
  { title: string; hint: string; icon: typeof Store; accent: string; unit: string }
> = {
  listing: {
    title: "רישום שנתי",
    hint: "תשלום חד-פעמי שמפעיל את העסק על המפה לתקופה שנקבעת בימים.",
    icon: Store,
    accent: "#2D6A4F",
    unit: "לשנה",
  },
  boost: {
    title: "קידום חודשי",
    hint: "בולטות מוגברת — ראשונים בחיפוש עם תג ״מקודם״. נרכש חודש-חודש.",
    icon: Sparkles,
    accent: "#D97706",
    unit: "לחודש",
  },
};

function toEditable(plans: Plan[]): EditablePlan[] {
  // Exactly two fixed rows: listing then boost. Fall back to static defaults.
  const listing =
    plans.find((p) => p.kind === "listing") ?? PLANS.find((p) => p.kind === "listing")!;
  const boost =
    plans.find((p) => p.kind === "boost") ?? PLANS.find((p) => p.kind === "boost")!;
  return [
    { kind: "listing", days: listing.days, label: listing.label, price: listing.price },
    { kind: "boost", days: boost.days, label: boost.label, price: boost.price },
  ];
}

export default function PricingEditor({ initialPlans }: { initialPlans: Plan[] }) {
  const [plans, setPlans] = useState<EditablePlan[]>(toEditable(initialPlans));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  function updatePlan(kind: PlanKind, field: "days" | "label" | "price", value: string | number) {
    setPlans((prev) =>
      prev.map((p) =>
        p.kind === kind ? { ...p, [field]: field === "label" ? value : Number(value) } : p
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
      const body = await res.json().catch(() => ({}));
      alert(body.error ?? "שגיאה בשמירה");
    }
    setSaving(false);
  }

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="font-extrabold text-2xl text-[#111]">עריכת מחירון</h1>
          <p className="text-[#888] text-sm">שני מוצרים קבועים — רישום שנתי וקידום חודשי</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #2D6A4F, #1F5038)" }}
        >
          <Save className="h-4 w-4" />
          {saving ? "שומר..." : saved ? "✅ נשמר" : "שמור שינויים"}
        </button>
      </div>

      <div className="flex items-start gap-3 bg-[#EFF5F0] border border-[#C3DCC9] rounded-2xl p-4 mb-6">
        <Info className="h-5 w-5 text-[#4A8B66] flex-shrink-0 mt-0.5" />
        <p className="text-[#1F5038] text-sm">
          המחירים בשקלים. שינויים נשמרים מיידית לכל המשתמשים ללא צורך ב-deploy חדש.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {plans.map((plan) => {
          const meta = KIND_META[plan.kind];
          const Icon = meta.icon;
          return (
            <div
              key={plan.kind}
              className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${meta.accent}1A` }}
                >
                  <Icon className="h-5 w-5" style={{ color: meta.accent }} />
                </div>
                <div>
                  <p className="font-bold text-[#111]">{meta.title}</p>
                  <p className="text-xs text-[#888]">{meta.hint}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#888] mb-1">
                  שם מוצג ללקוח
                </label>
                <input
                  value={plan.label}
                  onChange={(e) => updatePlan(plan.kind, "label", e.target.value)}
                  className="w-full h-10 rounded-lg border border-[#E5E7EB] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#888] mb-1">
                    תקופה (ימים)
                  </label>
                  <input
                    type="number"
                    value={plan.days}
                    onChange={(e) => updatePlan(plan.kind, "days", e.target.value)}
                    className="w-full h-10 rounded-lg border border-[#E5E7EB] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] bg-white"
                    dir="ltr"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#888] mb-1">
                    מחיר (₪) {meta.unit}
                  </label>
                  <div className="relative">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] text-sm">₪</span>
                    <input
                      type="number"
                      value={Math.round(plan.price / 100)}
                      onChange={(e) => updatePlan(plan.kind, "price", Number(e.target.value) * 100)}
                      className="w-full h-10 rounded-lg border border-[#E5E7EB] px-3 pr-7 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] bg-white"
                      dir="ltr"
                      min={1}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[#AAA] text-xs mt-4 text-center">
        רישום = כמה זמן העסק חי על המפה • קידום = כמה זמן העסק מקבל בולטות מוגברת
      </p>
    </div>
  );
}
