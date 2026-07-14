-- Preserve approved listings that predate expires_at while enforcing expiry
-- for every paid-ledger listing created by current application flows.
--
-- New owner inserts cannot set expires_at and the payment-consumption trigger
-- always fills it in before commit, so NULL identifies legacy/admin-curated
-- content rather than an unpaid self-service listing.

DROP POLICY IF EXISTS "Anyone can read current active businesses" ON public.businesses;
DROP POLICY IF EXISTS "Anyone can read visible businesses" ON public.businesses;

CREATE POLICY "Anyone can read visible businesses"
  ON public.businesses
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND (
      expires_at IS NULL
      OR expires_at > now()
    )
  );
