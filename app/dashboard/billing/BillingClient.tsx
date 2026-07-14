"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Calendar, Plus, Receipt } from "lucide-react";
import DurationSelectorCard from "@/components/business/DurationSelectorCard";
import { PLAN_CODES } from "@/lib/plans";
import type { Plan, PlanCode } from "@/lib/plans";

interface BusinessLite {
  id: string;
  name: string;
  expires_at: string | null;
  is_active: boolean;
  is_verified: boolean;
}

export default function BillingClient({
  plans,
  nowIso,
}: {
  plans: Plan[];
  nowIso: string;
}) {
  const [businesses, setBusinesses] = useState<BusinessLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [paymentState] = useState(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("payment");
  });
  const [initialCode] = useState<PlanCode>(() => {
    if (typeof window === "undefined") return "listing_6m";
    const requested = new URLSearchParams(window.location.search).get("plan");
    return PLAN_CODES.includes(requested as PlanCode)
      ? (requested as PlanCode)
      : "listing_6m";
  });

  useEffect(() => {
    fetch("/api/businesses?mine=1")
      .then((response) => response.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setBusinesses(data.businesses ?? []);
      })
      .catch((caught) =>
        setError(caught instanceof Error ? caught.message : String(caught))
      )
      .finally(() => setLoading(false));
  }, []);

  async function startCheckout(plan: Plan, businessId: string) {
    setCheckoutLoading(`${plan.code}:${businessId}`);
    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode: plan.code, businessId }),
      });
      const raw = await response.text();
      let data: { ok?: boolean; url?: string; detail?: string; error?: string } = {};
      try {
        data = JSON.parse(raw);
      } catch {
        data = {};
      }

      if (!response.ok || data.ok === false || !data.url) {
        const knownMessage =
          data.error === "business_not_verified"
            ? "העסק עדיין ממתין לאימות."
            : "לא הצלחנו להתחיל את התשלום.";
        setError(`${knownMessage}${data.detail ? ` (${data.detail})` : ""}`);
        setCheckoutLoading(null);
        return;
      }
      window.location.assign(data.url);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught);
      setError(`לא הצלחנו להתחיל את התשלום. (${message})`);
      setCheckoutLoading(null);
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="font-display text-4xl font-extrabold text-stone-900">
          תשלום ומשך הופעה
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          בוחרים זמן ומשלמים פעם אחת. אין מנוי ואין חידוש אוטומטי.
        </p>
      </div>

      {paymentState === "success" ? (
        <Notice tone="success" text="התשלום נקלט והזמן נוסף לעסק." />
      ) : paymentState === "processing" ? (
        <Notice
          tone="warning"
          text="התשלום התקבל ונמצא בבדיקה. לא צריך לשלם שוב — התמיכה קיבלה התראה."
        />
      ) : null}
      {error ? <Notice tone="error" text={error} /> : null}

      <section className="brand-panel overflow-hidden">
        <div className="flex items-center gap-2 border-b-2 border-[#17402D] bg-[#FFF3B0] px-6 py-4">
          <Calendar className="h-5 w-5 text-[#17402D]" />
          <h2 className="font-display text-2xl font-bold text-[#17402D]">העסק שלי</h2>
        </div>
        {loading ? (
          <div className="p-10 text-center text-sm text-stone-400">טוען...</div>
        ) : businesses.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-stone-600">לפני תשלום יוצרים טיוטת עסק בחינם.</p>
            <Link
              href="/dashboard/profile"
              className="brand-button mt-4 inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold"
            >
              <Plus className="h-4 w-4" /> יצירת טיוטה
            </Link>
          </div>
        ) : (
          <div className="divide-y-2 divide-stone-200">
            {businesses.map((business) => {
              const active =
                business.is_active &&
                !!business.expires_at &&
                Date.parse(business.expires_at) > Date.parse(nowIso);
              return (
                <article key={business.id} className="space-y-5 p-5 md:p-7">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-3xl text-stone-950">{business.name}</h3>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                        <StatusPill
                          active={business.is_verified}
                          activeText="מאומת"
                          inactiveText="ממתין לאימות"
                        />
                        <StatusPill
                          active={active}
                          activeText={`מופיע עד ${formatDate(business.expires_at)}`}
                          inactiveText="לא מופיע לציבור"
                        />
                      </div>
                    </div>
                    {!business.is_verified ? (
                      <p className="max-w-sm rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
                        הטיוטה נשמרה. אחרי שהצוות יאמת את העסק אפשר יהיה לבחור זמן ולשלם.
                      </p>
                    ) : null}
                  </div>

                  <DurationSelectorCard
                    plans={plans}
                    nowIso={nowIso}
                    baseExpiry={business.expires_at}
                    initialCode={initialCode}
                    disabled={!business.is_verified || checkoutLoading !== null}
                    loading={checkoutLoading?.endsWith(`:${business.id}`) ?? false}
                    onAction={(plan) => startCheckout(plan, business.id)}
                  />
                  <p className="text-center text-xs text-stone-500">
                    התוקף מתחיל אחרי תשלום מוצלח. בסיום העסק יורד אוטומטית מהאתר,
                    ולוח הבקרה נשאר זמין לחידוש.
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="brand-panel-soft p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
            <Receipt className="h-5 w-5 text-stone-600" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-stone-900">קבלות וחשבוניות</h2>
            <p className="mt-1 text-sm text-stone-600">
              הקבלה נשלחת בדוא״ל לאחר התשלום. לעותק נוסף או שאלה, {" "}
              <Link href="/contact" className="font-semibold text-[#2D6A4F] underline">
                פנו אלינו
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatusPill({
  active,
  activeText,
  inactiveText,
}: {
  active: boolean;
  activeText: string;
  inactiveText: string;
}) {
  return (
    <span
      className={`rounded-full px-3 py-1.5 ${
        active
          ? "bg-emerald-100 text-emerald-800"
          : "bg-stone-200 text-stone-700"
      }`}
    >
      {active ? activeText : inactiveText}
    </span>
  );
}

function Notice({
  tone,
  text,
}: {
  tone: "success" | "warning" | "error";
  text: string;
}) {
  const classes =
    tone === "success"
      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
      : tone === "warning"
        ? "border-amber-300 bg-amber-50 text-amber-900"
        : "border-red-300 bg-red-50 text-red-900";
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${classes}`}>
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
