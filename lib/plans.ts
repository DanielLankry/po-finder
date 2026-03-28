// Smooth pricing curve: ₪20/day → ₪500/year
// Each tier gives better value the longer you commit
export const PLANS = [
  { days: 1,   label: "יום",       price: 2000  },  // ₪20
  { days: 2,   label: "יומיים",    price: 3500  },  // ₪35
  { days: 3,   label: "3 ימים",    price: 5000  },  // ₪50
  { days: 5,   label: "5 ימים",    price: 7500  },  // ₪75
  { days: 7,   label: "שבוע",      price: 10000 },  // ₪100
  { days: 10,  label: "10 ימים",   price: 13000 },  // ₪130
  { days: 14,  label: "שבועיים",   price: 17000 },  // ₪170
  { days: 21,  label: "3 שבועות",  price: 22000 },  // ₪220
  { days: 30,  label: "חודש",      price: 27000 },  // ₪270
  { days: 60,  label: "חודשיים",   price: 35000 },  // ₪350
  { days: 90,  label: "3 חודשים",  price: 40000 },  // ₪400
  { days: 180, label: "חצי שנה",   price: 45000 },  // ₪450
  { days: 270, label: "9 חודשים",  price: 48000 },  // ₪480
  { days: 365, label: "שנה",       price: 50000 },  // ₪500
] as const;

export type Plan = (typeof PLANS)[number];
export type PlanDays = Plan["days"];

export function getPlanByIndex(index: number): Plan {
  return PLANS[Math.max(0, Math.min(index, PLANS.length - 1))];
}

export function getPlanCount(): number {
  return PLANS.length;
}

export function getPriceForMonths(months: number): number {
  const days = Math.round(months * 30);
  return [...PLANS].sort((a, b) =>
    Math.abs(a.days - days) - Math.abs(b.days - days)
  )[0].price;
}

export function getPricePerMonth(months: number): number {
  return Math.round(getPriceForMonths(months) / months);
}
