-- Add tsvector search column to businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Update existing rows
UPDATE businesses SET search_vector =
  setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(address, '')), 'C');

-- Create GIN index
CREATE INDEX IF NOT EXISTS businesses_search_idx ON businesses USING GIN(search_vector);

-- Trigger to auto-update
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.address, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS businesses_search_trigger ON businesses;
CREATE TRIGGER businesses_search_trigger
  BEFORE INSERT OR UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();
