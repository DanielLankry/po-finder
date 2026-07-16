-- Launch privacy hardening.
--
-- Public rows remain discoverable through RLS, but owner identifiers and
-- business registration numbers are no longer selectable through the anon
-- Data API. Draft/expired schedules and photos are visible only to the owner.

CREATE OR REPLACE FUNCTION public.current_user_owns_business(target_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    (SELECT auth.uid()) IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.businesses AS business
      WHERE business.id = target_business_id
        AND business.owner_id = (SELECT auth.uid())
    );
$$;

REVOKE ALL ON FUNCTION public.current_user_owns_business(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_owns_business(uuid)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.can_read_business_content(target_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.businesses AS business
    WHERE business.id = target_business_id
      AND (
        business.owner_id = (SELECT auth.uid())
        OR (
          business.is_verified = true
          AND business.is_active = true
          AND (
            business.is_legacy_public = true
            OR business.expires_at > now()
          )
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_read_business_content(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_business_content(uuid)
  TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.can_read_business_photo_object(object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.businesses AS business
    WHERE business.id::text = split_part(object_name, '/', 1)
      AND (
        business.owner_id = (SELECT auth.uid())
        OR (
          business.is_verified = true
          AND business.is_active = true
          AND (
            business.is_legacy_public = true
            OR business.expires_at > now()
          )
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_read_business_photo_object(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_business_photo_object(text)
  TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.current_user_owns_business_photo_object(object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    (SELECT auth.uid()) IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.businesses AS business
      WHERE business.id::text = split_part(object_name, '/', 1)
        AND business.owner_id = (SELECT auth.uid())
    );
$$;

REVOKE ALL ON FUNCTION public.current_user_owns_business_photo_object(text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_owns_business_photo_object(text)
  TO authenticated;

-- Private owner reads go through this row-scoped function so authenticated
-- users never receive another business's owner_id or business_number.
CREATE OR REPLACE FUNCTION public.get_my_businesses()
RETURNS SETOF public.businesses
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT business.*
  FROM public.businesses AS business
  WHERE business.owner_id = (SELECT auth.uid())
  ORDER BY business.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_my_businesses() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_businesses() TO authenticated;

-- This helper is called from schedule/photo write policies. It must not depend
-- on browser SELECT privileges for the private owner_id column.
CREATE OR REPLACE FUNCTION public.user_is_subscribed()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    (SELECT auth.uid()) IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.businesses AS business
      WHERE business.owner_id = (SELECT auth.uid())
    );
$$;

REVOKE ALL ON FUNCTION public.user_is_subscribed() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_is_subscribed() TO authenticated;

-- Serialize self-service draft creation by owner. The previous trigger checked
-- first and inserted second, so two concurrent requests could both pass.
CREATE OR REPLACE FUNCTION public.enforce_single_owner_business()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(NEW.owner_id::text, 0));

    IF EXISTS (
      SELECT 1
      FROM public.businesses AS business
      WHERE business.owner_id = NEW.owner_id
    ) THEN
      RAISE EXCEPTION 'only one self-service business draft is allowed';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_single_owner_business()
  FROM PUBLIC, anon, authenticated;

-- RLS controls rows, while these grants control sensitive columns.
REVOKE SELECT ON TABLE public.businesses FROM anon, authenticated;
GRANT SELECT (
  id,
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
  avg_rating,
  review_count,
  is_active,
  created_at,
  expires_at,
  is_verified,
  is_legacy_public,
  search_vector
) ON public.businesses TO anon, authenticated;

-- Daily schedule visibility and owner writes.
DROP POLICY IF EXISTS "Anyone can read schedules" ON public.business_schedules;
DROP POLICY IF EXISTS "Owners can insert schedule for own business" ON public.business_schedules;
DROP POLICY IF EXISTS "Owners can update own schedule" ON public.business_schedules;
DROP POLICY IF EXISTS "Owners can delete own schedule" ON public.business_schedules;

CREATE POLICY "schedule_select_visible_or_owner"
  ON public.business_schedules
  FOR SELECT
  TO anon, authenticated
  USING (public.can_read_business_content(business_id));

CREATE POLICY "schedule_insert_owner"
  ON public.business_schedules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_is_subscribed()
    AND public.current_user_owns_business(business_id)
  );

CREATE POLICY "schedule_update_owner"
  ON public.business_schedules
  FOR UPDATE
  TO authenticated
  USING (public.current_user_owns_business(business_id))
  WITH CHECK (public.current_user_owns_business(business_id));

CREATE POLICY "schedule_delete_owner"
  ON public.business_schedules
  FOR DELETE
  TO authenticated
  USING (public.current_user_owns_business(business_id));

-- Weekly schedule visibility and owner writes.
DROP POLICY IF EXISTS "weekly_schedule_select" ON public.business_weekly_schedule;
DROP POLICY IF EXISTS "weekly_schedule_insert" ON public.business_weekly_schedule;
DROP POLICY IF EXISTS "weekly_schedule_update" ON public.business_weekly_schedule;
DROP POLICY IF EXISTS "weekly_schedule_delete" ON public.business_weekly_schedule;

CREATE POLICY "weekly_schedule_select_visible_or_owner"
  ON public.business_weekly_schedule
  FOR SELECT
  TO anon, authenticated
  USING (public.can_read_business_content(business_id));

CREATE POLICY "weekly_schedule_insert_owner"
  ON public.business_weekly_schedule
  FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_owns_business(business_id));

CREATE POLICY "weekly_schedule_update_owner"
  ON public.business_weekly_schedule
  FOR UPDATE
  TO authenticated
  USING (public.current_user_owns_business(business_id))
  WITH CHECK (public.current_user_owns_business(business_id));

CREATE POLICY "weekly_schedule_delete_owner"
  ON public.business_weekly_schedule
  FOR DELETE
  TO authenticated
  USING (public.current_user_owns_business(business_id));

-- Photo metadata follows the same public/owner boundary.
DROP POLICY IF EXISTS "Anyone can read photos" ON public.photos;
DROP POLICY IF EXISTS "Owners can insert photos for own business" ON public.photos;
DROP POLICY IF EXISTS "Owners can delete own photos" ON public.photos;
DROP POLICY IF EXISTS "Owners can update own photos" ON public.photos;
DROP POLICY IF EXISTS "Owners can insert photos" ON public.photos;
DROP POLICY IF EXISTS "Owners can delete photos" ON public.photos;

CREATE POLICY "photos_select_visible_or_owner"
  ON public.photos
  FOR SELECT
  TO anon, authenticated
  USING (public.can_read_business_content(business_id));

CREATE POLICY "photos_insert_owner"
  ON public.photos
  FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_owns_business(business_id));

CREATE POLICY "photos_update_owner"
  ON public.photos
  FOR UPDATE
  TO authenticated
  USING (public.current_user_owns_business(business_id))
  WITH CHECK (public.current_user_owns_business(business_id));

CREATE POLICY "photos_delete_owner"
  ON public.photos
  FOR DELETE
  TO authenticated
  USING (public.current_user_owns_business(business_id));

-- Event and analytics policies previously joined the newly private owner_id
-- column directly. Route those checks through the same safe boolean helpers.
DROP POLICY IF EXISTS "Owners can read business analytics"
  ON public.business_analytics_events;

CREATE POLICY "Owners can read business analytics"
  ON public.business_analytics_events
  FOR SELECT
  TO authenticated
  USING (public.current_user_owns_business(business_id));

DROP POLICY IF EXISTS "Public can read current business events"
  ON public.business_events;
DROP POLICY IF EXISTS "Owners can insert business events"
  ON public.business_events;
DROP POLICY IF EXISTS "Owners can update business events"
  ON public.business_events;
DROP POLICY IF EXISTS "Owners can delete business events"
  ON public.business_events;

CREATE POLICY "Public can read current business events"
  ON public.business_events
  FOR SELECT
  TO anon, authenticated
  USING (public.can_read_business_content(business_id));

CREATE POLICY "Owners can insert business events"
  ON public.business_events
  FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_owns_business(business_id));

CREATE POLICY "Owners can update business events"
  ON public.business_events
  FOR UPDATE
  TO authenticated
  USING (public.current_user_owns_business(business_id))
  WITH CHECK (public.current_user_owns_business(business_id));

CREATE POLICY "Owners can delete business events"
  ON public.business_events
  FOR DELETE
  TO authenticated
  USING (public.current_user_owns_business(business_id));

-- Private storage prevents a known draft URL from bypassing database RLS.
UPDATE storage.buckets SET public = false WHERE id = 'photos';

DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Owners can upload to own business folder" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete own business photos" ON storage.objects;

CREATE POLICY "photo_objects_select_visible_or_owner"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'photos'
    AND public.can_read_business_photo_object(storage.objects.name)
  );

CREATE POLICY "photo_objects_insert_owner"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'photos'
    AND public.current_user_owns_business_photo_object(storage.objects.name)
  );

CREATE POLICY "photo_objects_delete_owner"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'photos'
    AND public.current_user_owns_business_photo_object(storage.objects.name)
  );
