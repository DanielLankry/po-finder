-- Add expires_at to businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Drop spots table
DROP TABLE IF EXISTS spots;
