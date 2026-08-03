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
- Profile renders `OwnerLifecycleLoading` while fetching, `OwnerLifecycleBanner` above the edit form, and `OwnerLifecyclePills` in the preview header.
- Billing renders `OwnerLifecycleNotice` for payment callbacks, `OwnerLifecycleLoading` while fetching, `OwnerLifecyclePills` in each business header, and a compact `OwnerLifecycleBanner` above the duration selector.

Verification:
- `node --test tests/owner-lifecycle.test.mjs`
- `npx tsc --noEmit --pretty false`
- Targeted ESLint command attempted but blocked by incomplete local dependency tree. After repairing two generated packages in `node_modules`, the command still stopped before source analysis on `Cannot find module .../node_modules/json-schema-traverse/index.js`.
