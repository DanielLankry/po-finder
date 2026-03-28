export const PLANS = [
  { days: 1,   label: "יום",        price: 2900  },
  { days: 3,   label: "3 ימים",     price: 7900  },
  { days: 7,   label: "שבוע",       price: 17900 },
  { days: 14,  label: "שבועיים",    price: 29900 },
  { days: 30,  label: "חודש",       price: 49900 },
  { days: 60,  label: "חודשיים",    price: 89900 },
  { days: 90,  label: "3 חודשים",   price: 119900},
  { days: 180, label: "חצי שנה",    price: 199900},
  { days: 365, label: "שנה",        price: 349900},
] as const;

export type Plan = typeof PLANS[number];

export function getPlanByIndex(index: number): Plan {
  return PLANS[Math.max(0, Math.min(index, PLANS.length - 1))];
}

export function getPlanCount(): number {
  return PLANS.length;
}

// Legacy compatibility for checkout/webhook
export function getPriceForMonths(months: number): number {
  const days = Math.round(months * 30);
  const plan = [...PLANS].sort((a, b) =>
    Math.abs(a.days - days) - Math.abs(b.days - days)
  )[0];
  return plan.price;
}

export function getPricePerMonth(months: number): number {
  return Math.round(getPriceForMonths(months) / months);
}
