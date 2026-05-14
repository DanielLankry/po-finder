-- Harden user_is_subscribed() so paying users can always create / edit a business.
--
-- Bug: After a successful HYP payment we flip users.subscription_status='active'
-- via the admin client in /api/payments/return. If that update affects zero rows
-- (missing public.users row, race with auth callback, partial verify failure,
-- etc.) the user lands back on the dashboard with an unconsumed payment_attempt
-- — dashboard/layout.tsx lets them in — but the RLS policy on businesses still
-- rejects their INSERT because user_is_subscribed() only checked the column.
--
-- This migration aligns the RLS predicate with the same signal the dashboard
-- already trusts: an unconsumed succeeded payment_attempt OR a business with a
-- future expires_at also counts as "subscribed". Once the trigger
-- consume_payment_for_business() links the payment to the new business, the
-- second clause keeps them subscribed until the period ends.

CREATE OR REPLACE FUNCTION public.user_is_subscribed()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    -- Legacy / explicitly-set subscription status (Stripe era, still set by
    -- /api/payments/return on success).
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND subscription_status IN ('active', 'past_due')
    )
    OR
    -- Paid via HYP but hasn't created (or hasn't yet been linked to) a business.
    EXISTS (
      SELECT 1 FROM public.payment_attempts
      WHERE user_id = auth.uid()
      AND status = 'succeeded'
      AND business_id IS NULL
    )
    OR
    -- Already owns a business with an unexpired period.
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE owner_id = auth.uid()
      AND expires_at IS NOT NULL
      AND expires_at > now()
    );
$$;
