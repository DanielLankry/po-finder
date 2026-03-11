-- Weekly schedule template for businesses
CREATE TABLE IF NOT EXISTS business_weekly_schedule (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  day_of_week   SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 6=Sat
  is_active     BOOLEAN NOT NULL DEFAULT true,
  open_time     TIME,
  close_time    TIME,
  address       TEXT,
  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, day_of_week)
);

ALTER TABLE business_weekly_schedule ENABLE ROW LEVEL SECURITY;

-- Anyone can read weekly schedules
CREATE POLICY "weekly_schedule_select" ON business_weekly_schedule
  FOR SELECT USING (true);

-- Only owner can insert/update/delete
CREATE POLICY "weekly_schedule_insert" ON business_weekly_schedule
  FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "weekly_schedule_update" ON business_weekly_schedule
  FOR UPDATE USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "weekly_schedule_delete" ON business_weekly_schedule
  FOR DELETE USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );
