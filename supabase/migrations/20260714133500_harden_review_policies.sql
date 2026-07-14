-- Keep public review reads while requiring a signed-in user for every write.
-- Legacy migrations granted the anonymous role every table privilege and also
-- allowed rows with a NULL user_id, which bypassed the application review API.

DROP POLICY IF EXISTS "Anyone can insert review" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can insert one review per business" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can review" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public read reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own review" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete own review" ON public.reviews;

CREATE POLICY "Public can read reviews"
  ON public.reviews
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can create own reviews"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own review"
  ON public.reviews
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own review"
  ON public.reviews
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

REVOKE ALL ON public.reviews FROM anon, authenticated;
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
