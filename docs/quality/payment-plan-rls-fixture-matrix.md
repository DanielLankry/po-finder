# Pokarov Payment-Plan and RLS E2E Fixture Matrix

Owner: Forge  
Issue: DAN-112  
Status: ready for Sentinel review

This matrix defines the safe destructive E2E fixture set for Pokarov listing payments and RLS behavior. It is documentation-first: migrations are not executed from this task, and destructive tests remain gated behind `RUN_DESTRUCTIVE=1`.

## Safety Contract

- Run only against a disposable Supabase project and a non-production app URL.
- Keep `RUN_DESTRUCTIVE=1` unset unless the target has been confirmed disposable.
- Never run against the production Supabase project ref `ymqlqdhelsocibhnanjy`.
- Never run against any `pokarov.co.il` base URL.
- Use QA-owned identities from `qa+*@pokarov.test`; clean them through `cleanupTestUser`.
- Simulate successful HYP settlement only through `settle_payment_attempt`; do not call HYP or charge cards.
- Prepare migrations if needed, but do not execute `supabase db push`, `supabase db reset`, or production migrations as part of this matrix.

## Canonical Sources

- Plan catalog: [`lib/plans.ts`](../../lib/plans.ts)
- Server plan fallback: [`lib/plans-server.ts`](../../lib/plans-server.ts)
- Destructive Supabase helpers: [`tests/utils/supabase-admin.ts`](../../tests/utils/supabase-admin.ts)
- Paid lifecycle E2E: [`tests/destructive/paid-listing-lifecycle.spec.ts`](../../tests/destructive/paid-listing-lifecycle.spec.ts)
- Duration catalog E2E: [`tests/destructive/pricing-duration-products.spec.ts`](../../tests/destructive/pricing-duration-products.spec.ts)
- Paid owner E2E: [`tests/destructive/paid-business-owner.spec.ts`](../../tests/destructive/paid-business-owner.spec.ts)
- Unpaid owner E2E: [`tests/destructive/unpaid-business-owner.spec.ts`](../../tests/destructive/unpaid-business-owner.spec.ts)
- Launch RLS migration assertions: [`tests/launch-privacy-migration.test.mjs`](../../tests/launch-privacy-migration.test.mjs)

## Fixture Roles

| Fixture | Auth role | Creation helper | Allowed purpose | Must not do |
| --- | --- | --- | --- | --- |
| `free-draft-owner` | `business_owner` | `createConfirmedUser` plus authenticated insert | Prove one private draft can be created without a payment. | Publish publicly, create a second draft, or update protected lifecycle columns. |
| `paid-active-owner` | `business_owner` | `seedPaidActiveBusiness` | Prove an approved, active, future-expiring listing appears on dashboard and public surfaces. | Bypass payment settlement for entitlement arithmetic checks. |
| `paid-lifecycle-owner` | `business_owner` | `createPendingBusinessAsOwner`, `approveBusiness`, `grantDurationPlan` | Prove a settled listing grant activates exactly one approved business and expires from public surfaces. | Grant a second listing from `users.subscription_status`. |
| `verified-inactive-owner` | `business_owner` | `createPendingBusinessAsOwner` then `approveBusiness` | Prove verified but inactive rows stay private. | Expose verified/inactive rows as public fixtures or include protected columns on public routes. |
| `expired-paid-owner` | `business_owner` | `expireBusinessListing` after a real grant | Prove expired rows stay visible to the owner for billing continuity but disappear from public APIs, detail, sitemap, and owner-authenticated public requests. | Let owner extend `expires_at` or change `is_active`. |
| `renewal-owner` | `business_owner` | Two `grantDurationPlan` calls on one business | Prove renewal extends from future expiry and refund preflight enforces newest-first order. | Refund an older entitlement while a newer entitlement remains applied. |
| `legacy-public-owner` | `business_owner` | `seedPaidActiveBusiness` + legacy grant setup | Prove legacy rows can stay public when configured by migration contract. | Apply non-legacy expiry policy to legacy rows without migration guard coverage. |
| `payment-state-owner` | `business_owner` | `createPendingBusinessAsOwner`, `grantDurationPlan`, and `payment_attempts` updates | Prove transient payment states and reconciliation boundaries are handled without leaking visibility. | Treat non-final states as entitlement and publish row. |
| `catalog-admin` | `service_role` | `admin()` | Read active plan rows and execute settlement/refund RPCs in disposable QA. | Mutate production or use browser-exposed keys. |

