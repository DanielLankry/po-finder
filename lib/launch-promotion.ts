export const FIRST_BUSINESSES_PROMOTION_CODE = "first-20-3m";

export const FIRST_BUSINESSES_SIGNUP_PATH =
  "/auth/register?redirectTo=%2Fdashboard%2Fprofile%3Fcampaign%3Dfirst-20-3m";

export interface LaunchPromotionStatus {
  code: string;
  capacity: number;
  durationMonths: number;
  startsAt: string;
  enrollmentEndsAt: string;
  isOpen: boolean;
}
interface PromotionStatusRow {
  code: string;
  capacity: number;
  claimed_count: number;
  duration_months: number;
  starts_at: string;
  enrollment_ends_at: string;
  is_active: boolean;
}

/** Converts the database row into a public contract that hides live demand. */
export function toLaunchPromotionStatus(
  row: PromotionStatusRow,
  now = new Date(),
): LaunchPromotionStatus {
  const remaining = Math.max(0, row.capacity - row.claimed_count);
  const startsAt = Date.parse(row.starts_at);
  const enrollmentEndsAt = Date.parse(row.enrollment_ends_at);
  const nowTime = now.getTime();

  return {
    code: row.code,
    capacity: row.capacity,
    durationMonths: row.duration_months,
    startsAt: row.starts_at,
    enrollmentEndsAt: row.enrollment_ends_at,
    isOpen:
      row.is_active &&
      remaining > 0 &&
      Number.isFinite(startsAt) &&
      Number.isFinite(enrollmentEndsAt) &&
      nowTime >= startsAt &&
      nowTime <= enrollmentEndsAt,
  };
}
