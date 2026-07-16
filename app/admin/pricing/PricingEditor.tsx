"use client";

import { useState } from "react";
import { BadgeCheck, Info, Save } from "lucide-react";
import { PLANS, getPlanByCode, getPlanDurationLabel } from "@/lib/plans";
import type { Plan, PlanCode } from "@/lib/plans";

type EditablePlan = Pick<Plan, "code" | "months" | "days" | "label" | "price">;

function toEditable(plans: Plan[]): EditablePlan[] {
  return PLANS.map((fallback) => {
    const plan = getPlanByCode(plans, fallback.code) ?? fallback;
    return {
      code: plan.code,
      months: plan.months,
      days: plan.days,
      label: plan.label,
      price: plan.price,
    };
  });
}

export default function PricingEditor({ initialPlans }: { initialPlans: Plan[] }) {
  const [plans, setPlans] = useState<EditablePlan[]>(toEditable(initialPlans));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  function updatePlan(
    code: PlanCode,
    field: "label" | "price",
    value: string | number
  ) {
    setPlans((current) =>
      current.map((plan) =>
        plan.code === code
          ? { ...plan, [field]: field === "label" ? value : Number(value) }
          : plan
      )
    );
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    const response = await fetch("/api/admin/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plans }),
    });
    if (response.ok) setSaved(true);
    else {
      const body = await response.json().catch(() => ({}));
      alert(typeof body.error === "string" ? body.error : "שגיאה בשמירה");
    }
    setSaving(false);
  }

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111]">מחירי זמן ההופעה</h1>
          <p className="text-sm text-[#888]">מוצר אחד עם יום, שבוע ו־12 משכי חודש חד־פעמיים</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-[#2D6A4F] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "שומר..." : saved ? "נשמר ✓" : "שמור שינויים"}
        </button>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#C3DCC9] bg-[#EFF5F0] p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#4A8B66]" />
        <p className="text-sm text-[#1F5038]">
          משך הזמן וקוד המוצר נעולים כדי לשמור על חידושים והחזרים מדויקים.
          שינוי מחיר או שם חל רק על רכישות חדשות.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.code}
            className="space-y-4 rounded-2xl border-2 border-[#E5E7EB] bg-white p-5 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF5F0]">
                <BadgeCheck className="h-5 w-5 text-[#2D6A4F]" />
              </div>
              <div>
                <p className="font-mono text-[11px] text-[#888]" dir="ltr">{plan.code}</p>
                <p className="text-xs font-bold text-[#8A3618]">{getPlanDurationLabel(plan)}</p>
              </div>
            </div>
            <Field label="שם מוצג">
              <input
                value={plan.label}
                onChange={(event) => updatePlan(plan.code, "label", event.target.value)}
                className="h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
            </Field>
            <Field label="מחיר (₪)">
              <input
                type="number"
                min={1}
                value={plan.price / 100}
                onChange={(event) =>
                  updatePlan(plan.code, "price", Number(event.target.value) * 100)
                }
                className="h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm"
                dir="ltr"
              />
            </Field>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-[#777]">{label}</span>
      {children}
    </label>
  );
}
