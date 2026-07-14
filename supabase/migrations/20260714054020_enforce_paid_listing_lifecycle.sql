-- Enforce one paid listing credit per business and make listing expiry the
-- single public-visibility boundary.
--
-- The production policies predated the payment-ledger migrations: any signed
-- in owner could insert a business, plan-controlled columns were client
-- writable, and approved rows stayed public after expires_at. This migration
-- closes those paths at the database layer so application filters are only a
-- second line of defense.

ALTER TABLE public.businesses
  ALTER COLUMN is_active SET DEFAULT false;

CREATE INDEX IF NOT EXISTS businesses_current_listing_idx
  ON public.businesses (expires_at)
  WHERE is_active = true;

-- Public discovery requires both admin approval and a current paid period.
DROP POLICY IF EXISTS "Anyone can read active businesses" ON public.businesses;
DROP POLICY IF EXISTS "Anyone can read current active businesses" ON public.businesses;

CREATE POLICY "Anyone can read current active businesses"
  ON public.businesses
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND expires_at IS NOT NULL
    AND expires_at > now()
  );

-- Owners keep access to pending and expired rows so they can renew them from
-- the dashboard, but ownership is explicit and scoped to authenticated users.
DROP POLICY IF EXISTS "Owners can read own businesses" ON public.businesses;

CREATE POLICY "Owners can read own businesses"
  ON public.businesses
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = owner_id);

-- A new listing is authorized only by an unconsumed successful listing
-- payment. An existing active business or a stale profile status cannot fund a
-- second listing.
CREATE OR REPLACE FUNCTION public.user_has_listing_credit()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT
    (SELECT auth.uid()) IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.payment_attempts
      WHERE user_id = (SELECT auth.uid())
        AND status = 'succeeded'
        AND kind = 'listing'
        AND business_id IS NULL
    );
$$;

REVOKE ALL ON FUNCTION public.user_has_listing_credit() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_has_listing_credit() TO authenticated;

-- Keep the legacy helper for schedule/photo policies, but base entitlement on
-- the payment ledger and current business periods instead of the indefinite
-- users.subscription_status flag.
CREATE OR REPLACE FUNCTION public.user_is_subscribed()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT
    public.user_has_listing_credit()
    OR EXISTS (
      SELECT 1
      FROM public.businesses
      WHERE owner_id = (SELECT auth.uid())
        AND expires_at IS NOT NULL
        AND expires_at > now()
    );
$$;

REVOKE ALL ON FUNCTION public.user_is_subscribed() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_is_subscribed() TO authenticated;

DROP POLICY IF EXISTS "Owners can insert own business" ON public.businesses;

CREATE POLICY "Owners can insert own paid business"
  ON public.businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = owner_id
    AND is_active = false
    AND expires_at IS NULL
    AND boost_expires_at IS NULL
    AND (SELECT public.user_has_listing_credit())
  );

-- Owners may maintain their own listing, including after expiry so they can
-- prepare it for renewal. Column grants below keep all entitlement and
-- moderation fields service-role-only.
DROP POLICY IF EXISTS "Owners can update own business" ON public.businesses;

CREATE POLICY "Owners can update own business profile"
  ON public.businesses
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = owner_id)
  WITH CHECK ((SELECT auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Owners can delete own business" ON public.businesses;

CREATE POLICY "Owners can delete own business"
  ON public.businesses
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = owner_id);

-- Remove broad browser grants, then opt into only the profile fields the owner
-- UI actually edits. Payment, approval, ratings, and boost fields remain
-- writable only through service-role server flows.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.businesses FROM anon;
REVOKE INSERT, UPDATE, TRUNCATE, REFERENCES, TRIGGER
  ON public.businesses FROM authenticated;

GRANT SELECT ON public.businesses TO anon, authenticated;
GRANT DELETE ON public.businesses TO authenticated;
GRANT INSERT (
  owner_id,
  name,
  description,
  category,
  address,
  lat,
  lng,
  weekly_hours,
  phone,
  whatsapp,
  website,
  instagram,
  kashrut,
  business_number,
  is_active
) ON public.businesses TO authenticated;
GRANT UPDATE (
  name,
  description,
  category,
  address,
  lat,
  lng,
  weekly_hours,
  phone,
  whatsapp,
  website,
  instagram,
  kashrut,
  business_number
) ON public.businesses TO authenticated;

-- Consume the credit under a row lock. If two inserts race for one payment,
-- the loser raises and its insert rolls back instead of receiving free access.
CREATE OR REPLACE FUNCTION public.consume_payment_for_business()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  attempt_id uuid;
  attempt_days integer;
BEGIN
  IF NEW.expires_at IS NOT NULL THEN
    RAISE EXCEPTION 'new listings must start without an expiry';
  END IF;

  SELECT id, plan_days
    INTO attempt_id, attempt_days
  FROM public.payment_attempts
  WHERE user_id = NEW.owner_id
    AND status = 'succeeded'
    AND kind = 'listing'
    AND business_id IS NULL
  ORDER BY completed_at DESC NULLS LAST, created_at DESC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF attempt_id IS NULL THEN
    RAISE EXCEPTION 'a valid unconsumed listing payment is required';
  END IF;

  UPDATE public.businesses
     SET expires_at = now() + make_interval(days => attempt_days)
   WHERE id = NEW.id;

  UPDATE public.payment_attempts
     SET business_id = NEW.id
   WHERE id = attempt_id
     AND business_id IS NULL;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_payment_for_business() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_consume_payment_for_business ON public.businesses;
CREATE TRIGGER trg_consume_payment_for_business
  AFTER INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.consume_payment_for_business();
