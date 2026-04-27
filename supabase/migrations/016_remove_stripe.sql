-- Remove Stripe-specific columns and tables.
--
-- The subscription paywall machinery (subscription_status column on users,
-- and the user_is_subscribed() function used in RLS policies) is intentionally
-- kept — it is payment-provider-agnostic. Whichever new payment provider is
-- wired in next will set users.subscription_status = 'active' to grant access.
--
-- This migration drops:
--   1. users.stripe_customer_id   (Stripe-specific)
--   2. users.stripe_subscription_id (Stripe-specific)
--   3. processed_webhook_events table (Stripe webhook idempotence — no longer
--      needed; the new provider can recreate its own if required)

ALTER TABLE public.users DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE public.users DROP COLUMN IF EXISTS stripe_subscription_id;

DROP TABLE IF EXISTS public.processed_webhook_events;
