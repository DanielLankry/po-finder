CREATE TABLE IF NOT EXISTS business_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'call_click', 'whatsapp_click', 'directions_click')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT -- anonymous tracking
);

CREATE INDEX IF NOT EXISTS idx_business_events_business ON business_events(business_id, created_at);

-- No RLS needed for inserts (anonymous), but restrict reads
ALTER TABLE business_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business owners can read own events" ON business_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM businesses WHERE businesses.id = business_id AND businesses.owner_id = auth.uid())
  );
CREATE POLICY "Anyone can insert events" ON business_events
  FOR INSERT WITH CHECK (true);
