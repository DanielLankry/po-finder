# DAN-109 End-to-End Pokarov UX Audit

Date: 2026-08-03 UTC  
Owner: Iris, Head of Client & UX  
Product: `pokarov.co.il` / `פה קרוב`

## Executive Decision

Recommended UX decision: make the owner lifecycle the spine of the product: `private draft -> verification -> choose paid duration -> public listing -> expiry/renewal -> payment recovery`. Every owner-facing screen should show the current state, what is private/public, what action is allowed, and what happens next.

The current product already has the right primitives: private drafts, explicit verification, single-use duration plans, non-auto-renewing payment copy, public discovery expiry filters, signed photo URLs, consent-aware analytics, and owner-only billing/dashboard access. The user journey is still spread across separate screens and messages, which makes recovery and confidence weaker than the underlying architecture.

Severity scale: S1 release blocker, S2 high impact before paid acquisition, S3 important polish, S4 low.

## Evidence Reviewed

- Live read-only checks on 2026-08-03:
  - `https://pokarov.co.il/` returned `200`, `0.984s`, HTML.
  - `https://pokarov.co.il/pricing` returned `200`, `0.450s`, HTML.
  - `https://pokarov.co.il/contact` returned `200`, `0.221s`, HTML.
  - `https://pokarov.co.il/privacy` returned `200`, `0.243s`, HTML.
  - `https://pokarov.co.il/api/businesses?includeSchedule=1` returned `200`, `2.639s`, `{"businesses":[]}`.
  - `https://pokarov.co.il/api/businesses?mine=1` returned `401`, proving unauthenticated owner reads fail closed.
- Web search/open check found indexed Hebrew pages for homepage, terms, and contact. Google snippets show crawlable fallback content for the public homepage and policy/contact pages.
- Source inspection:
  - `app/MapPage.tsx`, `components/business/BusinessListPanel.tsx`, `components/map/BusinessMap.tsx`, `components/filters/*`.
  - `app/pricing/PricingClient.tsx`, `components/business/DurationSelectorCard.tsx`.
  - `app/auth/register/page.tsx`, `app/auth/login/page.tsx`.
  - `app/dashboard/page.tsx`, `app/dashboard/profile/page.tsx`, `app/dashboard/billing/BillingClient.tsx`, schedule/photos/events pages.
  - `app/businesses/[id]/page.tsx`, review/contact/privacy/refund/terms/accessibility pages.
  - `app/api/businesses/route.ts`, `app/api/payments/checkout/route.ts`, `app/api/payments/return/route.ts`.
  - `supabase/migrations/20260714054020_enforce_paid_listing_lifecycle.sql`, `20260715144513_launch_privacy_hardening.sql`, `20260716045924_add_day_week_listing_plans.sql`, `20260716071745_add_two_three_day_listing_plans.sql`.
- Approved context:
  - `AGENTS.md` launch notes and project patterns.
  - `_default/po-finder-architecture-baseline.md`.
  - `IMPLEMENTATION-ROADMAP.md`, `CREATIVE-BRIEF.md`.
  - `docs/legal-compliance-audit.md`.
  - Existing mirrored visual evidence in `docs/review-artifacts/DAN-82/attachments/`.

No production login, registration, business creation, checkout, payment, migration, billing action, or data mutation was performed.

## Findings

