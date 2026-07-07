-- Pricing v2: yearly listing (₪15/365d) + monthly boost (₪20/30d).
-- Replaces the 30/60/90 duration ladder. Boost = extra visibility only,
-- never grants listing rights.

-- 0. plans table was never created by a migration (admin pricing editor
--    relied on it existing manually / falling back to static PLANS).
--    Create it here so the migration is self-sufficient.
CREATE TABLE IF NOT EXISTS public.plans (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sort_order integer NOT NULL DEFAULT 0,
  days integer NOT NULL CHECK (days > 0),
  label text NOT NULL,
  price integer NOT NULL CHECK (price > 0)
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
-- Reads/writes go through the service-role server only; no policies needed.

-- 1. plans: add kind, reseed to exactly two rows.
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'listing'
  CHECK (kind IN ('listing', 'boost'));

DELETE FROM public.plans;
INSERT INTO public.plans (sort_order, days, label, price, kind) VALUES
  (0, 365, 'רישום שנתי',  1500, 'listing'),
  (1, 30,  'קידום חודשי', 2000, 'boost');

-- 2. businesses: boost expiry. Boosted ⇔ boost_expires_at > now().
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS boost_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS businesses_boosted_idx
  ON public.businesses (boost_expires_at)
  WHERE boost_expires_at IS NOT NULL;

-- 3. payment_attempts: kind discriminator. Existing rows are listings.
ALTER TABLE public.payment_attempts
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'listing'
  CHECK (kind IN ('listing', 'boost'));

-- 4. Trigger consumes only unconsumed LISTING credits on business insert.
CREATE OR REPLACE FUNCTION public.consume_payment_for_business()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  attempt_id uuid;
  attempt_days integer;
BEGIN
  IF NEW.expires_at IS NOT NULL THEN
    RETURN NULL;
  END IF;

  SELECT id, plan_days
    INTO attempt_id, attempt_days
  FROM public.payment_attempts
  WHERE user_id = NEW.owner_id
    AND status = 'succeeded'
    AND kind = 'listing'
    AND business_id IS NULL
  ORDER BY completed_at DESC
  LIMIT 1;

  IF attempt_id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.businesses
     SET expires_at = now() + (attempt_days || ' days')::interval
   WHERE id = NEW.id;

  UPDATE public.payment_attempts
     SET business_id = NEW.id
   WHERE id = attempt_id;

  RETURN NULL;
END;
$$;

-- 5. Subscription predicate: only listing payments count.
CREATE OR REPLACE FUNCTION public.user_is_subscribed()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND subscription_status IN ('active', 'past_due')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.payment_attempts
      WHERE user_id = auth.uid()
      AND status = 'succeeded'
      AND kind = 'listing'
      AND business_id IS NULL
    )
    OR
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE owner_id = auth.uid()
      AND expires_at IS NOT NULL
      AND expires_at > now()
    );
$$;