## Payment-Plan Matrix

Every plan below must be active, kind `listing`, `boost_days = 0`, `requires_verification = true`, and available in the exact slider/catalog order. Exact-day plans use immutable `plan_days`; month plans use immutable `duration_months`.

| Order | Code | `plan_days` | `duration_months` | Price agorot | Required fixture coverage |
| --- | --- | ---: | ---: | ---: | --- |
| 1 | `listing_1d` | 1 | null | 300 | Catalog row and exact-day expiry arithmetic. |
| 2 | `listing_2d` | 2 | null | 500 | Catalog row and exact-day expiry arithmetic. |
| 3 | `listing_3d` | 3 | null | 600 | Catalog row and exact-day expiry arithmetic. |
| 4 | `listing_7d` | 7 | null | 800 | Catalog row and exact-day expiry arithmetic. |
| 5 | `listing_1m` | 30 | 1 | 1100 | Month-end clamp from `2027-01-31T12:00:00Z` to `2027-02-28T12:00:00Z`. |
| 6 | `listing_2m` | 60 | 2 | 1900 | Renewal extension and newest-first refund preflight. |
| 7 | `listing_3m` | 90 | 3 | 2600 | Catalog row. |
| 8 | `listing_4m` | 120 | 4 | 3100 | Catalog row. |
| 9 | `listing_5m` | 150 | 5 | 3600 | Catalog row. |
| 10 | `listing_6m` | 180 | 6 | 4100 | Default paid lifecycle grant. |
| 11 | `listing_7m` | 210 | 7 | 4500 | Catalog row. |
| 12 | `listing_8m` | 240 | 8 | 4900 | Catalog row. |
| 13 | `listing_9m` | 270 | 9 | 5200 | Catalog row. |
| 14 | `listing_10m` | 300 | 10 | 5500 | Catalog row. |
| 15 | `listing_11m` | 330 | 11 | 5800 | Catalog row. |
| 16 | `listing_12m` | 360 | 12 | 6100 | Catalog row. |

Retired `boost_30` rows may remain for historical audit, but new purchase attempts must fail for retired boosts.

## RLS and Public-Surface Matrix

