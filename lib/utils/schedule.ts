import type { BusinessSchedule } from "@/lib/types";

/**
 * Returns true if the given schedule is currently open (Asia/Jerusalem timezone).
 */
export function isOpenNow(schedule: BusinessSchedule | null): boolean {
  if (!schedule || !schedule.open_time || !schedule.close_time) return false;

  const nowStr = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jerusalem",
  });

  return nowStr >= schedule.open_time.slice(0, 5) && nowStr <= schedule.close_time.slice(0, 5);
}

/**
 * Returns today's date string in YYYY-MM-DD format (Israel timezone).
 */
export function getTodayDateString(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
}
