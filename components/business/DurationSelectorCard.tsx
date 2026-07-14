"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, CalendarDays, Check } from "lucide-react";
import {
  PLAN_CODES,
  PLANS,
  addCalendarMonths,
  getPlanByCode,
} from "@/lib/plans";
import type { Plan, PlanCode } from "@/lib/plans";

interface DurationSelectorCardProps {
  plans: Plan[];
  nowIso: string;
  baseExpiry?: string | null;
  initialCode?: PlanCode;
  disabled?: boolean;
  loading?: boolean;
  onAction: (plan: Plan) => void;
}

/** Renders the single duration product and keeps price/expiry preview in sync.
 * The database owns final entitlement dates; this UTC preview mirrors its
 * calendar-month arithmetic so owners see the date they are buying.
 */
export default function DurationSelectorCard({
  plans,
  nowIso,
  baseExpiry,
  initialCode = "listing_6m",
  disabled = false,
  loading = false,
  onAction,
}: DurationSelectorCardProps) {
  const catalog = useMemo(
    () =>
      PLAN_CODES.map(
        (code) => getPlanByCode(plans, code) ?? getPlanByCode(PLANS, code)!
      ),
    [plans]
  );
  const initialIndex = Math.max(
    0,
    catalog.findIndex((plan) => plan.code === initialCode)
  );
  const [index, setIndex] = useState(initialIndex);
  const selected = catalog[index] ?? catalog[5];

  const now = new Date(nowIso);
  const existingExpiry = baseExpiry ? new Date(baseExpiry) : null;
  const base =
    existingExpiry && existingExpiry.getTime() > now.getTime()
      ? existingExpiry
      : now;
  const visibleUntil = addCalendarMonths(base, selected.months);
  const durationLabel =
    selected.months === 1 ? "חודש אחד" : `${selected.months} חודשים`;

  return (
    <article className="brand-panel poster-hover relative overflow-hidden p-6 md:p-8">
      <div
        className="pointer-events-none absolute -left-10 -top-12 h-36 w-36 rounded-full bg-[#FFF3B0]/70 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#8A3618]">
              תשלום חד־פעמי · ללא חידוש אוטומטי
            </p>
            <h2 className="mt-2 font-display text-4xl text-[#17402D] md:text-5xl">
              לכמה זמן תרצו להופיע באתר?
            </h2>
          </div>
          {selected.months === 12 ? (
            <span className="pop-in inline-flex items-center gap-1.5 rounded-full border-2 border-[#8A3618] bg-[#C4552D] px-3 py-1.5 text-xs font-bold text-white shadow-[2px_2px_0_0_#8A3618]">
              <BadgeCheck className="h-4 w-4" /> הכי משתלם
            </span>
          ) : null}
        </div>

        <div className="mt-8" dir="ltr">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#17402D]">
            <span>1 month</span>
            <span>12 months</span>
          </div>
          <input
            aria-label="משך הפרסום בחודשים"
            className="duration-slider w-full"
            type="range"
            min={1}
            max={catalog.length}
            step={1}
            value={selected.months}
            onChange={(event) => setIndex(Number(event.target.value) - 1)}
          />
          <div className="mt-2 grid grid-cols-12 px-1" aria-hidden="true">
            {catalog.map((plan) => (
              <span
                key={plan.code}
                className={`mx-auto h-1.5 w-1.5 rounded-full transition-colors ${
                  plan.months <= selected.months ? "bg-[#C4552D]" : "bg-[#C3DCC9]"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mt-7 rounded-2xl border-2 border-[#17402D]/25 bg-[#FFFDF7] p-5 text-center">
          <p className="font-display text-4xl text-stone-950 md:text-5xl">
            {durationLabel} — ₪{selected.price / 100}
          </p>
          <p className="mt-1 text-sm font-bold text-stone-500">בתשלום חד־פעמי</p>
          <div className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full bg-[#DDEBE0] px-4 py-2 text-sm font-bold text-[#17402D]">
            <CalendarDays className="h-4 w-4" />
            העסק יוצג עד {formatDate(visibleUntil)}
          </div>
        </div>

        <ul className="mt-5 grid gap-2 text-sm text-stone-700 sm:grid-cols-3">
          {["מפה ורשימת עסקים", "תמונות, שעות וביקורות", "ללא מנוי או חיוב חוזר"].map(
            (item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#DDEBE0] text-[#17402D]">
                  <Check className="h-3 w-3" />
                </span>
                {item}
              </li>
            )
          )}
        </ul>

        <button
          type="button"
          onClick={() => onAction(selected)}
          disabled={disabled || loading}
          className="brand-button mt-7 inline-flex h-14 w-full items-center justify-center rounded-xl px-5 text-lg font-bold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "מעבירים לתשלום..." : `פרסום העסק ל־${durationLabel}`}
        </button>
        {baseExpiry && new Date(baseExpiry).getTime() > now.getTime() ? (
          <p className="mt-3 text-center text-xs text-stone-500">
            חידוש מוקדם מוסיף את הזמן לתאריך התפוגה הקיים.
          </p>
        ) : null}
      </div>
    </article>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