| Scenario ID | Setup | Assertion | Existing coverage |
| --- | --- | --- | --- |
| `rls-private-draft` | Authenticated owner inserts inactive unverified business and calls public endpoints. | Public list omits row; detail returns `404`; `/api/businesses` omits `owner_id` and `business_number`. | `unpaid-business-owner.spec.ts` |
| `rls-unauth-mine-401` | Unauthenticated request to `/api/businesses?mine=1`. | API returns `401`. | `public` route auth guards |
| `rls-verified-inactive-private` | Owner verifies a draft without entitlement. | Verified but inactive row stays private and public payload excludes `owner_id`/`business_number`. | `unpaid-business-owner.spec.ts` |
| `rls-paid-public` | Pending business is approved then settled with `listing_6m`. | `/api/businesses` and `/businesses/:id` become public; detail response stays safe-field-only. | `paid-listing-lifecycle.spec.ts`, `paid-business-owner.spec.ts` |
| `rls-expired-non-legacy-hidden` | Force `expires_at` past for non-legacy row and keep owner signed in. | Public API/detail/sitemap and owner-authenticated public API omit the row. | `paid-listing-lifecycle.spec.ts` |
| `rls-legacy-public` | Use a legacy, expired public fixture with same row identity under public surfaces. | Legacy row remains visible on legacy surfaces while non-legacy counterpart is hidden. | `launch-privacy-migration.test.mjs` |
| `rls-owner-continuity` | Read through owner client and billing page after expiry. | Owner can still read business/payment rows for billing continuity. | `paid-listing-lifecycle.spec.ts` |
| `rls-owner-cannot-tamper-lifecycle` | Owner attempts `expires_at`/`is_active` updates. | Updates fail and return zero rows. | `paid-listing-lifecycle.spec.ts` |
| `rls-stale-profile-status` | Admin sets `users.subscription_status = active`; owner inserts second business. | Insert fails because consumed listing payment is the entitlement. | `paid-listing-lifecycle.spec.ts` |
| `rls-renewal-refund-lifo` | Apply `listing_6m`, then `listing_2m`; preflight refund older grant. | Older refund preflight fails until newest grant is refunded. | `pricing-duration-products.spec.ts` |
| `rls-owner-public-surface` | Signed-in owner calls `/api/businesses` and home public list. | Owner-authenticated public endpoints still omit expired non-legacy listings. | `paid-listing-lifecycle.spec.ts` |

## Payment-State and Reconciliation Matrix

| Scenario ID | Setup | Assertion |
| --- | --- | --- |
| `payment-pending` | Create a listing attempt with status `pending`. | Status stays `pending`/`processing`; entitlement remains absent. |
| `payment-cancelled` | Cancel a pending listing attempt. | Status becomes failed with processor-style code and remains without side effects. |
| `payment-verification-failed` | Completion with negative verification result. | Settlement is failed; no public grant is created. |
| `payment-transport-failure` | Transport verification fails while provider communication is intermittent. | Status remains non-final (`pending`/`processing`) for reconciliation and no listing appears. |
| `payment-lost-return` | Attempt has no browser return callback and is only in the payment row. | It remains reconciliation-active (`pending`/`processing`) and must not grant listing. |
| `payment-succeeded` | Successful `settle_payment_attempt`. | Attempt becomes `succeeded`; business grant is applied once and snapshots remain consistent. |
| `payment-renewal-refund-lifo` | Grant `listing_6m`, then `listing_2m`, then request older preflight refund. | Older refund preflight is rejected until newest grant is refunded. |

## Minimum Safe Execution

Use the smallest command that proves the intended surface.

```bash
node --test tests/payment-plan-rls-fixture-matrix.test.mjs
```

Only after Forge confirms a disposable target:

```bash
PLAYWRIGHT_BASE_URL="$APPROVED_DISPOSABLE_BASE_URL" RUN_DESTRUCTIVE=1 npx playwright test tests/destructive/pricing-duration-products.spec.ts --project=chromium-desktop
PLAYWRIGHT_BASE_URL="$APPROVED_DISPOSABLE_BASE_URL" RUN_DESTRUCTIVE=1 npx playwright test tests/destructive/paid-listing-lifecycle.spec.ts --project=chromium-desktop
PLAYWRIGHT_BASE_URL="$APPROVED_DISPOSABLE_BASE_URL" RUN_DESTRUCTIVE=1 npx playwright test tests/destructive/unpaid-business-owner.spec.ts --project=chromium-desktop
```

## Sentinel Review Checklist

- The matrix keeps production-blocking safeguards in `tests/utils/supabase-admin.ts` and requires explicit `PLAYWRIGHT_BASE_URL`.
- Every active plan code in `PLAN_CODES` appears once and in order.
- The destructive fixture names are deterministic and QA-scoped.
- Public payload omits `owner_id` and `business_number`, and unauthenticated `mine=1` must fail with `401`.
- Owner continuity reads do not weaken public discovery predicates.
- No migration execution, external publishing, HYP call, paid service, secret change, or production write is required by this task.
