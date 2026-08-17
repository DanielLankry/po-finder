
-- Remove the overly permissive INSERT policy that allows anyone to insert events
-- The "Owners can insert events" policy already handles legitimate inserts
DROP POLICY "Anyone can insert events" ON public.business_events;
