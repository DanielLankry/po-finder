# DAN-76 HYP Pending Payment Reconciliation

## Scope

This change closes the charged-without-browser-return gap for pending HYP payment attempts without performing live inquiries during development.

The reconciliation entrypoint is `GET /api/cron/payment-reconciliation`, guarded by the same `CRON_SECRET` bearer token pattern used by existing cron routes. It selects old `pending` `payment_attempts`, inquires HYP Enterprise by the attempt `uniqueid`, and applies one of three outcomes:

- `charged`: verify the amount when HYP returns one, then call the existing `settle_payment_attempt` RPC for atomic entitlement settlement.
- `not_charged`: mark only a still-pending attempt as `failed`.
- `not_found`, `unknown`, or transport error: leave the attempt pending for retry or manual review.

The existing return route now also requires the provider `Order`/`uniqueid` to agree with local callback aliases and uses a pending-only failure update, so delayed negative callbacks cannot overwrite terminal attempts.

## Configuration

No secrets were changed. Runtime reconciliation requires these existing/new environment values to be configured by an authorized operator before enabling the cron:

- `CRON_SECRET`
- `HYP_ENTERPRISE_RELAY_URL` or `HYP_ENTERPRISE_URL`
- `HYP_ENTERPRISE_USER`
- `HYP_ENTERPRISE_PASSWORD`
- `HYP_TERMINAL_NUMBER`
- Optional: `HYP_RECONCILIATION_MIN_AGE_MINUTES`, `HYP_RECONCILIATION_LIMIT`

## Verification

No live HYP payment inquiry, settlement, refund, deployment, migration, or production mutation was performed.

Local evidence:

- `node --test tests/payment-return.test.mjs tests/payment-reconciliation.test.mjs tests/payment-state.test.mjs tests/hyp-verification.test.mjs`
- `npx tsc --noEmit`
- `npx eslint app/api/payments/return/route.ts app/api/cron/payment-reconciliation/route.ts lib/hyp.ts lib/hyp-inquiry.ts lib/payment-reconciliation.ts lib/payment-return.ts lib/payment-state.ts tests/payment-return.test.mjs tests/payment-reconciliation.test.mjs`

The reconciliation test covers charged-without-return, negative inquiry, transient failure, and duplicate reconciliation.
