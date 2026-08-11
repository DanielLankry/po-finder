-- Reserve the first 20 self-service business drafts for a three-calendar-month
-- launch promotion. A reservation is private until an admin approves the
-- business; only then does the free visibility period begin.

CREATE TABLE public.promotion_campaigns (
  code text PRIMARY KEY,
  capacity integer NOT NULL CHECK (capacity > 0),
  claimed_count integer NOT NULL DEFAULT 0 CHECK (
    claimed_count >= 0 AND claimed_count <= capacity
  ),
  duration_months integer NOT NULL CHECK (duration_months > 0),
  starts_at timestamptz NOT NULL,
  enrollment_ends_at timestamptz NOT NULL CHECK (enrollment_ends_at > starts_at),
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promotion_campaigns ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.promotion_campaigns FROM PUBLIC, anon, authenticated;
GRANT SELECT (
  code,
  capacity,
  claimed_count,
  duration_months,
  starts_at,
  enrollment_ends_at,
  is_active,
  updated_at
) ON TABLE public.promotion_campaigns TO anon, authenticated;

CREATE POLICY "promotion_campaigns_public_status"
  ON public.promotion_campaigns
  FOR SELECT
  TO anon, authenticated
  USING (true);

INSERT INTO public.promotion_campaigns (
  code,
  capacity,
  claimed_count,
  duration_months,
  starts_at,
  enrollment_ends_at,
  is_active
)
VALUES (
  'first-20-3m',
  20,
  0,
  3,
  '2026-08-11 00:00:00+03'::timestamptz,
  '2026-12-31 23:59:59+02'::timestamptz,
  true
);

ALTER TABLE public.businesses
  ADD COLUMN promotion_code text,
  ADD COLUMN promotion_reserved_at timestamptz,
  ADD COLUMN promotion_activated_at timestamptz,
  ADD CONSTRAINT businesses_promotion_code_fkey
    FOREIGN KEY (promotion_code)
    REFERENCES public.promotion_campaigns(code)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT,
  ADD CONSTRAINT businesses_promotion_reservation_check
    CHECK (
      (promotion_code IS NULL AND promotion_reserved_at IS NULL AND promotion_activated_at IS NULL)
      OR (promotion_code IS NOT NULL AND promotion_reserved_at IS NOT NULL)
    ),
  ADD CONSTRAINT businesses_promotion_activation_check
    CHECK (promotion_activated_at IS NULL OR promotion_reserved_at IS NOT NULL);

CREATE INDEX businesses_promotion_reservations_idx
  ON public.businesses (promotion_code, promotion_reserved_at)
  WHERE promotion_code IS NOT NULL;

CREATE SCHEMA IF NOT EXISTS private;

-- WHAT: atomically claims one campaign place for a new self-service draft.
-- WHY: the public counter must never oversell when multiple owners save at once.
-- HOW: lock the single campaign row, validate availability, then increment and
-- stamp server-managed business columns inside the same insert transaction.
CREATE OR REPLACE FUNCTION private.reserve_first_twenty_promotion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  campaign public.promotion_campaigns%ROWTYPE;
BEGIN
  IF (SELECT auth.uid()) IS NULL
     OR NEW.owner_id <> (SELECT auth.uid())
     OR NEW.expires_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Owners who already bought a listing keep their paid entitlement and do not
  -- consume a place intended for a free campaign signup.
  IF EXISTS (
    SELECT 1
    FROM public.payment_attempts AS attempt
    WHERE attempt.user_id = NEW.owner_id
      AND attempt.status = 'succeeded'
      AND attempt.kind = 'listing'
      AND attempt.business_id IS NULL
  ) THEN
    RETURN NEW;
  END IF;

  SELECT *
    INTO campaign
  FROM public.promotion_campaigns
  WHERE code = 'first-20-3m'
  FOR UPDATE;

  IF NOT FOUND
     OR NOT campaign.is_active
     OR now() < campaign.starts_at
     OR now() > campaign.enrollment_ends_at
     OR campaign.claimed_count >= campaign.capacity THEN
    RETURN NEW;
  END IF;

  UPDATE public.promotion_campaigns
  SET claimed_count = claimed_count + 1,
      updated_at = now()
  WHERE code = campaign.code;

  NEW.promotion_code := campaign.code;
  NEW.promotion_reserved_at := now();
  NEW.promotion_activated_at := NULL;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.reserve_first_twenty_promotion()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_reserve_first_twenty_promotion ON public.businesses;
CREATE TRIGGER trg_reserve_first_twenty_promotion
  BEFORE INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION private.reserve_first_twenty_promotion();

-- WHAT: starts the reserved free period when moderation approves the business.
-- WHY: review time must not reduce the promised three months of publication.
-- HOW: the approval transition sets a calendar-month expiry and public-active
-- state before the admin update is written.
CREATE OR REPLACE FUNCTION private.activate_first_twenty_promotion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  campaign_duration integer;
  activation_base timestamptz;
BEGIN
  IF OLD.is_verified = false
     AND NEW.is_verified = true
     AND OLD.promotion_code = 'first-20-3m'
     AND OLD.promotion_reserved_at IS NOT NULL
     AND OLD.promotion_activated_at IS NULL THEN
    SELECT duration_months
      INTO campaign_duration
    FROM public.promotion_campaigns
    WHERE code = OLD.promotion_code;

    IF campaign_duration IS NULL THEN
      RAISE EXCEPTION 'reserved promotion campaign is missing';
    END IF;

    activation_base := GREATEST(COALESCE(NEW.expires_at, now()), now());
    NEW.promotion_activated_at := now();
    NEW.expires_at := activation_base + make_interval(months => campaign_duration);
    NEW.is_active := true;
    NEW.is_legacy_public := false;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.activate_first_twenty_promotion()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_activate_first_twenty_promotion ON public.businesses;
CREATE TRIGGER trg_activate_first_twenty_promotion
  BEFORE UPDATE OF is_verified ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION private.activate_first_twenty_promotion();

-- Unapproved deletions release their place. Activated promotions remain part
-- of the fixed 20-business allocation even if the business is later deleted.
CREATE OR REPLACE FUNCTION private.release_first_twenty_reservation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF OLD.promotion_code = 'first-20-3m'
     AND OLD.promotion_reserved_at IS NOT NULL
     AND OLD.promotion_activated_at IS NULL THEN
    UPDATE public.promotion_campaigns
    SET claimed_count = GREATEST(claimed_count - 1, 0),
        updated_at = now()
    WHERE code = OLD.promotion_code;
  END IF;

  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION private.release_first_twenty_reservation()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_release_first_twenty_reservation ON public.businesses;
CREATE TRIGGER trg_release_first_twenty_reservation
  AFTER DELETE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION private.release_first_twenty_reservation();

COMMENT ON TABLE public.promotion_campaigns IS
  'Public aggregate availability for bounded acquisition campaigns; browser roles are read-only.';
COMMENT ON COLUMN public.businesses.promotion_code IS
  'Server-managed promotion reserved for this business; omitted from public business column grants.';
COMMENT ON COLUMN public.businesses.promotion_reserved_at IS
  'When the campaign place was atomically claimed by the draft insert.';
COMMENT ON COLUMN public.businesses.promotion_activated_at IS
  'When admin approval started the free visibility period.';
