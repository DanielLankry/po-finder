-- Migration 006: Spots feature
-- One-time paid temporary listings

CREATE TABLE spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Owner (must be registered user)
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Business info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  address TEXT NOT NULL,
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  phone TEXT,
  photo_url TEXT,
  
  -- Timing
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  duration_days INT NOT NULL, -- 1, 3, 7, 14, 30
  
  -- Payment
  stripe_payment_intent_id TEXT,
  amount_paid INT NOT NULL, -- in agorot (₪19 = 1900)
  
  -- Admin approval
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected | expired
  admin_note TEXT,
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-expire spots
CREATE OR REPLACE FUNCTION expire_spots()
RETURNS void LANGUAGE sql AS $$
  UPDATE spots
  SET status = 'expired'
  WHERE status = 'approved'
    AND expires_at < now();
$$;

-- Index for map queries (active spots)
CREATE INDEX spots_active_idx ON spots (status, expires_at)
  WHERE status = 'approved';

CREATE INDEX spots_owner_idx ON spots (owner_id);

-- RLS
ALTER TABLE spots ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved non-expired spots
CREATE POLICY "spots_read_approved" ON spots
  FOR SELECT USING (status = 'approved' AND expires_at > now());

-- Owners can read their own spots (all statuses)
CREATE POLICY "spots_owner_read_own" ON spots
  FOR SELECT USING (owner_id = auth.uid());

-- Owners can insert
CREATE POLICY "spots_owner_insert" ON spots
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Owners can update only pending (pre-approval)
CREATE POLICY "spots_owner_update_pending" ON spots
  FOR UPDATE USING (owner_id = auth.uid() AND status = 'pending');
