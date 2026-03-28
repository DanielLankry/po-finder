export const PLANS = [
  { days: 1,   label: "יום",       price: 2000  },
  { days: 2,   label: "יומיים",    price: 3500  },
  { days: 3,   label: "3 ימים",    price: 4900  },
  { days: 5,   label: "5 ימים",    price: 7500  },
  { days: 7,   label: "שבוע",      price: 9900  },
  { days: 10,  label: "10 ימים",   price: 13000 },
  { days: 14,  label: "שבועיים",   price: 16900 },
  { days: 21,  label: "3 שבועות",  price: 22900 },
  { days: 30,  label: "חודש",      price: 2900  },
  { days: 60,  label: "חודשיים",   price: 4900  },
  { days: 90,  label: "3 חודשים",  price: 6500  },
  { days: 180, label: "חצי שנה",   price: 11000 },
  { days: 270, label: "9 חודשים",  price: 14900 },
  { days: 365, label: "שנה",       price: 18900 },
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
