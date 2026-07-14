-- Separate scheduled business events from anonymous product analytics.
--
-- Migration 011 originally used public.business_events for analytics. The live
-- project later gained a scheduled-events table with the same name. Support
-- both histories so fresh databases and the live project converge safely.

DO $$
BEGIN
  IF to_regclass('public.business_events') IS NOT NULL
     AND to_regclass('public.business_analytics_events') IS NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'business_events'
         AND column_name = 'event_type'
     )
     AND NOT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'business_events'
         AND column_name = 'title'
     ) THEN
    ALTER TABLE public.business_events RENAME TO business_analytics_events;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.business_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (
    event_type IN ('view', 'call_click', 'whatsapp_click', 'directions_click')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id TEXT CHECK (session_id IS NULL OR char_length(session_id) <= 128)
);

CREATE INDEX IF NOT EXISTS idx_business_analytics_events_business_created
  ON public.business_analytics_events (business_id, created_at DESC);

ALTER TABLE public.business_analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Business owners can read own events"
  ON public.business_analytics_events;
DROP POLICY IF EXISTS "Anyone can insert events"
  ON public.business_analytics_events;
DROP POLICY IF EXISTS "Owners can read business analytics"
  ON public.business_analytics_events;

CREATE POLICY "Owners can read business analytics"
  ON public.business_analytics_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.businesses
      WHERE businesses.id = business_analytics_events.business_id
        AND businesses.owner_id = (SELECT auth.uid())
    )
  );

REVOKE ALL ON public.business_analytics_events FROM anon, authenticated;
GRANT SELECT ON public.business_analytics_events TO authenticated;

CREATE TABLE IF NOT EXISTS public.business_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 2000),
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  price NUMERIC CHECK (price IS NULL OR price >= 0),
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_events_business_date
  ON public.business_events (business_id, event_date, start_time);

ALTER TABLE public.business_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Business owners can read own events" ON public.business_events;
DROP POLICY IF EXISTS "Owners can delete events" ON public.business_events;
DROP POLICY IF EXISTS "Owners can insert events" ON public.business_events;
DROP POLICY IF EXISTS "Owners can update events" ON public.business_events;
DROP POLICY IF EXISTS "Public can read events" ON public.business_events;

CREATE POLICY "Public can read current business events"
  ON public.business_events
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.businesses
      WHERE businesses.id = business_events.business_id
        AND businesses.is_verified = true
        AND businesses.is_active = true
        AND (
          businesses.is_legacy_public = true
          OR businesses.expires_at > now()
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.businesses
      WHERE businesses.id = business_events.business_id
        AND businesses.owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Owners can insert business events"
  ON public.business_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.businesses
      WHERE businesses.id = business_events.business_id
        AND businesses.owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Owners can update business events"
  ON public.business_events
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.businesses
      WHERE businesses.id = business_events.business_id
        AND businesses.owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.businesses
      WHERE businesses.id = business_events.business_id
        AND businesses.owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Owners can delete business events"
  ON public.business_events
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.businesses
      WHERE businesses.id = business_events.business_id
        AND businesses.owner_id = (SELECT auth.uid())
    )
  );

GRANT SELECT ON public.business_events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.business_events TO authenticated;

-- Enforce the same upload constraints in Storage as the dashboard UI.
UPDATE storage.buckets
SET file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'photos';

DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Public read photos" ON storage.objects;
DROP POLICY IF EXISTS "Owners can upload to own business folder" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete own business photos" ON storage.objects;

CREATE POLICY "Owners can upload to own business folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'photos'
    AND EXISTS (
      SELECT 1
      FROM public.businesses
      WHERE businesses.id::text = split_part(storage.objects.name, '/', 1)
        AND businesses.owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Owners can delete own business photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'photos'
    AND EXISTS (
      SELECT 1
      FROM public.businesses
      WHERE businesses.id::text = split_part(storage.objects.name, '/', 1)
        AND businesses.owner_id = (SELECT auth.uid())
    )
  );
