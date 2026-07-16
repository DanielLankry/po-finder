import type {
  BusinessHoursStatus,
  BusinessSchedule,
  BusinessWithSchedule,
  WeeklyScheduleEntry,
} from "@/lib/types";

export type BusinessAvailability = "open" | "closed" | "unknown";

export interface IsraelDateContext {
  date: string;
  dayOfWeek: number;
  previousDate: string;
  previousDayOfWeek: number;
  time: string;
}

interface EffectiveScheduleInput {
  now?: Date;
  todayDate: string;
  previousDate: string;
  todayDaily?: BusinessSchedule;
  previousDaily?: BusinessSchedule;
  todayWeekly?: WeeklyScheduleEntry;
  previousWeekly?: WeeklyScheduleEntry;
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Converts a database time value into minutes after local midnight. */
function timeToMinutes(value: string): number {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

/** Rejects partial and blank hour pairs before time comparisons. */
function hasCompleteHours(
  schedule: Pick<BusinessSchedule, "open_time" | "close_time">,
): schedule is Pick<BusinessSchedule, "open_time" | "close_time"> & {
  open_time: string;
  close_time: string;
} {
  return Boolean(schedule.open_time && schedule.close_time);
}

/** Formats one instant in Israel without turning localized text back into a Date. */
function formatIsraelParts(now: Date): {
  date: string;
  dayOfWeek: number;
  time: string;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    dayOfWeek: WEEKDAY_INDEX[values.weekday],
    time: `${values.hour}:${values.minute}`,
  };
}

/** Gives a weekly row a concrete start date for date-aware overnight logic. */
function weeklyToDaily(
  weekly: WeeklyScheduleEntry,
  date: string,
): BusinessSchedule {
  return {
    id: weekly.id,
    business_id: weekly.business_id,
    date,
    address: weekly.address,
    lat: weekly.lat,
    lng: weekly.lng,
    open_time: weekly.open_time,
    close_time: weekly.close_time,
    note: weekly.note,
    created_at: weekly.created_at,
  };
}

/** Classifies stored hours before evaluating whether the current time is open. */
function sourceStatus(
  source: BusinessSchedule | WeeklyScheduleEntry | undefined,
): BusinessHoursStatus {
  if (!source) return "unknown";
  if ("is_active" in source && !source.is_active) return "closed";
  return hasCompleteHours(source) ? "scheduled" : "closed";
}

/**
 * Returns Israel's current and previous calendar context without reparsing a
 * localized timestamp. This stays correct on UTC hosts and across DST changes.
 */
export function getIsraelDateContext(now: Date = new Date()): IsraelDateContext {
  const current = formatIsraelParts(now);
  const previous = formatIsraelParts(new Date(now.getTime() - 24 * 60 * 60 * 1000));

  return {
    ...current,
    previousDate: previous.date,
    previousDayOfWeek: previous.dayOfWeek,
  };
}

/**
 * Resolves daily overrides and weekly hours, including an overnight interval
 * that began on the previous Israel calendar day.
 */
export function resolveEffectiveSchedule({
  now = new Date(),
  todayDate,
  previousDate,
  todayDaily,
  previousDaily,
  todayWeekly,
  previousWeekly,
}: EffectiveScheduleInput): {
  schedule: BusinessSchedule | null;
  hoursStatus: BusinessHoursStatus;
} {
  const todaySource = todayDaily ?? todayWeekly;
  const previousSource = previousDaily ?? previousWeekly;
  const todaySchedule = todaySource
    ? "day_of_week" in todaySource
      ? weeklyToDaily(todaySource, todayDate)
      : todaySource
    : null;
  const previousSchedule = previousSource
    ? "day_of_week" in previousSource
      ? weeklyToDaily(previousSource, previousDate)
      : previousSource
    : null;
  const previousStatus = sourceStatus(previousSource);

  if (
    previousSchedule &&
    previousStatus === "scheduled" &&
    getScheduleAvailability(previousSchedule, now) === "open"
  ) {
    return { schedule: previousSchedule, hoursStatus: "scheduled" };
  }

  return {
    schedule: todaySchedule,
    hoursStatus: sourceStatus(todaySource),
  };
}

/**
 * Returns the current state of a dated schedule. Closing time is exclusive;
 * overnight hours are assigned to the day on which they begin.
 */
export function getScheduleAvailability(
  schedule: BusinessSchedule | null,
  now: Date = new Date(),
): BusinessAvailability {
  if (!schedule) return "unknown";
  if (!hasCompleteHours(schedule)) return "closed";

  const context = getIsraelDateContext(now);
  const currentMinutes = timeToMinutes(context.time);
  const openMinutes = timeToMinutes(schedule.open_time);
  const closeMinutes = timeToMinutes(schedule.close_time);

  if (openMinutes === closeMinutes) return "closed";

  if (openMinutes < closeMinutes) {
    if (schedule.date !== context.date) return "closed";
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes
      ? "open"
      : "closed";
  }

  if (schedule.date === context.date) {
    return currentMinutes >= openMinutes ? "open" : "closed";
  }
  if (schedule.date === context.previousDate) {
    return currentMinutes < closeMinutes ? "open" : "closed";
  }
  return "closed";
}

/** Returns open, closed, or unknown using the API's explicit hours state. */
export function getBusinessAvailability(
  business: Pick<BusinessWithSchedule, "today_schedule" | "hours_status">,
  now: Date = new Date(),
): BusinessAvailability {
  if (business.hours_status === "unknown") return "unknown";
  if (business.hours_status === "closed") return "closed";
  return getScheduleAvailability(business.today_schedule ?? null, now);
}

/**
 * Returns true if the given schedule is currently open (Asia/Jerusalem timezone).
 */
export function isOpenNow(
  schedule: BusinessSchedule | null,
  now: Date = new Date(),
): boolean {
  return getScheduleAvailability(schedule, now) === "open";
}

/**
 * Returns today's date string in YYYY-MM-DD format (Israel timezone).
 */
export function getTodayDateString(): string {
  return getIsraelDateContext().date;
}
