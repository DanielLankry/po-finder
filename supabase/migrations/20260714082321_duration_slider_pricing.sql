-- Pricing v4: one public-listing product with a 1-12 calendar-month duration.
--
-- The legacy product rows stay available during the coordinated application
-- rollout so an already-open checkout cannot change price underneath a buyer.
-- The application only exposes the listing_Nm codes below. A short follow-up
-- migration deactivates the legacy catalog after the new deployment is live.

ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS duration_months integer;

ALTER TABLE public.plans
  DROP CONSTRAINT IF EXISTS plans_duration_months_check;

ALTER TABLE public.plans
  ADD CONSTRAINT plans_duration_months_check
    CHECK (
      duration_months IS NULL
      OR (
        duration_months BETWEEN 1 AND 12
        AND kind = 'listing'
        AND boost_days = 0
      )
    );

INSERT INTO public.plans (
  sort_order,
  code,
  kind,
  days,
  duration_months,
  boost_days,
  label,
  price,
  is_active,
  max_redemptions,
  requires_verification
) VALUES
  (101, 'listing_1m',  'listing', 30,  1,  0, 'חודש אחד',    1000, true, NULL, true),
  (102, 'listing_2m',  'listing', 60,  2,  0, '2 חודשים',    1800, true, NULL, true),
  (103, 'listing_3m',  'listing', 90,  3,  0, '3 חודשים',    2500, true, NULL, true),
  (104, 'listing_4m',  'listing', 120, 4,  0, '4 חודשים',    3000, true, NULL, true),
  (105, 'listing_5m',  'listing', 150, 5,  0, '5 חודשים',    3500, true, NULL, true),
  (106, 'listing_6m',  'listing', 180, 6,  0, '6 חודשים',    4000, true, NULL, true),
  (107, 'listing_7m',  'listing', 210, 7,  0, '7 חודשים',    4400, true, NULL, true),
  (108, 'listing_8m',  'listing', 240, 8,  0, '8 חודשים',    4800, true, NULL, true),
  (109, 'listing_9m',  'listing', 270, 9,  0, '9 חודשים',    5100, true, NULL, true),
  (110, 'listing_10m', 'listing', 300, 10, 0, '10 חודשים',   5400, true, NULL, true),
  (111, 'listing_11m', 'listing', 330, 11, 0, '11 חודשים',   5700, true, NULL, true),
  (112, 'listing_12m', 'listing', 360, 12, 0, '12 חודשים',   6000, true, NULL, true)
ON CONFLICT (code) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  kind = EXCLUDED.kind,
  days = EXCLUDED.days,
  duration_months = EXCLUDED.duration_months,
  boost_days = 0,
  label = EXCLUDED.label,
  price = EXCLUDED.price,
  is_active = true,
  max_redemptions = NULL,
  requires_verification = true;

ALTER TABLE public.payment_attempts
  ADD COLUMN IF NOT EXISTS duration_months integer,
  ADD COLUMN IF NOT EXISTS entitlement_base_at timestamptz,
  ADD COLUMN IF NOT EXISTS entitlement_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS entitlement_previous_is_active boolean,
  ADD COLUMN IF NOT EXISTS entitlement_previous_is_legacy_public boolean;

ALTER TABLE public.payment_attempts
  DROP CONSTRAINT IF EXISTS payment_attempts_duration_months_check;

ALTER TABLE public.payment_attempts
  ADD CONSTRAINT payment_attempts_duration_months_check
    CHECK (
      duration_months IS NULL
      OR (
        duration_months BETWEEN 1 AND 12
        AND kind = 'listing'
        AND bonus_boost_days = 0
      )
    );

CREATE INDEX IF NOT EXISTS payment_attempts_duration_status_idx
  ON public.payment_attempts (duration_months, status, created_at DESC)
  WHERE duration_months IS NOT NULL;

-- Every new duration attempt is resolved against the database catalog. Legacy
-- callers that omit product_code keep their old mapping only during rollout.
CREATE OR REPLACE FUNCTION public.enforce_payment_product_catalog()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  selected_plan record;
  selected_business record;
  is_legacy_request boolean := NEW.product_code IS NULL;
