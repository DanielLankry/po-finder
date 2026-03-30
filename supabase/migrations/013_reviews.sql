-- Reviews table (may already exist, created idempotently)
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  reviewer_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add reviewer_name if it doesn't exist (migration idempotency)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewer_name TEXT;

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='reviews' AND policyname='Public read reviews'
  ) THEN
    CREATE POLICY "Public read reviews" ON reviews FOR SELECT USING (true);
  END IF;
END $$;

-- Authenticated users can insert
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='reviews' AND policyname='Authenticated users can review'
  ) THEN
    CREATE POLICY "Authenticated users can review" ON reviews FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
  END IF;
END $$;

-- Update avg_rating on businesses after review insert
CREATE OR REPLACE FUNCTION update_business_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE businesses SET
    avg_rating = (SELECT AVG(rating)::NUMERIC(3,2) FROM reviews WHERE business_id = COALESCE(NEW.business_id, OLD.business_id)),
    review_count = (SELECT COUNT(*) FROM reviews WHERE business_id = COALESCE(NEW.business_id, OLD.business_id))
  WHERE id = COALESCE(NEW.business_id, OLD.business_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_rating_trigger ON reviews;
CREATE TRIGGER update_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_business_rating();
