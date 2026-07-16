-- Add the missing two-day and three-day choices to the one-time catalog.
-- Exact-day entitlements keep duration_months NULL and are handled by the
-- existing settlement and refund snapshot functions.

INSERT INTO public.plans (
  sort_order,
  code,
  kind,
  days,
  duration_months,
  boost_days,
  label,
  price,
  is_active,
  max_redemptions,
  requires_verification
) VALUES
  (100, 'listing_2d', 'listing', 2, NULL, 0, 'יומיים', 500, true, NULL, true),
  (101, 'listing_3d', 'listing', 3, NULL, 0, '3 ימים', 600, true, NULL, true)
ON CONFLICT (code) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  kind = EXCLUDED.kind,
  days = EXCLUDED.days,
  duration_months = EXCLUDED.duration_months,
  boost_days = EXCLUDED.boost_days,
  label = EXCLUDED.label,
  price = EXCLUDED.price,
  is_active = true,
  max_redemptions = NULL,
  requires_verification = true;

UPDATE public.plans
SET sort_order = CASE code
  WHEN 'listing_1d' THEN 99
  WHEN 'listing_2d' THEN 100
  WHEN 'listing_3d' THEN 101
  WHEN 'listing_7d' THEN 102
  WHEN 'listing_1m' THEN 103
  WHEN 'listing_2m' THEN 104
  WHEN 'listing_3m' THEN 105
  WHEN 'listing_4m' THEN 106
  WHEN 'listing_5m' THEN 107
  WHEN 'listing_6m' THEN 108
  WHEN 'listing_7m' THEN 109
  WHEN 'listing_8m' THEN 110
  WHEN 'listing_9m' THEN 111
  WHEN 'listing_10m' THEN 112
  WHEN 'listing_11m' THEN 113
  WHEN 'listing_12m' THEN 114
  ELSE sort_order
END
WHERE code IN (
  'listing_1d', 'listing_2d', 'listing_3d', 'listing_7d',
  'listing_1m', 'listing_2m', 'listing_3m', 'listing_4m',
  'listing_5m', 'listing_6m', 'listing_7m', 'listing_8m',
  'listing_9m', 'listing_10m', 'listing_11m', 'listing_12m'
);