BEGIN
  IF NEW.product_code IS NULL THEN
    NEW.product_code := CASE
      WHEN NEW.kind = 'boost' THEN 'boost_30'
      ELSE 'annual_listing'
    END;
  END IF;

  SELECT code, kind, days, duration_months, boost_days, price,
         max_redemptions, requires_verification
    INTO selected_plan
  FROM public.plans
  WHERE code = NEW.product_code
    AND is_active = true;

  IF selected_plan.code IS NULL THEN
    RAISE EXCEPTION 'unknown or inactive payment product';
  END IF;

  -- Explicit product-code checkouts are the new application path and always
  -- require the verified draft they will activate.
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

    -- Historical boost attempts remain settleable during rollout, but the new
    -- listing_Nm catalog contains no boost product.
    IF selected_plan.kind = 'boost'
       AND (
         NOT selected_business.is_active
         OR selected_business.expires_at IS NULL
         OR selected_business.expires_at <= now()
       ) THEN
      RAISE EXCEPTION 'an active listing is required before buying a boost';
    END IF;
  END IF;

  NEW.kind := selected_plan.kind;
  NEW.plan_days := selected_plan.days;
  NEW.duration_months := selected_plan.duration_months;
  NEW.bonus_boost_days := selected_plan.boost_days;
  NEW.amount_agorot := selected_plan.price;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_payment_product_catalog()
  FROM PUBLIC, anon, authenticated;

-- A legacy listing credit created before the draft existed can still attach to
-- the first draft. Calendar-month attempts use months rather than an estimated
-- number of days.
CREATE OR REPLACE FUNCTION public.consume_payment_for_business()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  attempt_id uuid;
  attempt_days integer;
  attempt_months integer;
BEGIN
  IF NEW.expires_at IS NOT NULL THEN
    RETURN NULL;
  END IF;

  SELECT id, plan_days, duration_months
    INTO attempt_id, attempt_days, attempt_months
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
  SET expires_at = CASE
        WHEN attempt_months IS NOT NULL
          THEN now() + make_interval(months => attempt_months)
        ELSE now() + make_interval(days => attempt_days)
      END
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

-- Settlement remains idempotent and keeps historical listing/boost attempts
-- valid. New duration products add exact calendar months to max(now, expiry).
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
  listing_base timestamptz;
BEGIN
  SELECT * INTO payment_record
  FROM public.payment_attempts
  WHERE id = p_attempt_id
  FOR UPDATE;

  IF payment_record.id IS NULL THEN
    RAISE EXCEPTION 'payment attempt not found';
  END IF;

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

  SELECT * INTO business_record
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

  IF payment_record.duration_months IS NOT NULL THEN
    listing_base := GREATEST(
      COALESCE(business_record.expires_at, now()),
      now()
    );
    new_listing_expiry := listing_base
      + make_interval(months => payment_record.duration_months);

    UPDATE public.businesses
    SET expires_at = new_listing_expiry,
        is_legacy_public = false,
        is_active = true
    WHERE id = business_record.id;
  ELSIF payment_record.kind = 'listing' THEN
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
      RAISE EXCEPTION 'an active listing is required before settling a historical boost';
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
      entitlement_base_at = CASE
        WHEN payment_record.duration_months IS NOT NULL THEN listing_base
        ELSE entitlement_base_at
      END,
      entitlement_expires_at = CASE
        WHEN payment_record.duration_months IS NOT NULL THEN new_listing_expiry
        ELSE entitlement_expires_at
      END,
      entitlement_previous_is_active = CASE
        WHEN payment_record.duration_months IS NOT NULL THEN business_record.is_active
        ELSE entitlement_previous_is_active
      END,
      entitlement_previous_is_legacy_public = CASE
        WHEN payment_record.duration_months IS NOT NULL THEN business_record.is_legacy_public
        ELSE entitlement_previous_is_legacy_public
      END,
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

