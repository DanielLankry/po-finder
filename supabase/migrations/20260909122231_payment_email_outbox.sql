-- Only future verified settlements/refunds enqueue mail; never backfill customers.
CREATE TABLE public.payment_email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.payment_attempts(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('payment_succeeded','listing_renewed','payment_refunded')),
  recipient text,
  payload jsonb NOT NULL,
  email_request jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','accepted','needs_attention')),
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  lease_token uuid,
  lease_until timestamptz,
  uncertain_since timestamptz,
  last_error text,
  provider_message_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE (attempt_id, event_type)
);
ALTER TABLE public.payment_email_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payment_email_outbox FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_email_outbox TO service_role;
CREATE INDEX payment_email_outbox_due ON public.payment_email_outbox(next_attempt_at)
  WHERE status IN ('pending','sending');

-- The private trigger needs auth.users email access. It is not a callable API;
-- browser roles cannot modify the payment status that fires it.
CREATE OR REPLACE FUNCTION private.enqueue_payment_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  business_record record;
  recipient_email text;
  event_name text;
  listing_state text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status OR NEW.kind <> 'listing' THEN RETURN NEW; END IF;
  IF NOT ((OLD.status = 'pending' AND NEW.status = 'succeeded')
    OR (OLD.status = 'succeeded' AND NEW.status = 'refunded')) THEN RETURN NEW; END IF;

  SELECT email INTO recipient_email FROM auth.users WHERE id = NEW.user_id;
  SELECT name, is_verified, is_active, expires_at INTO business_record
    FROM public.businesses WHERE id = NEW.business_id AND owner_id = NEW.user_id;
  event_name := CASE WHEN NEW.status = 'refunded' THEN 'payment_refunded'
    WHEN NEW.business_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.payment_attempts p WHERE p.business_id = NEW.business_id
        AND p.id <> NEW.id AND p.kind = 'listing' AND p.status = 'succeeded'
    ) THEN 'listing_renewed' ELSE 'payment_succeeded' END;
  listing_state := CASE
    WHEN business_record.name IS NULL THEN 'awaiting_profile'
    WHEN NOT business_record.is_verified THEN 'awaiting_approval'
    WHEN business_record.expires_at <= now() THEN 'expired'
    WHEN business_record.is_active THEN 'active'
    ELSE 'paused' END;

  INSERT INTO public.payment_email_outbox(attempt_id,event_type,recipient,payload)
  VALUES (NEW.id,event_name,recipient_email,jsonb_build_object(
    'attemptId',NEW.id, 'eventType',event_name, 'businessName',business_record.name,
    'amountAgorot',NEW.amount_agorot, 'durationMonths',NEW.duration_months,
    'planDays',NEW.plan_days, 'expiresAt',business_record.expires_at,
    'listingState',listing_state, 'occurredAt',now()
  )) ON CONFLICT (attempt_id,event_type) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.enqueue_payment_email() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER payment_email_after_settlement
  AFTER UPDATE OF status ON public.payment_attempts FOR EACH ROW
  EXECUTE FUNCTION private.enqueue_payment_email();

-- SKIP LOCKED plus a lease stops callback/cron/admin workers from racing.
-- An uncertain send is retried only inside Resend's 24h idempotency retention.
CREATE FUNCTION public.claim_payment_emails(p_limit integer DEFAULT 5, p_attempt_id uuid DEFAULT NULL)
RETURNS SETOF jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE queued public.payment_email_outbox; claimed public.payment_email_outbox;
BEGIN
  UPDATE public.payment_email_outbox SET status='needs_attention', last_error='delivery_uncertain_expired',
    lease_token=NULL, lease_until=NULL
  WHERE status IN ('pending','sending') AND (lease_until IS NULL OR lease_until < now())
    AND uncertain_since < now() - interval '23 hours';
  FOR queued IN SELECT * FROM public.payment_email_outbox
    WHERE status IN ('pending','sending') AND next_attempt_at <= now()
      AND (lease_until IS NULL OR lease_until < now())
      AND (p_attempt_id IS NULL OR attempt_id = p_attempt_id)
    ORDER BY created_at,id LIMIT LEAST(GREATEST(p_limit,1),20) FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.payment_email_outbox SET status='sending', attempts=attempts+1,
      lease_token=gen_random_uuid(), lease_until=now()+interval '2 minutes',
      uncertain_since=COALESCE(uncertain_since,now())
    WHERE id=queued.id RETURNING * INTO claimed;
    RETURN NEXT to_jsonb(claimed) || jsonb_build_object('previous_uncertain',queued.uncertain_since IS NOT NULL);
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_payment_emails(integer,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_payment_emails(integer,uuid) TO service_role;
