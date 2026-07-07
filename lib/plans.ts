export type PlanKind = "listing" | "boost";
export type Plan = { kind: PlanKind; days: number; label: string; price: number };
export type PlanDays = number;

// Static fallback used when DB is unreachable.
export const PLANS: Plan[] = [
  { kind: "listing", days: 365, label: "רישום שנתי",  price: 1500 },
  { kind: "boost",   days: 30,  label: "קידום חודשי", price: 2000 },
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
