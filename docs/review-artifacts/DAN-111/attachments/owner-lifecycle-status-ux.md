# DAN-111 Owner Lifecycle Status UX

Shared lifecycle source:
- `lib/owner-lifecycle.ts` derives owner-facing state, tone, copy, action, expiry label, and public visibility from `is_verified`, `is_active`, `is_legacy_public`, and `expires_at`.
- `lib/owner-lifecycle.ts` also names shared transient states for loading, empty, offline, error, permission, destructive-warning, and payment recovery copy.
- `components/dashboard/OwnerLifecycleStatus.tsx` renders the shared banner, pills, transient notice, and loading state with ARIA live regions and 44 px minimum primary actions.

Current states:
- `pending_verification`: private draft, action back to profile review.
- `ready_to_publish`: verified but not public, action to billing.
- `active`: visible to the public, action to billing period management.
- `expiring_soon`: visible with seven days or fewer remaining, action to extend.
- `expired`: not visible, action to renew.

Usage:
- Dashboard overview renders `OwnerLifecycleBanner` below the greeting.
- Dashboard analytics includes an owner privacy cue: visitor counts are aggregate only and do not expose names, identity, or contact details.
- Profile renders `OwnerLifecycleLoading` while fetching, `OwnerLifecycleBanner` above the edit form, and `OwnerLifecyclePills` in the preview header.
- Billing renders `OwnerLifecycleTransientNotice` for payment success, processing, cancelled, failed, offline, permission, generic error, and empty-draft states; `OwnerLifecycleLoading` while fetching; `OwnerLifecyclePills` in each business header; and a compact `OwnerLifecycleBanner` above the duration selector.
- Payment cancel and failed return routes redirect to `/dashboard/billing?payment=...` so owners recover inside the shared status/next-action pattern instead of landing back on public pricing.

Mobile/accessibility notes:
- Primary lifecycle and recovery actions use `min-h-11`/`h-11` or larger, satisfying the 44 px mobile control target for 320, 390, and 430 px checks.
- Long Hebrew names/dates and mixed LTR fields are contained with `min-w-0`, wrapping flex rows, `dir="rtl"` page containers, and explicit `dir="ltr"` for phone/URL/account-number fields already present on profile forms.
- Error and permission notices use assertive live regions; loading, empty, success, processing, and cancelled states use polite live regions.
- Destructive actions are represented as a shared warning transient state for future destructive owner surfaces; this change does not add destructive behavior.

Verification:
- `node --test tests/owner-lifecycle.test.mjs` (2026-08-05: 7 tests passed)
- `npx tsc --noEmit --pretty false` (2026-08-05: passed)
- `npx eslint components/dashboard/OwnerLifecycleStatus.tsx lib/owner-lifecycle.ts app/dashboard/billing/BillingClient.tsx app/api/payments/return/route.ts app/api/payments/cancel/route.ts tests/owner-lifecycle.test.mjs` blocked before source analysis because the local dependency tree is missing `node_modules/json-schema-traverse/index.js`.

Review handoff:
- Sentinel review remains mandatory before development completion because the shared lifecycle appears on billing/payment recovery and owner analytics surfaces.
