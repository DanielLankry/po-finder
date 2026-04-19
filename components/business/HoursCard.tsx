import type { WeeklyHours, WeeklyScheduleEntry } from "@/lib/types";
import { HEBREW_DAYS } from "@/lib/types";

interface HoursCardProps {
  weeklyHours?: WeeklyHours | null;
  weeklySchedule?: WeeklyScheduleEntry[] | null;
}

const DAY_ORDER = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const DOW_TO_KEY: Record<number, string> = {
  0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat",
};

function getTodayKey(): string {
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return days[new Date().getDay()];
}

export default function HoursCard({ weeklyHours, weeklySchedule }: HoursCardProps) {
  const today = getTodayKey();

  // Build a normalised map: day-key → { open, close, note }
  const hours: Record<string, { open: string; close: string; note?: string | null } | null> = {};

  if (weeklySchedule && weeklySchedule.length > 0) {
    for (const entry of weeklySchedule) {
      const key = DOW_TO_KEY[entry.day_of_week];
      if (!key) continue;
      if (!entry.is_active) {
        hours[key] = null; // closed
      } else {
        hours[key] = {
          open: entry.open_time?.slice(0, 5) ?? "",
          close: entry.close_time?.slice(0, 5) ?? "",
          note: entry.note,
        };
      }
    }
  } else if (weeklyHours && Object.keys(weeklyHours).length > 0) {
    for (const day of DAY_ORDER) {
      const h = weeklyHours[day as keyof WeeklyHours];
      hours[day] = h ? { open: h.open, close: h.close } : null;
    }
  } else {
    return null;
  }

  return (
    <div className="border border-slate-200 rounded-2xl p-5" dir="rtl">
      <h3 className="font-display font-bold text-base text-slate-900 mb-4">
        שעות פעילות
      </h3>
      <div className="space-y-1.5">
        {DAY_ORDER.map((day, i) => {
          const h = hours[day];
          const isToday = day === today;

          return (
            <div
              key={day}
              className={`flex items-center justify-between text-sm py-1.5 px-2 rounded-lg transition-colors fade-in-up stagger-${Math.min(i + 1, 6)} ${
                isToday
                  ? "font-semibold text-[#047857] bg-[#ECFDF5]"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2">
                {isToday && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#059669] flex-shrink-0" aria-hidden="true" />
                )}
                {HEBREW_DAYS[day]}
              </span>
              <span className="tabular-nums flex items-center gap-1.5">
                {h ? (
                  <>
                    {h.open} – {h.close}
                    {h.note && (
                      <span className="text-xs text-slate-400 font-normal hidden sm:inline">({h.note})</span>
                    )}
                  </>
                ) : (
                  "סגור"
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
