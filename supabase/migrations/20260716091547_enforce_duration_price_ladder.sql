-- Keep the launch catalog between ₪20 and ₪250 and strictly increasing with
-- duration. Existing payment attempts retain their immutable amount snapshots.

UPDATE public.plans
SET price = CASE code
  WHEN 'listing_1d' THEN 2000
  WHEN 'listing_2d' THEN 2500
  WHEN 'listing_3d' THEN 3000
  WHEN 'listing_7d' THEN 4000
  WHEN 'listing_1m' THEN 6000
  WHEN 'listing_2m' THEN 8000
  WHEN 'listing_3m' THEN 10000
  WHEN 'listing_4m' THEN 12000
  WHEN 'listing_5m' THEN 14000
  WHEN 'listing_6m' THEN 16000
  WHEN 'listing_7m' THEN 17500
  WHEN 'listing_8m' THEN 19000
  WHEN 'listing_9m' THEN 20500
  WHEN 'listing_10m' THEN 22000
  WHEN 'listing_11m' THEN 23500
  WHEN 'listing_12m' THEN 25000
  ELSE price
END
WHERE code IN (
  'listing_1d', 'listing_2d', 'listing_3d', 'listing_7d',
  'listing_1m', 'listing_2m', 'listing_3m', 'listing_4m',
  'listing_5m', 'listing_6m', 'listing_7m', 'listing_8m',
  'listing_9m', 'listing_10m', 'listing_11m', 'listing_12m'
);

-- Apply admin catalog edits in one transaction. The function is invoker-rights
-- and callable only with the server-side service role; browsers never receive
-- that key.
CREATE OR REPLACE FUNCTION public.admin_update_duration_pricing(p_plans jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  expected_codes CONSTANT text[] := ARRAY[
    'listing_1d', 'listing_2d', 'listing_3d', 'listing_7d',
    'listing_1m', 'listing_2m', 'listing_3m', 'listing_4m',
    'listing_5m', 'listing_6m', 'listing_7m', 'listing_8m',
    'listing_9m', 'listing_10m', 'listing_11m', 'listing_12m'
  ]::text[];
  expected_code text;
  plan_payload jsonb;
  current_label text;
  current_price integer;
  previous_price integer := NULL;
  payload_count integer;
  distinct_code_count integer;
  updated_count integer;
BEGIN
  IF jsonb_typeof(p_plans) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'pricing payload must be an array';
  END IF;

  SELECT count(*), count(DISTINCT item ->> 'code')
  INTO payload_count, distinct_code_count
  FROM jsonb_array_elements(p_plans) AS payload(item);

  IF payload_count <> array_length(expected_codes, 1)
     OR distinct_code_count <> array_length(expected_codes, 1) THEN
    RAISE EXCEPTION 'pricing payload must contain every product exactly once';
  END IF;

  FOREACH expected_code IN ARRAY expected_codes LOOP
    SELECT item
    INTO plan_payload
    FROM jsonb_array_elements(p_plans) AS payload(item)
    WHERE item ->> 'code' = expected_code;

    IF plan_payload IS NULL THEN
      RAISE EXCEPTION 'missing pricing product %', expected_code;
    END IF;

    current_label := btrim(plan_payload ->> 'label');
    current_price := (plan_payload ->> 'price')::integer;

    IF current_label IS NULL OR char_length(current_label) NOT BETWEEN 1 AND 100 THEN
      RAISE EXCEPTION 'invalid label for %', expected_code;
    END IF;
    IF current_price IS NULL OR current_price NOT BETWEEN 2000 AND 25000 THEN
      RAISE EXCEPTION 'price for % must be between 2000 and 25000 agorot', expected_code;
    END IF;
    IF current_price % 100 <> 0 THEN
      RAISE EXCEPTION 'price for % must use whole shekels', expected_code;
    END IF;
    IF previous_price IS NOT NULL AND current_price <= previous_price THEN
      RAISE EXCEPTION 'prices must increase with duration';
    END IF;

    previous_price := current_price;
  END LOOP;

  UPDATE public.plans AS plan
  SET label = btrim(payload.item ->> 'label'),
      price = (payload.item ->> 'price')::integer
  FROM jsonb_array_elements(p_plans) AS payload(item)
  WHERE plan.code = payload.item ->> 'code'
    AND plan.code = ANY(expected_codes);

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count <> array_length(expected_codes, 1) THEN
    RAISE EXCEPTION 'duration pricing catalog is incomplete';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_duration_pricing(jsonb) FROM PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE ON TABLE public.plans TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_duration_pricing(jsonb) TO service_role;
