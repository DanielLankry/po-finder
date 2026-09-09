-- DAN-264 rollback candidate.
-- Run only through the normal approved migration process.

BEGIN;

DROP INDEX IF EXISTS public.favorites_business_id_idx;
DROP INDEX IF EXISTS public.photos_business_id_idx;
DROP INDEX IF EXISTS public.reviews_user_id_idx;

DROP POLICY IF EXISTS "Users can read own row" ON public.users;
CREATE POLICY "Users can read own row"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own row" ON public.users;
CREATE POLICY "Users can update own row"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow insert on signup" ON public.users;
CREATE POLICY "Allow insert on signup"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users manage own favorites" ON public.favorites;
CREATE POLICY "Users manage own favorites"
  ON public.favorites
  FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners read own payment attempts" ON public.payment_attempts;
CREATE POLICY "Owners read own payment attempts"
  ON public.payment_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read visible or owned businesses"
  ON public.businesses;

CREATE POLICY "Anyone can read visible businesses"
  ON public.businesses
  FOR SELECT
  TO anon, authenticated
  USING (
    is_verified = true
    AND is_active = true
    AND (
      is_legacy_public = true
      OR expires_at > now()
    )
  );

CREATE POLICY "Owners can read own businesses"
  ON public.businesses
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = owner_id);

CREATE INDEX IF NOT EXISTS idx_business_events_business_id
  ON public.business_events (business_id);

COMMIT;
