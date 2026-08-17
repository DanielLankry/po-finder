-- Durable, bounded HYP payment reconciliation.
--
-- The claim RPC both leases rows and increments their attempt counters under
-- row locks. Concurrent cron invocations therefore cannot inquire the same
-- payment attempt, and old unresolved rows back off instead of starving newer
-- candidates. Every claim is written to the audit table before network I/O.

ALTER TABLE public.payment_attempts
  ADD COLUMN IF NOT EXISTS reconciliation_attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reconciliation_last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS reconciliation_next_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS reconciliation_last_outcome text,
  ADD COLUMN IF NOT EXISTS reconciliation_escalated_at timestamptz;

ALTER TABLE public.payment_attempts
  DROP CONSTRAINT IF EXISTS payment_attempts_reconciliation_attempt_count_check,
  ADD CONSTRAINT payment_attempts_reconciliation_attempt_count_check
    CHECK (reconciliation_attempt_count >= 0);

CREATE INDEX IF NOT EXISTS payment_attempts_reconciliation_due_idx
  ON public.payment_attempts (
    reconciliation_next_attempt_at,
    created_at
  )
  WHERE status = 'pending' AND reconciliation_escalated_at IS NULL;

CREATE TABLE IF NOT EXISTS public.payment_reconciliation_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  payment_attempt_id uuid NOT NULL
    REFERENCES public.payment_attempts(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL CHECK (attempt_number > 0),
  outcome text NOT NULL,
  reason text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  next_retry_at timestamptz,
  UNIQUE (payment_attempt_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS payment_reconciliation_events_attempt_idx
  ON public.payment_reconciliation_events (payment_attempt_id, started_at DESC);

ALTER TABLE public.payment_reconciliation_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.payment_reconciliation_events
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.payment_reconciliation_events
  TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.payment_reconciliation_events_id_seq
  TO service_role;

CREATE OR REPLACE FUNCTION public.claim_payment_attempts_for_reconciliation(
  p_created_before timestamptz,
  p_limit integer,
  p_max_attempts integer,
  p_lease_seconds integer
)
RETURNS TABLE (
  id uuid,
  status text,
  amount_agorot integer,
  reconciliation_attempt_count integer
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  WITH candidates AS MATERIALIZED (
    SELECT payment.id
    FROM public.payment_attempts AS payment
    WHERE payment.status = 'pending'
      AND payment.created_at < p_created_before
      AND payment.reconciliation_attempt_count < GREATEST(p_max_attempts, 1)
      AND payment.reconciliation_escalated_at IS NULL
      AND (
        payment.reconciliation_next_attempt_at IS NULL
        OR payment.reconciliation_next_attempt_at <= now()
      )
    ORDER BY
      COALESCE(payment.reconciliation_next_attempt_at, payment.created_at),
      payment.created_at,
      payment.id
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(p_limit, 1), 50)
  ), claimed AS (
    UPDATE public.payment_attempts AS payment
    SET reconciliation_attempt_count = payment.reconciliation_attempt_count + 1,
        reconciliation_last_attempt_at = now(),
        reconciliation_next_attempt_at = now()
          + make_interval(secs => GREATEST(p_lease_seconds, 60)),
        reconciliation_escalated_at = CASE
          WHEN payment.reconciliation_attempt_count + 1 >= GREATEST(p_max_attempts, 1)
            THEN now()
          ELSE payment.reconciliation_escalated_at
        END
    FROM candidates
    WHERE payment.id = candidates.id
    RETURNING
      payment.id,
      payment.status,
      payment.amount_agorot,
      payment.reconciliation_attempt_count,
      payment.reconciliation_last_attempt_at
  ), audited AS (
    INSERT INTO public.payment_reconciliation_events (
      payment_attempt_id,
      attempt_number,
      outcome,
      started_at
    )
    SELECT
      claimed.id,
      claimed.reconciliation_attempt_count,
      'claimed',
      claimed.reconciliation_last_attempt_at
    FROM claimed
    RETURNING payment_attempt_id, attempt_number
  )
  SELECT
    claimed.id,
    claimed.status,
    claimed.amount_agorot,
    claimed.reconciliation_attempt_count
  FROM claimed
  INNER JOIN audited
    ON audited.payment_attempt_id = claimed.id
   AND audited.attempt_number = claimed.reconciliation_attempt_count;
$$;

REVOKE ALL ON FUNCTION public.claim_payment_attempts_for_reconciliation(
  timestamptz,
  integer,
  integer,
  integer
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_payment_attempts_for_reconciliation(
  timestamptz,
  integer,
  integer,
  integer
) TO service_role;

CREATE OR REPLACE FUNCTION public.record_payment_reconciliation_outcome(
  p_attempt_id uuid,
  p_attempt_number integer,
  p_outcome text,
  p_reason text,
  p_next_retry_at timestamptz,
  p_escalated boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.payment_attempts
  SET reconciliation_last_outcome = p_outcome,
      reconciliation_next_attempt_at = p_next_retry_at,
      reconciliation_escalated_at = CASE
        WHEN p_escalated THEN COALESCE(reconciliation_escalated_at, now())
        WHEN p_outcome IN ('charged', 'not_charged') THEN NULL
        ELSE reconciliation_escalated_at
      END
  WHERE id = p_attempt_id
    AND reconciliation_attempt_count = p_attempt_number;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'payment reconciliation claim does not match';
  END IF;

  UPDATE public.payment_reconciliation_events
  SET outcome = p_outcome,
      reason = left(p_reason, 1000),
      completed_at = now(),
      next_retry_at = p_next_retry_at
  WHERE payment_attempt_id = p_attempt_id
    AND attempt_number = p_attempt_number
    AND outcome = 'claimed';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'payment reconciliation audit claim does not match';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.record_payment_reconciliation_outcome(
  uuid,
  integer,
  text,
  text,
  timestamptz,
  boolean
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_payment_reconciliation_outcome(
  uuid,
  integer,
  text,
  text,
  timestamptz,
  boolean
) TO service_role;
