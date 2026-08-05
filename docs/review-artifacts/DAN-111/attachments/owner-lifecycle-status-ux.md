# DAN-111 Owner Lifecycle Status UX

Shared lifecycle source:
- `lib/owner-lifecycle.ts` derives owner-facing state, tone, copy, action, expiry label, and public visibility from `is_verified`, `is_active`, `is_legacy_public`, and `expires_at`.
- `components/dashboard/OwnerLifecycleStatus.tsx` renders the shared banner, pills, transient notice, and loading state.

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
- Billing renders `OwnerLifecycleNotice` for payment callbacks, `OwnerLifecycleLoading` while fetching, `OwnerLifecyclePills` in each business header, and a compact `OwnerLifecycleBanner` above the duration selector.

Verification:
- `node --test tests/owner-lifecycle.test.mjs` (2026-08-05: 5 tests passed)
- `npx tsc --noEmit --pretty false`
- `npx eslint components/dashboard/OwnerLifecycleStatus.tsx lib/owner-lifecycle.ts app/dashboard/page.tsx app/dashboard/profile/page.tsx app/dashboard/billing/BillingClient.tsx tests/owner-lifecycle.test.mjs` blocked before source analysis because the local dependency tree is missing `node_modules/json-schema-traverse/index.js`.

Review handoff:
- Sentinel review remains mandatory before development completion because the shared lifecycle appears on billing/payment recovery and owner analytics surfaces.
