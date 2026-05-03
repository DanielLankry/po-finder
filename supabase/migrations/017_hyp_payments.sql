-- HYP (YaadPay) payment ledger.
--
-- Each row represents one attempt to redirect a user to HYP's hosted page.
-- Lifecycle:
--   pending   — checkout route inserted, user has been redirected
--   succeeded — return handler verified signature + CCode=0
--   failed    — verified signature but CCode != 0 (declined, cancelled, etc.)
--   refunded  — admin issued a refund via the dashboard
--
-- The trigger consume_payment_for_business() lets a user pay BEFORE creating
-- their business. When they later insert a business with no expires_at, it
-- pulls the most recent succeeded attempt with business_id IS NULL, applies
-- plan_days as expires_at, and links the attempt to the new business.

CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  plan_days integer NOT NULL CHECK (plan_days > 0),
  amount_agorot integer NOT NULL CHECK (amount_agorot > 0),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  hyp_transaction_id text,
  hyp_auth_code text,
  hyp_card_mask text,
  hyp_response_code text,
  raw_return jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS payment_attempts_user_idx
  ON public.payment_attempts (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS payment_attempts_unconsumed_idx
  ON public.payment_attempts (user_id, completed_at DESC)
  WHERE status = 'succeeded' AND business_id IS NULL;

ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;

-- Owner can read their own attempts (for receipts page).
CREATE POLICY "Owners read own payment attempts"
  ON public.payment_attempts FOR SELECT
  USING (auth.uid() = user_id);

-- All writes go through the service-role server (checkout / return / refund routes).
-- No INSERT/UPDATE/DELETE policies — service-role bypasses RLS by design.

-- Auto-apply unconsumed credit on first business insert.
CREATE OR REPLACE FUNCTION public.consume_payment_for_business()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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
    AND business_id IS NULL
  ORDER BY completed_at DESC
  LIMIT 1;

  IF attempt_id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.businesses
     SET expires_at = now() + (attempt_days || ' days')::interval
   WHERE id = NEW.id;

  UPDATE public.payment_attempts
     SET business_id = NEW.id
   WHERE id = attempt_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_consume_payment_for_business ON public.businesses;

CREATE TRIGGER trg_consume_payment_for_business
  AFTER INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.consume_payment_for_business();
