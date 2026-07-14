-- Pricing v3: one private free draft plus a database-backed paid catalog.
--
-- Paid product codes are immutable checkout inputs. Prices, durations, boost
-- bonuses, verification requirements, and the founding-offer cap are resolved
-- and enforced in Postgres so a browser cannot alter an entitlement.

-- ---------------------------------------------------------------------------
-- 1. Product catalog
-- ---------------------------------------------------------------------------

ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS boost_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS max_redemptions integer,
  ADD COLUMN IF NOT EXISTS requires_verification boolean NOT NULL DEFAULT true;

ALTER TABLE public.plans
  DROP CONSTRAINT IF EXISTS plans_days_key,
  DROP CONSTRAINT IF EXISTS plans_boost_days_check,
  DROP CONSTRAINT IF EXISTS plans_max_redemptions_check;

ALTER TABLE public.plans
  ADD CONSTRAINT plans_boost_days_check CHECK (boost_days >= 0),
  ADD CONSTRAINT plans_max_redemptions_check
    CHECK (max_redemptions IS NULL OR max_redemptions > 0);

DELETE FROM public.plans;

INSERT INTO public.plans (
  sort_order,
  code,
  kind,
  days,
  boost_days,
  label,
  price,
  is_active,
  max_redemptions,
  requires_verification
) VALUES
  (0, 'annual_listing',  'listing', 365, 0,  'רישום שנתי',       4900, true, NULL, true),
  (1, 'assisted_launch', 'listing', 365, 30, 'השקה בליווי',       9900, true, NULL, true),
  (2, 'boost_30',        'boost',    30, 0,  'קידום ל-30 יום',    2000, true, NULL, true),
  (3, 'boost_90',        'boost',    90, 0,  'קידום ל-90 יום',    4900, true, NULL, true),
  (4, 'founding_offer',  'listing', 365, 0,  'הצעת מייסדים',      2900, true, 100,  true);

ALTER TABLE public.plans
  ALTER COLUMN code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS plans_code_key
  ON public.plans (code);

-- ---------------------------------------------------------------------------
-- 2. Business verification is separate from paid public visibility
-- ---------------------------------------------------------------------------

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_legacy_public boolean NOT NULL DEFAULT false;

-- Existing approved/seeded businesses keep their current public behavior.
UPDATE public.businesses
SET is_verified = true,
    is_legacy_public = expires_at IS NULL
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS businesses_owner_created_idx
  ON public.businesses (owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS businesses_verified_listing_idx
  ON public.businesses (is_verified, is_active, is_legacy_public, expires_at);

DROP POLICY IF EXISTS "Anyone can read visible businesses" ON public.businesses;

CREATE POLICY "Anyone can read visible businesses"
  ON public.businesses
  FOR SELECT
  TO anon, authenticated
  USING (
    is_verified = true
    AND is_active = true
    AND (
      is_legacy_public = true
      OR expires_at > now()
    )
  );

DROP POLICY IF EXISTS "Owners can insert own paid business" ON public.businesses;
DROP POLICY IF EXISTS "Owners can insert own draft" ON public.businesses;

CREATE POLICY "Owners can insert own draft"
  ON public.businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = owner_id
    AND is_active = false
    AND is_verified = false
    AND expires_at IS NULL
    AND boost_expires_at IS NULL
  );

-- The product currently supports one self-service profile per owner. This
-- trigger prevents a second browser-created draft without restricting service-
-- role admin imports (auth.uid() is null for those writes).
CREATE OR REPLACE FUNCTION public.enforce_single_owner_business()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM public.businesses
       WHERE owner_id = NEW.owner_id
     ) THEN
    RAISE EXCEPTION 'only one self-service business draft is allowed';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_single_owner_business()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_single_owner_business ON public.businesses;
CREATE TRIGGER trg_enforce_single_owner_business
  BEFORE INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_single_owner_business();

-- Draft owners can edit the full private profile experience. Public discovery
-- still requires verification + is_active + a current paid period.
CREATE OR REPLACE FUNCTION public.user_is_subscribed()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT
    public.user_has_listing_credit()
    OR EXISTS (
      SELECT 1
      FROM public.businesses
      WHERE owner_id = (SELECT auth.uid())
    );
$$;

REVOKE ALL ON FUNCTION public.user_is_subscribed() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_is_subscribed() TO authenticated;

-- Legacy successful credits remain consumable, but a payment is no longer
-- required to create the private draft.
CREATE OR REPLACE FUNCTION public.consume_payment_for_business()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  attempt_id uuid;
  attempt_days integer;
