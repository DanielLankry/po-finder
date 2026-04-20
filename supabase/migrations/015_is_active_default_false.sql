-- Fix is_active default and prevent users from self-activating their business
--
-- Previously: is_active defaulted to TRUE, meaning any authenticated INSERT
-- that omitted the column immediately made the business publicly visible —
-- bypassing the admin-approval requirement.
--
-- This migration:
--   1. Changes the column default to FALSE.
--   2. Tightens the INSERT policy so users cannot supply is_active = true.
--   3. Tightens the UPDATE policy so owners cannot flip is_active themselves.
--   Only the service-role (used by /api/admin/businesses/approve and
--   /api/stripe/webhook) can set is_active = true.

-- 1. Change column default
ALTER TABLE public.businesses
  ALTER COLUMN is_active SET DEFAULT false;

-- 2. Re-create INSERT policy: owner must be subscribed AND must not try to
--    self-activate (is_active must be false or omitted, i.e. the new default).
DROP POLICY IF EXISTS "Owners can insert own business" ON public.businesses;

CREATE POLICY "Owners can insert own business" ON public.businesses
  FOR INSERT WITH CHECK (
    auth.uid() = owner_id
    AND public.user_is_subscribed()
    AND is_active = false
  );

-- 3. Re-create UPDATE policy: owners can edit their own business details but
--    cannot flip is_active to true.
DROP POLICY IF EXISTS "Owners can update own business" ON public.businesses;

CREATE POLICY "Owners can update own business" ON public.businesses
  FOR UPDATE
  USING  (auth.uid() = owner_id AND public.user_is_subscribed())
  WITH CHECK (
    auth.uid() = owner_id
    AND public.user_is_subscribed()
    AND is_active = (SELECT is_active FROM public.businesses WHERE id = businesses.id)
  );
