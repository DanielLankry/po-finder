# Owner clarity and everyday use — part 1

Implemented 2026-09-09, following the owner's five-item scope.

## Delivered behavior

- Today's status uses the shared Israel schedule resolver: weekly hours, daily overrides, overnight carryover, exact closing time, and unknown hours. Previous-day calculation remains correct across DST. Opening hours and public visibility are displayed separately.
- A shared owner panel shows email verification → business profile → team approval → payment/promotion → publication. It explains the current owner/team responsibility and next action. Pending drafts show their actual creation date and elapsed time, with no promised approval deadline.
- Six saved-profile checks show a count/percentage and direct links to the relevant fields, photos or schedule tab. Completion does not grant publication or change payment entitlements.
- Business selection persists across dashboard pages, including events, photos, schedule and billing. An unavailable explicit selection cannot silently target another owned business.
- Important mobile labels are at least 14px and form controls use 16px text. The map/list toggle has a reserved layout row so it does not cover cards. Search/filter state survives switching views.
- Billing distinguishes a reserved/active free promotion from optional paid extensions, and points unresolved payment/paused-listing states to support. Checkout and settlement implementations are unchanged.

## Verification

| Check | Result |
| --- | --- |
| `node --experimental-test-module-mocks --test tests/*.test.mjs` | 166 passed after integrating the latest email changes, including 18 new owner-progress cases |
| `npm run lint` | Passed without warnings |
| `npx tsc --noEmit` | Passed |
| `npm run build` | Passed |
| Owner UI fixtures | Pending approval, active promotion, pending payment, published; saved-field completion links verified |
| Owner responsive layout | No horizontal overflow at 320, 390, 768 and 1440px |
| Public discovery layout | No toggle/content overlap or horizontal overflow at 320, 360, 390, 430, 768 and 1440px |
| Public interactions | Map loaded; list/map switch preserved search; final card remained reachable; no browser JS errors observed |
| Account endpoint tests | Anonymous 401, unowned selection 404, private/no-store, scoped reads and failure handling |
| Live DB read permissions | Inspected authenticated grants; payment status query executed in a read-only rolled-back transaction without a forbidden `user_id` filter |

The endpoint tests exercise the actual handler with provider boundaries stubbed. Owner-state screenshots use explicitly labelled fictional local fixtures; they do not prove a complete production owner write flow. The temporary fixture route was removed before the production build. Public browser checks read the existing site data only. The integrated email tests require Node's module-mock flag; the unflagged command cannot load those provider mocks.

## Evidence

- [Measured public layout checks](layout-checks.json)
- [Mobile discovery](mobile-list.png)
- [Owner progress on desktop](owner-progress-desktop.png)
- [Owner progress on mobile](owner-progress-mobile.png)

## Release scope and cleanup

No new environment variables, database migrations, production QA accounts, business rows, photo uploads, payment attempts or campaign reservations were introduced during this implementation. No destructive production suites were run. The email verification infrastructure and the site's existing paper/green/terracotta theme are preserved.

Dedicated sandbox card settlement/cancellation/refunds, downloadable receipts and event editing belong to later work and were not tested or implemented here. Existing approval emails are reused; no unsupported response-time commitment or new admin review workflow is introduced.
