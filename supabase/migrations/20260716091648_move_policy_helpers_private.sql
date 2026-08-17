-- Keep SECURITY DEFINER helpers used only by RLS outside the exposed public
-- schema. ALTER FUNCTION preserves each policy's dependency on the function
-- object, so the business, schedule, event, photo, and storage policies keep
-- working without leaving callable helper RPCs in the Data API schema.

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated;

ALTER FUNCTION public.current_user_owns_business(uuid)
  SET SCHEMA private;
ALTER FUNCTION public.can_read_business_content(uuid)
  SET SCHEMA private;
ALTER FUNCTION public.can_read_business_photo_object(text)
  SET SCHEMA private;
ALTER FUNCTION public.current_user_owns_business_photo_object(text)
  SET SCHEMA private;
ALTER FUNCTION public.user_is_subscribed()
  SET SCHEMA private;

-- Reset inherited/default EXECUTE privileges after the move, then grant only
-- what the existing RLS policies need. The private schema is not exposed by
-- the Data API, so these grants do not create public RPC endpoints.
REVOKE ALL ON FUNCTION private.current_user_owns_business(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.can_read_business_content(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.can_read_business_photo_object(text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.current_user_owns_business_photo_object(text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.user_is_subscribed()
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION private.current_user_owns_business(uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_read_business_content(uuid)
  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.can_read_business_photo_object(text)
  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.current_user_owns_business_photo_object(text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION private.user_is_subscribed()
  TO authenticated;

-- Public reviews need display content, not the auth user UUID behind each
-- review. Keep ownership enforcement in RLS while narrowing Data API columns.
REVOKE ALL ON TABLE public.reviews FROM PUBLIC, anon, authenticated;
GRANT SELECT (
  id,
  business_id,
  rating,
  comment,
  reviewer_name,
  created_at
) ON public.reviews TO anon, authenticated;
GRANT INSERT (
  business_id,
  user_id,
  rating,
  comment,
  reviewer_name
) ON public.reviews TO authenticated;
GRANT UPDATE (
  rating,
  comment,
  reviewer_name
) ON public.reviews TO authenticated;
GRANT DELETE ON public.reviews TO authenticated;

-- Buyers may read receipt fields for their own attempts through RLS. Provider
-- callback payloads, authorization codes, and rollback snapshots remain
-- server/admin-only.
REVOKE ALL ON TABLE public.payment_attempts FROM PUBLIC, anon, authenticated;
GRANT SELECT (
  id,
  business_id,
  plan_days,
  duration_months,
  amount_agorot,
  status,
  kind,
  product_code,
  bonus_boost_days,
  service_status,
  hyp_transaction_id,
  hyp_card_mask,
  hyp_response_code,
  created_at,
  completed_at,
  entitlement_expires_at
) ON public.payment_attempts TO authenticated;

-- Owners need aggregate event types, not stable visitor session identifiers.
REVOKE ALL ON TABLE public.business_analytics_events
  FROM PUBLIC, anon, authenticated;
GRANT SELECT (
  id,
  business_id,
  event_type,
  created_at
) ON public.business_analytics_events TO authenticated;

-- Coupons are managed and consumed only by service-role server flows. The
-- historical public read policy exposed every active discount code.
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Anyone can read active coupons" ON public.coupons;
REVOKE ALL ON TABLE public.coupons FROM PUBLIC, anon, authenticated;

-- A legacy spots table is absent in production and unused by the app, but old
-- fresh-schema migrations created it with public payment and owner columns.
-- Preserve any historical rows while removing all browser access where it
-- still exists.
DO $$
BEGIN
  IF to_regclass('public.spots') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "public_read_approved" ON public.spots';
    EXECUTE 'DROP POLICY IF EXISTS "owners_read_own" ON public.spots';
    EXECUTE 'DROP POLICY IF EXISTS "owners_insert" ON public.spots';
    EXECUTE 'REVOKE ALL ON TABLE public.spots FROM PUBLIC, anon, authenticated';
  END IF;
END
$$;

-- Fail the migration if a broader inherited grant would keep sensitive Data
-- API columns reachable despite the explicit allowlists above.
DO $$
BEGIN
  IF has_column_privilege('anon', 'public.reviews', 'user_id', 'SELECT')
     OR has_column_privilege(
       'authenticated',
       'public.reviews',
       'user_id',
       'SELECT'
     ) THEN
    RAISE EXCEPTION 'review user_id must not be selectable by browser roles';
  END IF;

  IF has_column_privilege(
       'authenticated',
       'public.payment_attempts',
       'raw_return',
       'SELECT'
     )
     OR has_column_privilege(
       'authenticated',
       'public.payment_attempts',
       'hyp_auth_code',
       'SELECT'
     ) THEN
    RAISE EXCEPTION 'payment provider secrets must remain server-only';
  END IF;

  IF has_column_privilege(
       'authenticated',
       'public.business_analytics_events',
       'session_id',
       'SELECT'
     ) THEN
    RAISE EXCEPTION 'analytics session_id must remain server-only';
  END IF;

  IF has_table_privilege('anon', 'public.coupons', 'SELECT')
     OR has_table_privilege('authenticated', 'public.coupons', 'SELECT') THEN
    RAISE EXCEPTION 'coupon rows must remain server-only';
  END IF;
END
$$;
