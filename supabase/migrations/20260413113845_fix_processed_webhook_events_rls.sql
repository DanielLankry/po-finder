
-- processed_webhook_events: only service_role should access this table
-- RLS is already enabled, just add a deny-all policy for anon/authenticated
CREATE POLICY "Deny all access to anon and authenticated"
  ON public.processed_webhook_events
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
