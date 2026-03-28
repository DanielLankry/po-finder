export const PRICING_PLANS = [
  { months: 1,  price: 2900  },
  { months: 2,  price: 4900  },
  { months: 3,  price: 6500  },
  { months: 4,  price: 8400  },
  { months: 5,  price: 9900  },
  { months: 6,  price: 11000 },
  { months: 7,  price: 12500 },
  { months: 8,  price: 14000 },
  { months: 9,  price: 14900 },
  { months: 10, price: 16500 },
  { months: 11, price: 17800 },
  { months: 12, price: 18900 },
] as const;

export type PricingPlan = typeof PRICING_PLANS[number];

export function getPriceForMonths(months: number): number {
  const exact = PRICING_PLANS.find(p => p.months === months);
  if (exact) return exact.price;
  // Linear interpolation between known points
  const lower = [...PRICING_PLANS].reverse().find(p => p.months < months);
  const upper = PRICING_PLANS.find(p => p.months > months);
  if (!lower || !upper) return PRICING_PLANS[0].price;
  const ratio = (months - lower.months) / (upper.months - lower.months);
  return Math.round(lower.price + ratio * (upper.price - lower.price));
}

export function getPricePerMonth(months: number): number {
  return Math.round(getPriceForMonths(months) / months);
}