BEGIN
  IF NEW.expires_at IS NOT NULL THEN
    RETURN NULL;
  END IF;

  SELECT id, plan_days
    INTO attempt_id, attempt_days
  FROM public.payment_attempts
  WHERE user_id = NEW.owner_id
    AND status = 'succeeded'
    AND kind = 'listing'
    AND business_id IS NULL
  ORDER BY completed_at DESC NULLS LAST, created_at DESC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF attempt_id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.businesses
     SET expires_at = now() + make_interval(days => attempt_days)
   WHERE id = NEW.id;

  UPDATE public.payment_attempts
     SET business_id = NEW.id
   WHERE id = attempt_id
     AND business_id IS NULL;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_payment_for_business()
  FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Payment attempts carry an immutable product code and fulfillment state
-- ---------------------------------------------------------------------------

ALTER TABLE public.payment_attempts
  ADD COLUMN IF NOT EXISTS product_code text,
  ADD COLUMN IF NOT EXISTS bonus_boost_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS service_status text;

UPDATE public.payment_attempts
SET product_code = CASE
  WHEN kind = 'boost' THEN 'boost_30'
  ELSE 'annual_listing'
END
WHERE product_code IS NULL;

ALTER TABLE public.payment_attempts
  ALTER COLUMN product_code SET NOT NULL;

ALTER TABLE public.payment_attempts
  DROP CONSTRAINT IF EXISTS payment_attempts_product_code_fkey,
  DROP CONSTRAINT IF EXISTS payment_attempts_bonus_boost_days_check,
  DROP CONSTRAINT IF EXISTS payment_attempts_service_status_check;

ALTER TABLE public.payment_attempts
  ADD CONSTRAINT payment_attempts_product_code_fkey
    FOREIGN KEY (product_code) REFERENCES public.plans(code)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT payment_attempts_bonus_boost_days_check
    CHECK (bonus_boost_days >= 0),
  ADD CONSTRAINT payment_attempts_service_status_check
    CHECK (
      service_status IS NULL
      OR service_status IN ('pending', 'contacted', 'in_progress', 'completed', 'cancelled')
    );

