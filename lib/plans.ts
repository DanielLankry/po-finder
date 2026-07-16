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

export const MIN_LISTING_PRICE_AGOROT = 2_000;
export const MAX_LISTING_PRICE_AGOROT = 25_000;

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

export type PlanCandidate = Omit<Plan, "kind" | "boostDays" | "maxRedemptions"> & {
  kind: PlanKind;
  boostDays: number;
  maxRedemptions: number | null;
};

const CATALOG = [
  { code: "listing_1d", months: null, days: 1, label: "יום אחד", price: 2_000 },
  { code: "listing_2d", months: null, days: 2, label: "יומיים", price: 2_500 },
  { code: "listing_3d", months: null, days: 3, label: "3 ימים", price: 3_000 },
  { code: "listing_7d", months: null, days: 7, label: "שבוע אחד", price: 4_000 },
  { code: "listing_1m", months: 1, days: 30, label: "חודש אחד", price: 6_000 },
  { code: "listing_2m", months: 2, days: 60, label: "2 חודשים", price: 8_000 },
  { code: "listing_3m", months: 3, days: 90, label: "3 חודשים", price: 10_000 },
  { code: "listing_4m", months: 4, days: 120, label: "4 חודשים", price: 12_000 },
  { code: "listing_5m", months: 5, days: 150, label: "5 חודשים", price: 14_000 },
  { code: "listing_6m", months: 6, days: 180, label: "6 חודשים", price: 16_000 },
  { code: "listing_7m", months: 7, days: 210, label: "7 חודשים", price: 17_500 },
  { code: "listing_8m", months: 8, days: 240, label: "8 חודשים", price: 19_000 },
  { code: "listing_9m", months: 9, days: 270, label: "9 חודשים", price: 20_500 },
  { code: "listing_10m", months: 10, days: 300, label: "10 חודשים", price: 22_000 },
  { code: "listing_11m", months: 11, days: 330, label: "11 חודשים", price: 23_500 },
  { code: "listing_12m", months: 12, days: 360, label: "12 חודשים", price: 25_000 },
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

/**
 * Validates the complete duration ladder before an admin price update.
 * Keeping catalog, bounds, whole-shekel prices, and ordering in one check
 * prevents the UI and API from accepting configurations the database rejects.
 */
export function isValidPlanPriceLadder(
  plans: ReadonlyArray<Pick<Plan, "code" | "price">>
): boolean {
  if (plans.length !== PLAN_CODES.length) return false;

  const plansByCode = new Map(plans.map((plan) => [plan.code, plan]));
  if (plansByCode.size !== PLAN_CODES.length) return false;

  const orderedPlans = PLAN_CODES.map((code) => plansByCode.get(code));
  return orderedPlans.every((plan, index) => {
    if (!plan) return false;
    if (!Number.isInteger(plan.price) || plan.price % 100 !== 0) return false;
    if (
      plan.price < MIN_LISTING_PRICE_AGOROT ||
      plan.price > MAX_LISTING_PRICE_AGOROT
    ) {
      return false;
    }
    return index === 0 || plan.price > orderedPlans[index - 1]!.price;
  });
}

/**
 * Accepts database pricing only when the complete immutable catalog and the
 * launch price ladder are valid. Falling back as one catalog avoids mixing a
 * partially migrated database with newer application defaults.
 */
export function resolvePlanCatalog(candidates: ReadonlyArray<PlanCandidate>): Plan[] {
  if (candidates.length !== PLAN_CODES.length) {
    return PLANS.map((plan) => ({ ...plan }));
  }

  const candidatesByCode = new Map(candidates.map((plan) => [plan.code, plan]));
  if (candidatesByCode.size !== PLAN_CODES.length) {
    return PLANS.map((plan) => ({ ...plan }));
  }

  const ordered = PLANS.map((fallback) => candidatesByCode.get(fallback.code));
  const hasValidProducts = ordered.every((plan, index) => {
    const fallback = PLANS[index];
    return Boolean(
      plan &&
        plan.kind === "listing" &&
        plan.days === fallback.days &&
        plan.months === fallback.months &&
        plan.boostDays === 0 &&
        plan.isActive &&
        plan.maxRedemptions === null &&
        plan.requiresVerification
    );
  });

  if (!hasValidProducts || !isValidPlanPriceLadder(ordered as PlanCandidate[])) {
    return PLANS.map((plan) => ({ ...plan }));
  }

  return (ordered as PlanCandidate[]).map((plan) => ({
    ...plan,
    kind: "listing",
    boostDays: 0,
    maxRedemptions: null,
  }));
}

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
