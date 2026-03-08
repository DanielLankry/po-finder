import type { WeeklyHours } from "@/lib/types";
import { HEBREW_DAYS } from "@/lib/types";

interface HoursCardProps {
  weeklyHours: WeeklyHours | null;
}

const DAY_ORDER = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function getTodayKey(): string {
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return days[new Date().getDay()];
}

export default function HoursCard({ weeklyHours }: HoursCardProps) {
  const today = getTodayKey();

  if (!weeklyHours || Object.keys(weeklyHours).length === 0) {
    return null;
  }

  return (
    <div className="border border-slate-200 rounded-2xl p-5" dir="rtl">
      <h3 className="font-display font-bold text-base text-slate-900 mb-4">
        שעות פעילות
      </h3>
      <div className="space-y-1.5">
        {DAY_ORDER.map((day, i) => {
          const hours = weeklyHours[day as keyof WeeklyHours];
          const isToday = day === today;

          return (
            <div
              key={day}
              className={`flex items-center justify-between text-sm py-1.5 px-2 rounded-lg transition-colors fade-in-up stagger-${Math.min(i + 1, 6)} ${
                isToday
                  ? "font-semibold text-blue-700 bg-blue-50"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2">
                {isToday && (
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 flex-shrink-0" aria-hidden="true" />
                )}
                {HEBREW_DAYS[day]}
              </span>
              <span className="tabular-nums">
                {hours ? `${hours.open} – ${hours.close}` : "סגור"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