CREATE INDEX IF NOT EXISTS payment_attempts_product_status_idx
  ON public.payment_attempts (product_code, status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS payment_attempts_one_founding_per_business
  ON public.payment_attempts (business_id)
  WHERE product_code = 'founding_offer'
    AND status IN ('pending', 'succeeded');

-- Resolve every inserted attempt against the active catalog. The advisory lock
-- makes the 100-slot founding reservation atomic across concurrent checkouts.
CREATE OR REPLACE FUNCTION public.enforce_payment_product_catalog()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  selected_plan record;
  selected_business record;
  reserved_count integer;
  is_legacy_request boolean := NEW.product_code IS NULL;
BEGIN
  -- Keep checkouts started by the previous deployment working during the
  -- coordinated schema/application rollout. The new application always sends
  -- an explicit product_code.
  IF NEW.product_code IS NULL THEN
    NEW.product_code := CASE
      WHEN NEW.kind = 'boost' THEN 'boost_30'
      ELSE 'annual_listing'
    END;
  END IF;

  SELECT code, kind, days, boost_days, price, max_redemptions, requires_verification
    INTO selected_plan
  FROM public.plans
  WHERE code = NEW.product_code
    AND is_active = true;

  IF selected_plan.code IS NULL THEN
    RAISE EXCEPTION 'unknown or inactive payment product';
  END IF;

  IF NEW.business_id IS NULL
     AND NOT (is_legacy_request AND selected_plan.kind = 'listing') THEN
    RAISE EXCEPTION 'a business draft is required before checkout';
  END IF;

  IF NEW.business_id IS NOT NULL THEN
    SELECT id, owner_id, is_verified, is_active, expires_at
      INTO selected_business
    FROM public.businesses
    WHERE id = NEW.business_id
      AND owner_id = NEW.user_id;

    IF selected_business.id IS NULL THEN
      RAISE EXCEPTION 'payment business does not belong to the user';
    END IF;

    IF selected_plan.requires_verification AND NOT selected_business.is_verified THEN
      RAISE EXCEPTION 'business must be verified before checkout';
    END IF;

    IF selected_plan.kind = 'boost'
       AND (
         NOT selected_business.is_active
         OR selected_business.expires_at IS NULL
         OR selected_business.expires_at <= now()
       ) THEN
      RAISE EXCEPTION 'an active annual listing is required before buying a boost';
    END IF;
  END IF;

  IF selected_plan.code = 'founding_offer' THEN
    PERFORM pg_advisory_xact_lock(hashtext('pokarov_founding_offer'));

    -- An abandoned hosted-checkout reservation must not consume one of the
    -- 100 founding slots forever. Successful purchases remain permanent.
    UPDATE public.payment_attempts
    SET status = 'failed',
        hyp_response_code = 'reservation_expired',
        completed_at = now()
    WHERE product_code = 'founding_offer'
      AND status = 'pending'
      AND created_at < now() - interval '30 minutes';

    SELECT count(*)
      INTO reserved_count
    FROM public.payment_attempts
    WHERE product_code = 'founding_offer'
      AND (
        status = 'succeeded'
        OR (status = 'pending' AND created_at >= now() - interval '30 minutes')
      );

    IF reserved_count >= selected_plan.max_redemptions THEN
      RAISE EXCEPTION 'the founding offer is sold out';
    END IF;
  END IF;

  NEW.kind := selected_plan.kind;
  NEW.plan_days := selected_plan.days;
  NEW.bonus_boost_days := selected_plan.boost_days;
  NEW.amount_agorot := selected_plan.price;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_payment_product_catalog()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_payment_product_catalog ON public.payment_attempts;
CREATE TRIGGER trg_enforce_payment_product_catalog
  BEFORE INSERT ON public.payment_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_payment_product_catalog();

-- ---------------------------------------------------------------------------
-- 4. Atomic settlement and entitlement rollback
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.settle_payment_attempt(
  p_attempt_id uuid,
  p_hyp_transaction_id text,
  p_hyp_auth_code text,
  p_hyp_card_mask text,
  p_hyp_response_code text,
  p_raw_return jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  payment_record record;
  business_record record;
  new_listing_expiry timestamptz;
  new_boost_expiry timestamptz;
BEGIN
  SELECT *
    INTO payment_record
  FROM public.payment_attempts
  WHERE id = p_attempt_id
  FOR UPDATE;

  IF payment_record.id IS NULL THEN
    RAISE EXCEPTION 'payment attempt not found';
  END IF;

  -- A listing checkout created by the previous deployment may not yet have a
  -- business. Preserve it as a successful credit; the draft-creation trigger
  -- attaches it later. New checkouts always carry a verified business_id.
  IF payment_record.business_id IS NULL AND payment_record.kind = 'listing' THEN
    IF payment_record.status = 'pending' THEN
      UPDATE public.payment_attempts
      SET status = 'succeeded',
          hyp_transaction_id = p_hyp_transaction_id,
          hyp_auth_code = p_hyp_auth_code,
          hyp_card_mask = p_hyp_card_mask,
          hyp_response_code = p_hyp_response_code,
          raw_return = p_raw_return,
          completed_at = now()
      WHERE id = payment_record.id;
    ELSIF payment_record.status <> 'succeeded' THEN
      RAISE EXCEPTION 'payment attempt cannot be settled from status %', payment_record.status;
    END IF;

    RETURN jsonb_build_object(
      'productCode', payment_record.product_code,
      'businessId', NULL,
      'creditAvailable', true
    );
  END IF;

  SELECT *
    INTO business_record
  FROM public.businesses
  WHERE id = payment_record.business_id
    AND owner_id = payment_record.user_id
  FOR UPDATE;

  IF business_record.id IS NULL THEN
    RAISE EXCEPTION 'payment business not found';
  END IF;

  IF payment_record.status = 'succeeded' THEN
    RETURN jsonb_build_object(
      'productCode', payment_record.product_code,
      'businessId', payment_record.business_id,
      'listingExpiresAt', business_record.expires_at,
      'boostExpiresAt', business_record.boost_expires_at
    );
  END IF;

  IF payment_record.status <> 'pending' THEN
    RAISE EXCEPTION 'payment attempt cannot be settled from status %', payment_record.status;
  END IF;

  IF NOT business_record.is_verified THEN
    RAISE EXCEPTION 'business verification is required before settlement';
  END IF;

  new_listing_expiry := business_record.expires_at;
  new_boost_expiry := business_record.boost_expires_at;

  IF payment_record.kind = 'listing' THEN
    new_listing_expiry := GREATEST(
      COALESCE(business_record.expires_at, now()),
      now()
    ) + make_interval(days => payment_record.plan_days);

    IF payment_record.bonus_boost_days > 0 THEN
      new_boost_expiry := GREATEST(
        COALESCE(business_record.boost_expires_at, now()),
        now()
      ) + make_interval(days => payment_record.bonus_boost_days);
    END IF;

    UPDATE public.businesses
    SET expires_at = new_listing_expiry,
        boost_expires_at = new_boost_expiry,
        is_legacy_public = false,
        is_active = true
    WHERE id = business_record.id;
  ELSE
    IF NOT business_record.is_active
       OR business_record.expires_at IS NULL
       OR business_record.expires_at <= now() THEN
      RAISE EXCEPTION 'an active annual listing is required before settling a boost';
    END IF;

    new_boost_expiry := GREATEST(
      COALESCE(business_record.boost_expires_at, now()),
      now()
    ) + make_interval(days => payment_record.plan_days);

    UPDATE public.businesses
    SET boost_expires_at = new_boost_expiry
    WHERE id = business_record.id;
  END IF;

  UPDATE public.payment_attempts
  SET status = 'succeeded',
      hyp_transaction_id = p_hyp_transaction_id,
      hyp_auth_code = p_hyp_auth_code,
      hyp_card_mask = p_hyp_card_mask,
      hyp_response_code = p_hyp_response_code,
      raw_return = p_raw_return,
      completed_at = now(),
      service_status = CASE
        WHEN product_code = 'assisted_launch' THEN 'pending'
        ELSE service_status
      END
  WHERE id = payment_record.id;

  RETURN jsonb_build_object(
    'productCode', payment_record.product_code,
    'businessId', payment_record.business_id,
    'listingExpiresAt', new_listing_expiry,
    'boostExpiresAt', new_boost_expiry
  );
END;
$$;

REVOKE ALL ON FUNCTION public.settle_payment_attempt(uuid, text, text, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_payment_attempt(uuid, text, text, text, text, jsonb)
  TO service_role;

CREATE OR REPLACE FUNCTION public.refund_payment_entitlement(p_attempt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  payment_record record;
  business_record record;
  new_listing_expiry timestamptz;
  new_boost_expiry timestamptz;
BEGIN
  SELECT *
    INTO payment_record
  FROM public.payment_attempts
  WHERE id = p_attempt_id
  FOR UPDATE;

  IF payment_record.id IS NULL OR payment_record.status <> 'succeeded' THEN
    RAISE EXCEPTION 'only a succeeded payment can be refunded';
  END IF;

  SELECT *
    INTO business_record
  FROM public.businesses
  WHERE id = payment_record.business_id
  FOR UPDATE;

  new_listing_expiry := business_record.expires_at;
  new_boost_expiry := business_record.boost_expires_at;

  IF business_record.id IS NOT NULL AND payment_record.kind = 'listing' THEN
    IF business_record.expires_at IS NOT NULL THEN
      new_listing_expiry := business_record.expires_at
        - make_interval(days => payment_record.plan_days);
      IF new_listing_expiry <= now() THEN
        new_listing_expiry := NULL;
      END IF;
    END IF;

    IF payment_record.bonus_boost_days > 0
       AND business_record.boost_expires_at IS NOT NULL THEN
      new_boost_expiry := business_record.boost_expires_at
        - make_interval(days => payment_record.bonus_boost_days);
      IF new_boost_expiry <= now() THEN
        new_boost_expiry := NULL;
      END IF;
    END IF;

    UPDATE public.businesses
    SET expires_at = new_listing_expiry,
        boost_expires_at = new_boost_expiry,
        is_active = new_listing_expiry IS NOT NULL
    WHERE id = business_record.id;
  ELSIF business_record.id IS NOT NULL THEN
    IF business_record.boost_expires_at IS NOT NULL THEN
      new_boost_expiry := business_record.boost_expires_at
        - make_interval(days => payment_record.plan_days);
      IF new_boost_expiry <= now() THEN
        new_boost_expiry := NULL;
      END IF;
    END IF;

    UPDATE public.businesses
    SET boost_expires_at = new_boost_expiry
    WHERE id = business_record.id;
  END IF;

  UPDATE public.payment_attempts
  SET status = 'refunded',
      service_status = CASE
        WHEN service_status IS NULL THEN NULL
        ELSE 'cancelled'
      END
  WHERE id = payment_record.id;

  RETURN jsonb_build_object(
    'productCode', payment_record.product_code,
    'businessId', payment_record.business_id,
    'listingExpiresAt', new_listing_expiry,
    'boostExpiresAt', new_boost_expiry
  );
END;
$$;

REVOKE ALL ON FUNCTION public.refund_payment_entitlement(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_payment_entitlement(uuid)
  TO service_role;
