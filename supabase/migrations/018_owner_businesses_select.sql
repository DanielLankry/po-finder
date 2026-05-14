-- Allow business owners to read their own businesses regardless of is_active.
--
-- Previously the only SELECT policy was "Anyone can read active businesses"
-- (is_active = true), which blocked owners from seeing their own inactive
-- (pending-admin-approval) businesses.  This caused three breakages:
--
--   1. dashboard/layout.tsx paywall check couldn't find the business →
--      redirected paying users to /pricing immediately after business creation.
--
--   2. dashboard/profile/page.tsx couldn't load the business → always showed
--      the "Create Business" form instead of the edit form.
--
--   3. GET /api/businesses?mine=1 returned empty → billing page reported
--      "no businesses" even after the user had created one.
--
-- The public "active businesses" policy is untouched — non-owners still only
-- see is_active = true rows.

CREATE POLICY "Owners can read own businesses" ON public.businesses
  FOR SELECT USING (auth.uid() = owner_id);
