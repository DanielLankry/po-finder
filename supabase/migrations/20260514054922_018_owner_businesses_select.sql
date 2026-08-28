-- Allow business owners to read their own businesses regardless of is_active.
--
-- Previously the only SELECT policy was "Anyone can read active businesses"
-- (is_active = true), which blocked owners from seeing their own inactive
-- (pending-admin-approval) businesses.

CREATE POLICY "Owners can read own businesses" ON public.businesses
  FOR SELECT USING (auth.uid() = owner_id);
