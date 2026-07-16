export const PLAN_CODES = [
  "listing_1d",
  "listing_2d",
  "listing_3d",
  "listing_7d",
  "listing_1m",
  "listing_2m",
  "listing_3m",
  "listing_4m",
  "listing_5m",
  "listing_6m",
  "listing_7m",
  "listing_8m",
  "listing_9m",
  "listing_10m",
  "listing_11m",
  "listing_12m",
] as const;

export type PlanCode = (typeof PLAN_CODES)[number];
export type PlanKind = "listing" | "boost";
export type PlanDays = number;

export type Plan = {
  code: PlanCode;
  kind: "listing";
  months: number | null;
  days: number;
  boostDays: 0;
  label: string;
  price: number;
  isActive: boolean;
  maxRedemptions: null;
  requiresVerification: boolean;
};

const CATALOG = [
  { code: "listing_1d", months: null, days: 1, label: "יום אחד", price: 300 },
  { code: "listing_2d", months: null, days: 2, label: "יומיים", price: 500 },
  { code: "listing_3d", months: null, days: 3, label: "3 ימים", price: 600 },
  { code: "listing_7d", months: null, days: 7, label: "שבוע אחד", price: 800 },
  { code: "listing_1m", months: 1, days: 30, label: "חודש אחד", price: 1100 },
  { code: "listing_2m", months: 2, days: 60, label: "2 חודשים", price: 1900 },
  { code: "listing_3m", months: 3, days: 90, label: "3 חודשים", price: 2600 },
  { code: "listing_4m", months: 4, days: 120, label: "4 חודשים", price: 3100 },
  { code: "listing_5m", months: 5, days: 150, label: "5 חודשים", price: 3600 },
  { code: "listing_6m", months: 6, days: 180, label: "6 חודשים", price: 4100 },
  { code: "listing_7m", months: 7, days: 210, label: "7 חודשים", price: 4500 },
  { code: "listing_8m", months: 8, days: 240, label: "8 חודשים", price: 4900 },
  { code: "listing_9m", months: 9, days: 270, label: "9 חודשים", price: 5200 },
  { code: "listing_10m", months: 10, days: 300, label: "10 חודשים", price: 5500 },
  { code: "listing_11m", months: 11, days: 330, label: "11 חודשים", price: 5800 },
  { code: "listing_12m", months: 12, days: 360, label: "12 חודשים", price: 6100 },
] as const satisfies ReadonlyArray<{
  code: PlanCode;
  months: number | null;
  days: number;
  label: string;
  price: number;
}>;

export const PLANS: Plan[] = CATALOG.map((plan) => ({
  ...plan,
  kind: "listing",
  boostDays: 0,
  isActive: true,
  maxRedemptions: null,
  requiresVerification: true,
}));

export function getPlanByCode(plans: Plan[], code: PlanCode): Plan | undefined {
  return plans.find((plan) => plan.code === code);
}

export function getPlanByIndex(plans: Plan[], index: number): Plan {
  return plans[Math.max(0, Math.min(index, plans.length - 1))];
}

export function getPlanCount(plans: Plan[]): number {
  return plans.length;
}

export function getPriceForDays(plans: Plan[], days: number): number {
  return (
    [...plans].sort(
      (a, b) => Math.abs(a.days - days) - Math.abs(b.days - days)
    )[0]?.price ?? plans[0]?.price ?? 0
  );
}

/** Return the user-facing duration without deriving weeks from month estimates. */
export function getPlanDurationLabel(plan: Pick<Plan, "days" | "months">): string {
  if (plan.months === 1) return "חודש אחד";
  if (plan.months) return `${plan.months} חודשים`;
  if (plan.days === 1) return "יום אחד";
  if (plan.days === 2) return "יומיים";
  if (plan.days === 7) return "שבוע אחד";
  return `${plan.days} ימים`;
}

/** Add calendar months while clamping to the final valid day of the target month. */
export function addCalendarMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)
  ).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

/** Mirror the database entitlement arithmetic for day, week, and month plans. */
export function addPlanDuration(
  date: Date,
  plan: Pick<Plan, "days" | "months">
): Date {
  if (plan.months) return addCalendarMonths(date, plan.months);
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + plan.days);
  return result;
}
