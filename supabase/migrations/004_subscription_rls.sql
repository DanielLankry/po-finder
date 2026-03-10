-- Enforce subscription before allowing business operations
-- Only users with active or past_due subscription can insert/update businesses and schedules

-- Helper function: check if user has active subscription
CREATE OR REPLACE FUNCTION public.user_is_subscribed()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND subscription_status IN ('active', 'past_due')
  );
$$;

-- Businesses: only subscribed users can insert/update
DROP POLICY IF EXISTS "Owners can insert own business" ON public.businesses;
DROP POLICY IF EXISTS "Owners can update own business" ON public.businesses;

CREATE POLICY "Owners can insert own business" ON public.businesses
  FOR INSERT WITH CHECK (auth.uid() = owner_id AND public.user_is_subscribed());

CREATE POLICY "Owners can update own business" ON public.businesses
  FOR UPDATE USING (auth.uid() = owner_id AND public.user_is_subscribed());

-- Schedules: only subscribed users can insert/update
DROP POLICY IF EXISTS "Owners can insert schedule for own business" ON public.business_schedules;
DROP POLICY IF EXISTS "Owners can update own schedule" ON public.business_schedules;

CREATE POLICY "Owners can insert schedule for own business" ON public.business_schedules
  FOR INSERT WITH CHECK (
    public.user_is_subscribed() AND
    auth.uid() = (SELECT owner_id FROM public.businesses WHERE id = business_id)
  );

CREATE POLICY "Owners can update own schedule" ON public.business_schedules
  FOR UPDATE USING (
    public.user_is_subscribed() AND
    auth.uid() = (SELECT owner_id FROM public.businesses WHERE id = business_id)
  );

-- Photos: only subscribed users can upload
DROP POLICY IF EXISTS "Owners can insert photos" ON public.photos;
DROP POLICY IF EXISTS "Owners can delete photos" ON public.photos;

CREATE POLICY "Owners can insert photos" ON public.photos
  FOR INSERT WITH CHECK (
    public.user_is_subscribed() AND
    auth.uid() = (SELECT owner_id FROM public.businesses WHERE id = business_id)
  );

CREATE POLICY "Owners can delete photos" ON public.photos
  FOR DELETE USING (
    auth.uid() = (SELECT owner_id FROM public.businesses WHERE id = business_id)
  );
