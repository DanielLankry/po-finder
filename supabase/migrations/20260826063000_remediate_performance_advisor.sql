-- Remediate the Supabase performance-advisor findings that are supported by
-- production catalog and EXPLAIN evidence captured for DAN-264.

-- Each foreign key needs an index whose leading column matches the referenced
-- parent key. The existing unique indexes on favorites (user_id, business_id)
-- and reviews (business_id, user_id) cannot efficiently support standalone
-- lookups or cascades by their trailing columns.
CREATE INDEX IF NOT EXISTS favorites_business_id_idx
  ON public.favorites (business_id);

CREATE INDEX IF NOT EXISTS photos_business_id_idx
  ON public.photos (business_id);

CREATE INDEX IF NOT EXISTS reviews_user_id_idx
  ON public.reviews (user_id);

-- Keep auth.uid() as an init plan instead of evaluating it once per candidate
-- row. These ownership policies already reject anonymous callers because
-- auth.uid() is NULL, so scoping them to authenticated keeps access behavior
-- unchanged while avoiding unnecessary policy evaluation for anon.
DROP POLICY IF EXISTS "Users can read own row" ON public.users;
CREATE POLICY "Users can read own row"
  ON public.users
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own row" ON public.users;
CREATE POLICY "Users can update own row"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Allow insert on signup" ON public.users;
CREATE POLICY "Allow insert on signup"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users manage own favorites" ON public.favorites;
CREATE POLICY "Users manage own favorites"
  ON public.favorites
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Owners read own payment attempts" ON public.payment_attempts;
CREATE POLICY "Owners read own payment attempts"
  ON public.payment_attempts
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- One permissive policy preserves the OR semantics of the previous public and
-- owner SELECT policies without evaluating two policies for authenticated rows.
DROP POLICY IF EXISTS "Anyone can read visible businesses" ON public.businesses;
DROP POLICY IF EXISTS "Owners can read own businesses" ON public.businesses;

CREATE POLICY "Anyone can read visible or owned businesses"
  ON public.businesses
  FOR SELECT
  TO anon, authenticated
  USING (
    (
      is_verified = true
      AND is_active = true
      AND (
        is_legacy_public = true
        OR expires_at > now()
      )
    )
    OR (SELECT auth.uid()) = owner_id
  );

-- On production PostgreSQL 17.6, the live business_id plan uses the longer
-- (business_id, event_date, start_time) index. Both longer indexes keep the
-- same leading column and continue to cover the foreign key after this drop.
DROP INDEX IF EXISTS public.idx_business_events_business_id;
