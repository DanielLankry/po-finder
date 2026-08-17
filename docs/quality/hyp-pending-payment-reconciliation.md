# HYP Pending-Payment Reconciliation Runbook

## Purpose and safety boundary

`GET /api/cron/payment-reconciliation` resolves HYP charges whose browser return
never reached the application. It is authenticated with `CRON_SECRET` and is
scheduled by `vercel.json` at minute 17 of every hour.

The worker considers only old `pending` attempts. A database claim leases each
row before HYP is contacted, so concurrent cron invocations cannot inquire the
same attempt. Every claim and result is stored in
`payment_reconciliation_events`. Unresolved attempts back off for 15 minutes,
1 hour, 4 hours, and 16 hours, then remain pending and are escalated after the
fifth attempt. Backoff is capped at 24 hours if the configured maximum is
increased.

Do not perform a live inquiry, settlement, refund, deployment, migration,
production mutation, or secret/configuration change without recorded Daniel
approval and Sentinel review.

## Provider decision rules

The parser grants entitlement only for a successful `AutoComm` debit whose
`financialStatus` is `Captured` or `Transmitted`, whose amount matches the local
attempt when present, and whose response rows all echo the expected payment
attempt correlation. Response order is not treated as chronological: any
applicable successful `Cancel` (`52`), `AuthCredit` (`53`), or `Reversal` (`58`)
vetoes automatic settlement wherever it appears. `Cancelled`, `Canceled`,
`Refunded`, and `Reversed` financial states are never treated as charged.

New checkouts place a deterministic 19-character payment-attempt correlation in
HYP's documented payment-page `user` field. Reconciliation queries by that
`user` value and requires every returned transaction row to echo it. A missing
or mismatched echo retains the local attempt as `pending`, records
`correlation_unverified`, and follows the normal retry/escalation policy. The
settlement helper repeats the correlation check so a parser or fixture cannot
bypass it.

Settlement stores the debit `tranId`, because the existing `CancelTrans` refund
flow requires that technical transaction identifier. `mpiTransactionId` and
`cgUid` are not substitutes for `tranId`.

Outcomes are applied as follows:

- `charged`: call the existing idempotent `settle_payment_attempt` RPC.
- `not_charged`, including cancelled/refunded: fail only a still-pending row.
- `not_found`, `unknown`, unverified correlation, transport failure, or
  settlement failure: retain `pending`, record the result, and retry with
  backoff until escalation.
- amount mismatch: retain `pending`, stop automatic retries, and escalate.

HYP's public inquiry documentation explicitly supports `user` as a payment-page
field and as an `inquireTransactions` lookup key, including echoed `user` values
in the response rows. This replaces the previous undocumented `uniqueid`
inquiry. Attempts created before this checkout correlation is deployed cannot
be settled automatically by this worker; they fail closed and require the
manual evidence path below. Before enabling the schedule, use a separately
approved non-production fixture to verify that the legacy `/p/` APISign bridge
preserves `user` for this merchant terminal.

References:

- https://developers.hyp.co.il/inquiring-transactions/overview
- https://developers.hyp.co.il/inquiring-transactions/examples
- https://developers.hyp.co.il/additional-payment-scenarios/refunds-and-cancellations

## Rollout prerequisites

In this order, with the required approvals:

1. Apply `20260817090000_payment_reconciliation_audit.sql`.
2. Configure `CRON_SECRET`, `HYP_ENTERPRISE_RELAY_URL`,
   `HYP_ENTERPRISE_USER`, `HYP_ENTERPRISE_PASSWORD`, and
   `HYP_TERMINAL_NUMBER` in the deployment environment.
3. Confirm the terminal-specific legacy APISign `user` propagation described
   above, and limit the first observation to attempts created after the
   correlated checkout change is deployed.
4. Deploy the reviewed commit. The Vercel schedule then invokes the route hourly.
5. Observe the first run and audit rows before leaving the schedule enabled.

Optional controls and defaults:

- `HYP_RECONCILIATION_MIN_AGE_MINUTES=15`
- `HYP_RECONCILIATION_LIMIT=10` (hard maximum 50)
- `HYP_RECONCILIATION_MAX_ATTEMPTS=5`
- `HYP_RECONCILIATION_LEASE_SECONDS=600` (minimum 60)

## Manual invocation and expected responses

Use a non-production or explicitly approved deployment URL. Never paste the
secret into tickets or logs.

```bash
curl --fail-with-body \
  -H "Authorization: Bearer $CRON_SECRET" \
  "https://<approved-host>/api/cron/payment-reconciliation?limit=1"
```

Responses:

- `200`: `{ ok, checked, settled, failed, pending, errors, results }`.
  `checked: 0` is healthy when nothing is due.
- `401 unauthorized`: bearer token absent or incorrect.
- `503 cron_not_configured`: `CRON_SECRET` is missing.
- `500 payment_claim_failed`: migration missing or database claim failed.
- A `200` with `errors > 0`: inspect each result and the audit trail; retry
  exhaustion, amount mismatch, settlement failure, and audit failure require
  operator attention.

## Audit and escalation

The following read-only query shows current pending/escalated state and its
durable attempt history. Run it only through an approved administrative path.

```sql
select
  payment.id,
  payment.created_at,
  payment.amount_agorot,
  payment.reconciliation_attempt_count,
  payment.reconciliation_last_attempt_at,
  payment.reconciliation_next_attempt_at,
  payment.reconciliation_last_outcome,
  payment.reconciliation_escalated_at,
  event.attempt_number,
  event.outcome,
  event.reason,
  event.started_at,
  event.completed_at
from public.payment_attempts as payment
left join public.payment_reconciliation_events as event
  on event.payment_attempt_id = payment.id
where payment.status = 'pending'
order by payment.created_at, event.attempt_number;
```

For an escalated attempt:

1. Stop automatic action on that row; escalation already excludes it from
   subsequent claims.
2. Compare the local amount and identifiers with authoritative HYP evidence.
3. If charged and eligible, use the reviewed settlement path. If definitively
   negative/cancelled/refunded, use the pending-only failure path. Do not edit
   entitlement tables directly.
4. If the failure was transient and another automatic attempt is justified,
   obtain approval, increase `HYP_RECONCILIATION_MAX_ATTEMPTS` above the stored
   count, and clear only that row's `reconciliation_escalated_at`. Preserve the
   audit events and restore the normal limit afterward.
5. Record the evidence and action in the incident/task thread.

## Disable and rollback

To disable without changing payment state, remove the payment-reconciliation
entry from `vercel.json` and deploy that reviewed change, or disable the Vercel
Cron job through an approved configuration change. Existing pending attempts
and audit records remain intact.

For code rollback, disable the schedule first and deploy the preceding reviewed
application commit. Retain the additive columns, functions, and audit table;
dropping them would destroy operational evidence and requires a separate
approved data-removal plan.

## Local verification

No live HYP payment inquiry, settlement, refund, deployment, migration, secret
change, or production mutation is part of local verification.

```bash
node --test \
  tests/payment-return.test.mjs \
  tests/payment-reconciliation.test.mjs \
  tests/payment-state.test.mjs \
  tests/hyp-verification.test.mjs
npx tsc --noEmit
npx eslint \
  app/api/payments/return/route.ts \
  app/api/cron/payment-reconciliation/route.ts \
  lib/hyp.ts lib/hyp-inquiry.ts lib/payment-reconciliation.ts \
  lib/payment-return.ts lib/payment-state.ts \
  tests/payment-return.test.mjs tests/payment-reconciliation.test.mjs
```
