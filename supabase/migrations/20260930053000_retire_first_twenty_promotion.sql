-- Retire public acquisition for the launch promotion without invalidating
-- reservations or activation periods already promised to existing owners.
-- The reservation trigger checks this flag before granting any new place.
UPDATE public.promotion_campaigns
SET is_active = false,
    updated_at = now()
WHERE code = 'first-20-3m';
