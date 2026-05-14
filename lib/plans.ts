export type Plan = { days: number; label: string; price: number };
export type PlanDays = number;

// Static fallback used when DB is unreachable.
export const PLANS: Plan[] = [
  { days: 30, label: "חודש",     price: 9900  },
  { days: 60, label: "חודשיים",  price: 19800 },
  { days: 90, label: "3 חודשים", price: 29700 },
];

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
