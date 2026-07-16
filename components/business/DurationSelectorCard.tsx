"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, CalendarDays, Check } from "lucide-react";
import {
  PLAN_CODES,
  PLANS,
  addPlanDuration,
  getPlanByCode,
  getPlanDurationLabel,
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

/** Renders every listing duration as one continuous, synchronized slider.
 * The database owns final entitlement dates; this UTC preview mirrors its day
 * and calendar-month arithmetic so owners see the date they are buying while
 * short-day, week, and month plans remain part of the same interaction.
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
  const initialPlan =
    getPlanByCode(catalog, initialCode) ??
    getPlanByCode(catalog, "listing_6m") ??
    catalog[0];
  const [selectedCode, setSelectedCode] = useState<PlanCode>(initialPlan.code);
  const selected = getPlanByCode(catalog, selectedCode) ?? initialPlan;
  const selectedIndex = Math.max(
    0,
    catalog.findIndex((plan) => plan.code === selected.code)
  );
  // Derive label positions from the catalog so the visual scale stays correct
  // when exact-day plans are added without turning labels into separate controls.
  const weekIndex = catalog.findIndex(
    (plan) => plan.months === null && plan.days === 7
  );
  const firstMonthIndex = catalog.findIndex((plan) => plan.months === 1);
  const shortDayCount = catalog.filter(
    (plan) => plan.months === null && plan.days < 7
  ).length;

  const now = new Date(nowIso);
  const existingExpiry = baseExpiry ? new Date(baseExpiry) : null;
  const base =
    existingExpiry && existingExpiry.getTime() > now.getTime()
      ? existingExpiry
      : now;
  const visibleUntil = addPlanDuration(base, selected);
  const durationLabel = getPlanDurationLabel(selected);

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
          {selected.code === "listing_12m" ? (
            <span className="pop-in inline-flex items-center gap-1.5 rounded-full border-2 border-[#8A3618] bg-[#C4552D] px-3 py-1.5 text-xs font-bold text-white shadow-[2px_2px_0_0_#8A3618]">
              <BadgeCheck className="h-4 w-4" /> הכי משתלם
            </span>
          ) : null}
        </div>

        <div className="mt-8 rounded-2xl border-2 border-[#17402D]/20 bg-[#FFFDF7]/85 p-4 sm:p-5" dir="ltr">
          <div
            data-testid="duration-scale-labels"
            className="mb-2 grid items-end px-1 text-[10px] font-bold text-[#17402D] sm:text-xs"
            style={{ gridTemplateColumns: `repeat(${catalog.length}, minmax(0, 1fr))` }}
            aria-hidden="true"
          >
            <span
              className="whitespace-nowrap text-start text-[#8A3618]"
              style={{ gridColumn: `1 / span ${Math.max(weekIndex, 1)}` }}
              dir="rtl"
            >
              {shortDayCount > 1 ? "1–3 ימים" : "יום"}
            </span>
            <span
              className="whitespace-nowrap text-center text-[#8A3618]"
              style={{ gridColumn: `${weekIndex + 1}` }}
              dir="rtl"
            >
              שבוע
            </span>
            <span
              className="text-center"
              style={{
                gridColumn: `${firstMonthIndex + 1} / span ${Math.max(
                  catalog.length - firstMonthIndex - 1,
                  1
                )}`,
              }}
              dir="rtl"
            >
              חודשים
            </span>
            <span
              className="whitespace-nowrap text-end"
              style={{ gridColumn: `${catalog.length}` }}
              dir="rtl"
            >
              12 חודשים
            </span>
          </div>
          <input
            aria-label="משך הפרסום"
            className="duration-slider w-full"
            type="range"
            min={0}
            max={catalog.length - 1}
            step={1}
            value={selectedIndex}
            onChange={(event) => {
              const plan = catalog[Number(event.target.value)];
              if (plan) setSelectedCode(plan.code);
            }}
          />
          <div
            className="mt-3 grid px-1"
            style={{ gridTemplateColumns: `repeat(${catalog.length}, minmax(0, 1fr))` }}
            aria-hidden="true"
          >
            {catalog.map((plan, index) => (
              <span
                key={plan.code}
                className={`mx-auto rounded-full transition-all ${
                  index <= selectedIndex
                    ? index < 4
                      ? "h-2.5 w-2.5 bg-[#C4552D]"
                      : "h-2 w-2 bg-[#2D6A4F]"
                    : "h-1.5 w-1.5 bg-[#C3DCC9]"
                }`}
              />
            ))}
          </div>
          <p className="mt-3 text-center text-xs font-bold text-[#17402D]/65" dir="rtl">
            יום אחד · יומיים · 3 ימים · שבוע · 1–12 חודשים
          </p>
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