| Severity | Area | Finding | Impact | Recommendation |
| --- | --- | --- | --- | --- |
| S2 | Owner onboarding | Lifecycle messages exist but are screen-local. Profile says private draft, dashboard says pending verification, billing says cannot pay until verified, pricing sends users into registration/billing. | Owners can lose confidence after signup because the next step depends on which screen they land on. | Loom: add one shared lifecycle status component to dashboard/profile/billing. Forge: integrate route-level next-action redirects after register/verify/payment returns. |
| S2 | Empty launch | Production public API currently returns zero businesses. Code distinguishes platform-empty from filtered-empty. | First visitors may see an invitation state instead of useful inventory; paid traffic can bounce before listings exist. | Keep the public empty-launch invitation, but make it explicitly privacy-preserving and action-oriented: “No public businesses yet; owners can create a private draft.” Do not imply search failed. |
| S2 | Payment recovery | UI handles `success`, `processing`, cancelled, provider-start failure, unverified business. Architecture notes confirm lost browser returns remain manual. | A charged owner may see pending/retry uncertainty; double payment anxiety is likely. | Rivet: specify stale-pending inquiry/reconciliation contract. Loom: add “do not pay again” recovery copy and support path everywhere payment state is ambiguous. |
| S2 | Plan-change testing | Pricing catalog and RLS/payment migrations support exact day/week/month durations and expiry snapshots. No safe E2E test account was used in this audit. | Duration extension/refund UX cannot be claimed end-to-end without staging fixtures. | Rivet: create non-production payment-plan fixture tests for verified draft, unverified draft, active renewal, expired renewal, pending return, failed return, refund newest-first. |
| S3 | RTL/mobile | Current surfaces consistently set `dir="rtl"` on major roots and LTR on phone/URL fields. Visual artifacts show mobile navbar/pricing have been tested previously. | Mixed Hebrew/Latin fields are handled, but lifecycle/status labels may overflow in compact cards when long business names or dates are present. | Loom: include 320/390/430 px acceptance with long Hebrew names, English usernames, phone numbers, and expiry dates. |
| S3 | Loading/offline/error | Map/list, profile, billing, contact, places search, GPS, and map components have loading/error copy. Offline is represented as generic load error. | Users can retry, but offline vs server failure is not clear. | Loom: standardize transient states: loading skeleton, offline copy, retry action, support fallback for billing/contact. |
| S3 | Privacy cues | Privacy is visible in footer, contact/review consent, pricing legal links, private draft copy, signed photo architecture, and public API column minimization. | Strong baseline. The cue is strongest on profile/contact and weaker in analytics/dashboard. | Add short privacy note near owner analytics: “Only aggregated actions are shown; no visitor identity is exposed.” |
| S3 | Accessibility | Accessibility page exists; major controls use labels/aria in many places; mobile hit-target requirements are in project notes. Google Maps limitation has list alternative. | Needs a fresh assistive-tech pass after lifecycle/status UI changes. | Aegis review required before completion of any lifecycle/payment/contact revisions. Acceptance includes keyboard, focus order, screen reader names, reduced motion, contrast, 44px controls. |
| S4 | Consumer discovery | Search/filter/map/list architecture is coherent. Public empty API means no real business-card/contact path could be safely validated live. | Consumer flow quality depends on seeded/public listings. | Forge or QA should run seeded preview with at least 5 public businesses covering photos, no photos, unknown hours, confirmed closed, open now, events, reviews, phone/WhatsApp. |

## Customer Journey Specification

### Consumer: find and contact a business

1. Landing state opens list-first on mobile and split list/map on wide desktop.
2. The user can search by text, category, kashrut, rating, and open-now.
3. Unknown hours remain discoverable; only confirmed closed is excluded when an open-now filter requires it.
4. Empty launch state appears only when the unfiltered platform result is truly empty.
5. Filtered empty state says to change filters and must not invite owners as if the platform were empty.
6. Business detail page presents photos, category, kashrut if relevant, verified badge, description, hours/events/reviews, and contact actions.
7. Contact buttons track only consent-appropriate analytics and expose no owner/private fields.
8. If maps fail or GPS permission is denied, list search remains usable and the user sees a plain retry/permission message.

### Business owner: register, create, pay, manage

1. Pricing and vendor pages sell one product model: create private draft for free, verification, then one-time paid duration from 1 day to 12 months.
2. Registration from pricing keeps the selected plan in `redirectTo` and defaults to `business_owner`; no admin role can be passed.
3. Profile creation explains which fields will become public and which are private/sensitive. Business number is private and supports verification.
4. After saving a draft, the owner sees the same lifecycle state across profile, dashboard, and billing.
5. Unverified drafts cannot start checkout; the disabled state must explain that verification is pending and no payment is needed yet.
6. Verified inactive businesses show one next action: choose duration and pay.
7. Payment start sends the owner to HYP only after a pending attempt is created for that business and plan.
8. Payment success returns to billing with a clear “time added” state. Processing state says not to pay again and gives a support path.
9. Expired owners retain dashboard, payment history, profile edits, and renewal path. Public discovery removes expired non-legacy listings.
10. Destructive owner actions, if exposed later, must require explicit confirmation and state public/private effects.

## State Requirements