-- HYP must not be called until an exact entitlement rollback is known to be
-- possible. This read-only preflight rejects out-of-order duration refunds;
-- refund_payment_entitlement repeats the same check transactionally after the
-- provider confirms the money was returned.
CREATE OR REPLACE FUNCTION public.preflight_refund_payment_entitlement(
  p_attempt_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  payment_record record;
  business_record record;
BEGIN
  SELECT * INTO payment_record
  FROM public.payment_attempts
  WHERE id = p_attempt_id;

  IF payment_record.id IS NULL OR payment_record.status <> 'succeeded' THEN
    RAISE EXCEPTION 'only a succeeded payment can be refunded';
  END IF;

  -- Historical day-based rows retain their legacy rollback behavior.
  IF payment_record.duration_months IS NULL THEN
    RETURN jsonb_build_object('eligible', true, 'legacy', true);
  END IF;

  SELECT * INTO business_record
  FROM public.businesses
  WHERE id = payment_record.business_id;

  IF business_record.id IS NULL THEN
    RAISE EXCEPTION 'payment business not found';
  END IF;
  IF payment_record.entitlement_base_at IS NULL
     OR payment_record.entitlement_expires_at IS NULL THEN
    RAISE EXCEPTION 'duration entitlement snapshot is missing';
  END IF;
  IF business_record.expires_at IS DISTINCT FROM payment_record.entitlement_expires_at THEN
    RAISE EXCEPTION 'a newer listing entitlement must be refunded first';
  END IF;

  RETURN jsonb_build_object(
    'eligible', true,
    'restoreExpiresAt', payment_record.entitlement_base_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.preflight_refund_payment_entitlement(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.preflight_refund_payment_entitlement(uuid)
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
  SELECT * INTO payment_record
  FROM public.payment_attempts
  WHERE id = p_attempt_id
  FOR UPDATE;

  IF payment_record.id IS NULL OR payment_record.status <> 'succeeded' THEN
    RAISE EXCEPTION 'only a succeeded payment can be refunded';
  END IF;

  SELECT * INTO business_record
  FROM public.businesses
  WHERE id = payment_record.business_id
  FOR UPDATE;

  new_listing_expiry := business_record.expires_at;
  new_boost_expiry := business_record.boost_expires_at;

  IF business_record.id IS NOT NULL AND payment_record.duration_months IS NOT NULL THEN
    IF payment_record.entitlement_base_at IS NULL
       OR payment_record.entitlement_expires_at IS NULL THEN
      RAISE EXCEPTION 'duration entitlement snapshot is missing';
    END IF;
    IF business_record.expires_at IS DISTINCT FROM payment_record.entitlement_expires_at THEN
      RAISE EXCEPTION 'a newer listing entitlement must be refunded first';
    END IF;

    new_listing_expiry := payment_record.entitlement_base_at;

    UPDATE public.businesses
    SET expires_at = new_listing_expiry,
        is_active = COALESCE(
          payment_record.entitlement_previous_is_active,
          false
        ),
        is_legacy_public = COALESCE(
          payment_record.entitlement_previous_is_legacy_public,
          false
        )
    WHERE id = business_record.id;
  ELSIF business_record.id IS NOT NULL AND payment_record.kind = 'listing' THEN
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

-- One row per expiry snapshot prevents duplicate reminders when the daily cron
-- retries. A renewal changes expires_at, making the new reminder cycle distinct.
CREATE TABLE IF NOT EXISTS public.expiry_reminder_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  days_before integer NOT NULL CHECK (days_before IN (30, 7, 1)),
  expires_at timestamptz NOT NULL,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, days_before, expires_at)
);

ALTER TABLE public.expiry_reminder_deliveries ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.expiry_reminder_deliveries
  FROM PUBLIC, anon, authenticated;

CREATE INDEX IF NOT EXISTS expiry_reminder_deliveries_lookup_idx
  ON public.expiry_reminder_deliveries (business_id, expires_at, days_before);
