export const EXPIRY_REMINDER_DAYS = [30, 7, 1] as const;

export type ExpiryReminderDay = (typeof EXPIRY_REMINDER_DAYS)[number];

const DAY_MS = 86_400_000;

/** Returns the daily UTC window for one reminder threshold.
 * A 24-hour window lets the cron run once daily without minute-level coupling.
 */
export function getExpiryReminderWindow(
  now: Date,
  daysBefore: ExpiryReminderDay
): { start: Date; end: Date } {
  const start = new Date(now.getTime() + daysBefore * DAY_MS);
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

/** Checks one expiry against a reminder window for focused regression tests. */
export function isExpiryInReminderWindow(
  expiresAt: Date,
  now: Date,
  daysBefore: ExpiryReminderDay
): boolean {
  const { start, end } = getExpiryReminderWindow(now, daysBefore);
  return expiresAt >= start && expiresAt < end;
}