| State | Required behavior |
| --- | --- |
| Loading | Use stable-height skeletons/spinners that do not move nav, filters, map/list toggle, or primary CTA. Hebrew copy: “טוען...” only for short waits; longer billing/profile waits should include what is loading. |
| Empty platform | Public: invitation copy only when unfiltered API result is empty. Owner: clear CTA to create a private draft. |
| Empty filtered | Keep current filters visible and provide reset/change filters action. Do not show launch invitation. |
| Offline | Distinguish likely connectivity failure from empty data. Provide retry and a non-map path. |
| Error | Keep user-entered form values. Provide retry or support link. Payment errors must not recommend paying again unless no attempt was created. |
| Permission | GPS denied: explain manual search still works. Auth required: send to login/register with safe redirect. Unverified business: explain verification gate. |
| Destructive | Confirm exact object/action, public effect, reversibility, and privacy effect. Not currently central to public owner flow. |
| Recovery | Payment `processing` and lost-return states must say the attempt is being checked, duplicate payment is not needed, and support can resolve with account email/attempt context. |

## Privacy and Data-Minimization Rules

- Public discovery and business pages must never expose `owner_id` or `business_number`.
- Owner reads must continue using the `get_my_businesses` RPC or equivalent server-side scoped path.
- Private photos stay behind signed URL conversion; no raw bucket paths in UI.
- Analytics events stay consent-aware. Owner dashboard analytics should remain aggregate-only and explicitly non-identifying.
- Contact/review forms must retain explicit privacy acceptance and preserve values on error.
- Payment UI must state that card details are handled by HYP and not stored by Pokarov, consistent with the privacy page.

## Acceptance Criteria

### Loom handoff

- Add one shared lifecycle/status pattern used on dashboard, profile, billing, and payment return states.
- Mobile checks pass at 320, 390, 430 px with long Hebrew business names, long dates, phone numbers, URLs, Instagram handles, and mixed Hebrew/English text.
- All primary controls are keyboard focusable, visible on focus, and at least 44x44 px on mobile.
- Loading, empty, offline, error, permission, destructive, and recovery states have Hebrew RTL copy and do not overlap fixed nav/footer/toggles.
- Owner analytics includes a privacy cue that no visitor identity is exposed.

### Rivet handoff

- Define non-production fixtures for unverified draft, verified inactive draft, active listing, expired listing, legacy public listing, pending payment, succeeded payment, failed payment, cancelled payment, and processing/lost-return.
- Add RLS/API tests proving public reads exclude `owner_id` and `business_number`; unauthenticated `mine=1` returns 401; expired non-legacy listings are absent from public discovery even under an owner session.
- Add payment-plan tests for every `PLAN_CODES` duration, exact day plans, month plans, renewal extension, newest-first refund preflight, and no duplicate listing credit.
- Specify stale pending HYP inquiry/reconciliation states without mutating production or using real cards.

### Forge handoff

- Integrate Loom lifecycle UI and Rivet contracts in small vertical slices.
- Keep `proxy.ts` HYP-return routing and `safeRedirectPath` auth behavior intact.
- Do not reintroduce subscriptions, boosts, promoted sorting, public owner fields, or client-writeable entitlement fields.
- Verify seeded preview E2E across customer and owner roles before production.

### Aegis/Sentinel gates

- Aegis must review lifecycle/payment/contact/profile changes for accessibility, privacy, and security-sensitive copy before completion.
- Sentinel must independently review this audit artifact, any delegated implementation issues, and exact verification evidence before DAN-109 or downstream completion claims are accepted.

## Recommended Follow-Up Issues

1. Loom: Design shared owner lifecycle/status UX and all transient states for Pokarov.
2. Rivet: Define safe payment-plan/RLS E2E fixture matrix for Pokarov.
3. Forge: Integrate lifecycle UX and fixture-backed owner/customer E2E coverage in preview.
4. Aegis: Review Pokarov lifecycle/payment/contact accessibility and privacy copy.
5. Sentinel: Independent review of DAN-109 audit and delegated issue coverage.

## Completion Limitation

This audit is complete as an Iris product/UX definition and handoff. It is not a claim that live registration, live payment, production plan changes, or real business-owner mutation were executed. Those require safe staging/test accounts, delegated implementation/testing issues, Aegis review for sensitive UX, Sentinel review for completion evidence, and Daniel approval for any production-affecting action.
