CREATE TABLE IF NOT EXISTS spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  address TEXT NOT NULL,
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  phone TEXT,
  photo_url TEXT,
  stripe_payment_id TEXT,
  duration_days INT NOT NULL,
  amount_paid INT NOT NULL,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_approved BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE spots ENABLE ROW LEVEL SECURITY;

-- Owners can read their own spots
CREATE POLICY "owners_read_own" ON spots
  FOR SELECT USING (auth.uid() = owner_id);

-- Owners can insert
CREATE POLICY "owners_insert" ON spots
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Public can read approved active non-expired spots
CREATE POLICY "public_read_approved" ON spots
  FOR SELECT USING (
    is_approved = true
    AND is_active = true
    AND expires_at > now()
  );
