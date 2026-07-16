-- Add short one-time listing periods and raise each existing month price by ₪1.
-- Day/week products keep duration_months NULL and use their exact plan_days.
-- All newly settled listing products save before/after expiry snapshots so a
-- refund remains exact and newest-first even when day and month plans are mixed.

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
  (99,  'listing_1d',  'listing', 1,   NULL, 0, 'יום אחד',     300, true, NULL, true),
  (100, 'listing_7d',  'listing', 7,   NULL, 0, 'שבוע אחד',    800, true, NULL, true),
  (101, 'listing_1m',  'listing', 30,  1,    0, 'חודש אחד',   1100, true, NULL, true),
  (102, 'listing_2m',  'listing', 60,  2,    0, '2 חודשים',   1900, true, NULL, true),
  (103, 'listing_3m',  'listing', 90,  3,    0, '3 חודשים',   2600, true, NULL, true),
  (104, 'listing_4m',  'listing', 120, 4,    0, '4 חודשים',   3100, true, NULL, true),
  (105, 'listing_5m',  'listing', 150, 5,    0, '5 חודשים',   3600, true, NULL, true),
  (106, 'listing_6m',  'listing', 180, 6,    0, '6 חודשים',   4100, true, NULL, true),
  (107, 'listing_7m',  'listing', 210, 7,    0, '7 חודשים',   4500, true, NULL, true),
  (108, 'listing_8m',  'listing', 240, 8,    0, '8 חודשים',   4900, true, NULL, true),
  (109, 'listing_9m',  'listing', 270, 9,    0, '9 חודשים',   5200, true, NULL, true),
  (110, 'listing_10m', 'listing', 300, 10,   0, '10 חודשים',  5500, true, NULL, true),
  (111, 'listing_11m', 'listing', 330, 11,   0, '11 חודשים',  5800, true, NULL, true),
  (112, 'listing_12m', 'listing', 360, 12,   0, '12 חודשים',  6100, true, NULL, true)
ON CONFLICT (code) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  kind = EXCLUDED.kind,
  days = EXCLUDED.days,
  duration_months = EXCLUDED.duration_months,
  boost_days = EXCLUDED.boost_days,
  label = EXCLUDED.label,
  price = EXCLUDED.price,
  is_active = true,
  max_redemptions = NULL,
  requires_verification = true;

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

  IF payment_record.kind = 'listing' THEN
    listing_base := GREATEST(
      COALESCE(business_record.expires_at, now()),
      now()
    );

    IF payment_record.duration_months IS NOT NULL THEN
      new_listing_expiry := listing_base
        + make_interval(months => payment_record.duration_months);
    ELSE
      new_listing_expiry := listing_base
        + make_interval(days => payment_record.plan_days);
    END IF;

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
        WHEN payment_record.kind = 'listing' THEN listing_base
        ELSE entitlement_base_at
      END,
      entitlement_expires_at = CASE
        WHEN payment_record.kind = 'listing' THEN new_listing_expiry
        ELSE entitlement_expires_at
      END,
      entitlement_previous_is_active = CASE
        WHEN payment_record.kind = 'listing' THEN business_record.is_active
        ELSE entitlement_previous_is_active
      END,
      entitlement_previous_is_legacy_public = CASE
        WHEN payment_record.kind = 'listing' THEN business_record.is_legacy_public
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

  -- Historical rows without snapshots retain their original rollback path.
  IF payment_record.kind <> 'listing'
     OR payment_record.entitlement_base_at IS NULL
     OR payment_record.entitlement_expires_at IS NULL THEN
    RETURN jsonb_build_object('eligible', true, 'legacy', true);
  END IF;

  SELECT * INTO business_record
  FROM public.businesses
  WHERE id = payment_record.business_id;

  IF business_record.id IS NULL THEN
    RAISE EXCEPTION 'payment business not found';
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

  IF business_record.id IS NOT NULL
     AND payment_record.kind = 'listing'
     AND payment_record.entitlement_base_at IS NOT NULL
     AND payment_record.entitlement_expires_at IS NOT NULL THEN
    IF business_record.expires_at IS DISTINCT FROM payment_record.entitlement_expires_at THEN
      RAISE EXCEPTION 'a newer listing entitlement must be refunded first';
    END IF;

    new_listing_expiry := payment_record.entitlement_base_at;

    UPDATE public.businesses
    SET expires_at = new_listing_expiry,
        is_active = COALESCE(payment_record.entitlement_previous_is_active, false),
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
