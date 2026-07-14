-- Run after the duration-slider application deployment is live.
-- Historical attempts keep their immutable product_code through the FK, while
-- no retired plan can be selected for a new checkout.

UPDATE public.plans
SET is_active = false
WHERE code NOT IN (
  'listing_1m',
  'listing_2m',
  'listing_3m',
  'listing_4m',
  'listing_5m',
  'listing_6m',
  'listing_7m',
  'listing_8m',
  'listing_9m',
  'listing_10m',
  'listing_11m',
  'listing_12m'
);
