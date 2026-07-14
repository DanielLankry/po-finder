export const PLAN_CODES = [
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
  months: number;
  days: number;
  boostDays: 0;
  label: string;
  price: number;
  isActive: boolean;
  maxRedemptions: null;
  requiresVerification: boolean;
};

const PRICES = [
  1000,
  1800,
  2500,
  3000,
  3500,
  4000,
  4400,
  4800,
  5100,
  5400,
  5700,
  6000,
] as const;

export const PLANS: Plan[] = PLAN_CODES.map((code, index) => {
  const months = index + 1;
  return {
    code,
    kind: "listing",
    months,
    days: months * 30,
    boostDays: 0,
    label: months === 1 ? "חודש אחד" : `${months} חודשים`,
    price: PRICES[index],
    isActive: true,
    maxRedemptions: null,
    requiresVerification: true,
  };
});

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
