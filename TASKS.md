# Po-Finder (פה קרוב) - Tasks

> Small business discovery app (Next.js 16 + Supabase + Google Maps)
> Last updated: 2026-07-16

---

## DONE

### Authentication & Users
- [x] Supabase Auth integration (email/password + Google OAuth)
- [x] Auth proxy - session refresh on every request (`proxy.ts`)
- [x] Auth callback - auto-creates user row after OAuth/email confirmation
- [x] Login page
- [x] Registration page
- [x] Forgot password flow (email reset)
- [x] Reset password page
- [x] Protected dashboard routes (requires auth)

### Map & Discovery
- [x] Google Maps display with business markers
- [x] Business list sidebar (left panel)
- [x] Map/list toggle on mobile
- [x] Business popup info window on map click
- [x] Google Places autocomplete search bar
- [x] Category filter bar (coffee, sweets, meat, pasta, pizza)
- [x] Advanced filters drawer (kashrut, rating, open now)
- [x] Filtering works in both map and list views

### Business Detail Page
- [x] Business info display (name, description, contact)
- [x] Photo gallery grid
- [x] Operating hours (today + weekly schedule)
- [x] Open/closed status indicator
- [x] Kashrut status badge
- [x] Reviews list with ratings
- [x] Rating summary (average + count)
- [x] Add review form

### Dashboard (Business Owner)
- [x] Dashboard layout with sidebar navigation
- [x] Dashboard overview page (today's status, quick stats)
- [x] Profile editing page (name, phone, address, etc.)
- [x] Schedule management page (daily hours + location)
- [x] Photos management page (upload, manage, set primary)
- [x] Active sidebar link highlighting

### Layout & UI
- [x] Navbar with search, user menu, auth links
- [x] Footer
- [x] Full RTL/Hebrew support throughout
- [x] Responsive design (mobile-first)
- [x] Loading spinners
- [x] Animations & hover effects
- [x] Accessibility (ARIA labels, semantic HTML, skip-to-content)
- [x] Custom 404 page (Hebrew)
- [x] Error boundary page with retry
- [x] Extend the PostHog-inspired product-paper theme across pricing, auth, and dashboard — 2026-07-14
  - Files modified: `app/globals.css`, `app/auth/login/page.tsx`, `app/auth/register/page.tsx`, `app/pricing/PricingClient.tsx`, `app/dashboard/layout.tsx`, `app/dashboard/page.tsx`, `components/layout/DashboardSidebar.tsx`, `components/dashboard/BusinessSelector.tsx`, `components/layout/AccessibilityWidget.tsx`
  - Summary: Added reusable paper, ink-border, offset-shadow, and tactile control styles so the highest-impact owner journey feels cohesive while preserving Hebrew RTL behavior.
- [x] Add a subtle neighborhood-map background pattern across the site — 2026-07-14
  - Files modified: `app/globals.css`, `app/about/page.tsx`, `app/accessibility/page.tsx`, `app/auth/forgot-password/page.tsx`, `app/auth/reset-password/page.tsx`, `app/businesses/[id]/page.tsx`, `app/contact/page.tsx`, `app/privacy/page.tsx`, `app/refund/page.tsx`, `app/terms/page.tsx`, `app/vendors/page.tsx`, `TASKS.md`, `AGENTS.md`
  - Summary: Replaced flat cream page backgrounds with a shared, asset-free paper texture made from faint route lines, registration dots, location marks, and soft brand-color washes.
- [x] Unify duration pricing and transient UI with the product-paper theme — 2026-07-16
  - Files modified: `app/admin/businesses/page.tsx`, `app/admin/layout.tsx`, `app/globals.css`, `components/business/DurationSelectorCard.tsx`, `components/business/FavoritesPanel.tsx`, `components/business/PhotoGrid.tsx`, `components/business/ShareButtons.tsx`, `components/filters/FilterDrawer.tsx`, `components/layout/AccessibilityWidget.tsx`, `components/layout/Navbar.tsx`, `components/map/PlacesSearchBar.tsx`, `components/onboarding/TourController.tsx`, `components/ui/dialog.tsx`, `components/ui/dropdown-menu.tsx`, `components/ui/select.tsx`, `components/ui/sheet.tsx`, `components/ui/slider.tsx`, `tests/public/overlay-theme.spec.ts`, `tests/public/pricing-v2.spec.ts`, `TASKS.md`, `AGENTS.md`
  - Summary: Moved day and week into the same discrete duration slider as the month plans, redesigned the map filter drawer, and standardized dialogs, sheets, menus, search suggestions, onboarding controls, and admin overlays around the shared paper, green-ink, terracotta, and hard-shadow visual language.
- [x] Repair and regression-test the mobile header and content overlays — 2026-07-16
  - Files modified: `components/business/PhotoGrid.tsx`, `components/filters/FilterDrawer.tsx`, `components/layout/AccessibilityWidget.tsx`, `components/layout/Navbar.tsx`, `components/map/BusinessPopup.tsx`, `tests/public/mobile-layout.spec.ts`, `TASKS.md`, `AGENTS.md`
  - Summary: Balanced the compact mobile header, removed redundant or inactive actions, moved accessibility into the mobile menu to prevent content overlap, made single-photo galleries full-width, completed sheet descriptions, and added 320px-plus layout regression coverage.
- [x] Remove the visible navbar wordmark — 2026-07-16
  - Files modified: `components/layout/Navbar.tsx`, `tests/public/mobile-layout.spec.ts`, `TASKS.md`, `AGENTS.md`
  - Summary: Kept only the linked logo and rotating audience text in the top navbar, with focused mobile coverage at the 430px breakpoint where the fixed wordmark previously appeared.

### Static Pages
- [x] Privacy policy page
- [x] Terms of service page
- [x] Accessibility statement page
- [x] About, contact, pricing, and vendor launch pages
- [x] Dynamic SEO metadata for business pages

### Launch Readiness
- [x] Complete the ordered production hardening rollout — 2026-07-16
  - Files modified: `.vercelignore`, `TASKS.md`, `AGENTS.md`
  - Summary: Applied the exact bounded-pricing migration, deployed and verified the compatible Vercel production build, then applied the final privacy migration; confirmed the live alias, all 16 ₪20–₪250 prices, database-enforced checkout amounts, anonymous REST denials for sensitive columns, clean Supabase privilege checks, and responsive mobile rendering.
- [x] Complete the launch security and privacy hardening pass — 2026-07-16
  - Files modified: `app/api/payments/cancel/route.ts`, `app/api/payments/return/route.ts`, `app/businesses/[id]/page.tsx`, `app/layout.tsx`, `lib/db/reviews.ts`, `lib/json-ld.ts`, `lib/payment-state.ts`, `lib/storage/photo-urls.ts`, `lib/supabase/admin.ts`, `supabase/migrations/20260716091648_move_policy_helpers_private.sql`, `tests/json-ld.test.mjs`, `tests/payment-route-security.test.mjs`, `tests/payment-state.test.mjs`, `tests/photo-urls.test.mjs`, `tests/private-policy-helpers.test.mjs`, `tests/public-data-grants.test.mjs`, `TASKS.md`, `AGENTS.md`
  - Summary: Closed stored JSON-LD injection, payment-cancellation IDOR, callback order-rebinding and concurrent-settlement races, catalog/charge snapshot drift, public account/payment/analytics/coupon data exposure, unsafe callback retention, public helper RPCs, and photo fallback tracking paths with explicit database grants and focused regressions.
- [x] Finish responsive public UI and the changing mobile navbar text — 2026-07-16
  - Files modified: `app/about/page.tsx`, `app/auth/login/page.tsx`, `app/auth/register/page.tsx`, `app/contact/page.tsx`, `app/vendors/page.tsx`, `components/layout/CookiePreferencesButton.tsx`, `components/layout/Footer.tsx`, `components/layout/Navbar.tsx`, `components/ui/typewriter.tsx`, `tests/public/mobile-layout.spec.ts`, `tests/public/overlay-theme.spec.ts`, `TASKS.md`
  - Summary: Kept the rotating audience text visible from 320px upward, added reduced-motion and screen-reader fallbacks, standardized 44px mobile controls and product-paper surfaces, optimized static logos, and verified public pages at phone, tablet, and desktop widths.
- [x] Integrate duration labels and simplify pricing contact actions — 2026-07-16
  - Files modified: `app/pricing/PricingClient.tsx`, `components/business/DurationSelectorCard.tsx`, `tests/public/pricing-v2.spec.ts`, `design-qa.md`, `TASKS.md`, `AGENTS.md`
  - Summary: Removed separate duration pills and the pricing-page WhatsApp action so the labels belong to the slider scale and pricing support uses email only.
- [x] Add autonomous engineering and Meta marketing operators — 2026-07-16
  - Files modified: `.agents/README.md`, `.agents/site-engineer/AGENT.md`, `.agents/meta-marketing/AGENT.md`, `.agents/meta-marketing/TARGETS.md`, `TASKS.md`, `AGENTS.md`
  - Summary: Added approval-gated production engineering and Facebook/Instagram marketing runbooks and registered ten recurring Israel-time health, QA, maintenance, performance, creative, attribution, and growth automations for the project.
- [x] Convert the live site from QA data to a customer-ready launch funnel — 2026-07-16
  - Files modified: `app/MapPage.tsx`, `app/api/contact/route.ts`, `app/api/payments/checkout/route.ts`, `app/api/payments/return/route.ts`, `app/auth/callback/route.ts`, `app/auth/register/page.tsx`, `app/dashboard/billing/BillingClient.tsx`, `app/dashboard/billing/page.tsx`, `app/dashboard/profile/page.tsx`, `app/privacy/page.tsx`, `app/refund/page.tsx`, `app/terms/page.tsx`, `components/business/BusinessListPanel.tsx`, `components/providers/MetaPixelProvider.tsx`, `lib/meta-pixel.ts`, `tests/auth/auth-pages.spec.ts`, `tests/public/meta-pixel-consent.spec.ts`, `tests/public/mobile-layout.spec.ts`, `tests/utils/supabase-admin.ts`, `TASKS.md`, `AGENTS.md`
  - Summary: Removed every test business from production while preserving payment history, added a Hebrew first-business launch state, repaired pricing and Google signup roles, added consent-aware Meta registration/lead/checkout/purchase events, stopped customer-facing payment detail leaks, made contact delivery truthful, updated legal dates, and hard-blocked destructive tests from the live project.
- [x] Add a consent-aware Meta Pixel integration — 2026-07-16
  - Files modified: `.env.local.example`, `app/layout.tsx`, `app/privacy/page.tsx`, `components/layout/CookieConsent.tsx`, `components/providers/MetaPixelProvider.tsx`, `lib/meta-pixel.ts`, `tests/public/meta-pixel-consent.spec.ts`, `TASKS.md`, `AGENTS.md`
  - Summary: Added Meta Pixel `27527545196939763`, deferred all Meta network activity until optional-cookie approval, tracked App Router page views, and revoked tracking when consent is withdrawn.
- [x] Add short-duration pricing, an operations dashboard, and full admin controls — 2026-07-16
  - Files modified: `app/admin/businesses/page.tsx`, `app/admin/content/page.tsx`, `app/admin/layout.tsx`, `app/admin/page.tsx`, `app/admin/pricing/PricingEditor.tsx`, `app/admin/stats/page.tsx`, `app/admin/users/page.tsx`, `app/api/admin/businesses/[id]/route.ts`, `app/api/admin/content/route.ts`, `app/api/admin/content/[type]/[id]/route.ts`, `app/api/admin/coupons/route.ts`, `app/api/admin/coupons/[id]/route.ts`, `app/api/admin/pricing/route.ts`, `app/api/admin/users/route.ts`, `app/api/admin/users/[id]/route.ts`, `app/dashboard/page.tsx`, `app/pricing/PricingClient.tsx`, `app/vendors/page.tsx`, `components/business/DurationSelectorCard.tsx`, `lib/plans.ts`, `lib/plans-server.ts`, `lib/site-config.ts`, `supabase/migrations/20260716045924_add_day_week_listing_plans.sql`, `tests/destructive/pricing-duration-products.spec.ts`, `tests/plans.test.mjs`, `tests/public/pricing-v2.spec.ts`, `tests/utils/supabase-admin.ts`, `TASKS.md`, `AGENTS.md`
  - Summary: Added ₪3 day and ₪8 week listings, raised monthly prices by ₪1, preserved exact mixed-duration refunds, created a verified Notion operations dashboard, fixed service-role admin data access, and added business visibility, user, and content moderation controls.
- [x] Enforce the launch price ladder and audit the admin control surface — 2026-07-16
  - Files modified: `app/admin/payments/page.tsx`, `app/admin/pricing/page.tsx`, `app/admin/pricing/PricingEditor.tsx`, `app/api/admin/businesses/route.ts`, `app/api/admin/pricing/route.ts`, `app/pricing/page.tsx`, `components/business/DurationSelectorCard.tsx`, `lib/plans.ts`, `lib/plans-server.ts`, `lib/site-config.ts`, `supabase/migrations/20260716071745_add_two_three_day_listing_plans.sql`, `supabase/migrations/20260716091547_enforce_duration_price_ladder.sql`, `tests/admin-control.test.mjs`, `tests/destructive/paid-listing-lifecycle.spec.ts`, `tests/destructive/pricing-duration-products.spec.ts`, `tests/plans.test.mjs`, `tests/public/pricing-v2.spec.ts`, `tests/utils/supabase-admin.ts`, `TASKS.md`, `AGENTS.md`
  - Summary: Added the complete one-day through twelve-month ₪20–₪250 ladder, made admin pricing writes bounded and atomic, rejected partially migrated database catalogs as one unit, kept public and admin pricing live instead of build-time cached, hardened manual business creation, and surfaced pending HYP attempts for verified manual review without introducing an unsafe settlement shortcut.
- [x] Make dormant coupon controls launch-safe — 2026-07-16
  - Files modified: `app/admin/coupons/page.tsx`, `app/admin/layout.tsx`, `app/admin/page.tsx`, `app/api/admin/coupons/route.ts`, `app/api/admin/coupons/[id]/route.ts`, `app/api/payments/checkout/route.ts`, `tests/admin-control.test.mjs`, `TASKS.md`, `AGENTS.md`
  - Summary: Blocked coupon creation and reactivation on the server, labeled legacy records as nonfunctional, retained cleanup actions, and made checkout reject unrecognized coupon input until atomic reservation, settlement, cancellation, and refund rules exist.
- [x] Harden live discovery, schedule edge cases, map UX, and private business content — 2026-07-15
  - Files modified: `app/MapPage.tsx`, `app/api/businesses/route.ts`, `app/api/businesses/[id]/events/route.ts`, `app/api/businesses/[id]/events/[eventId]/route.ts`, `app/api/payments/checkout/route.ts`, `app/businesses/[id]/page.tsx`, `app/dashboard/events/page.tsx`, `app/dashboard/photos/page.tsx`, `app/dashboard/profile/page.tsx`, `app/dashboard/schedule/page.tsx`, `app/sitemap.ts`, `components/business/BusinessCard.tsx`, `components/business/BusinessListPanel.tsx`, `components/business/PhotoGrid.tsx`, `components/business/SafeBusinessImage.tsx`, `components/business/StatusCard.tsx`, `components/layout/AccessibilityWidget.tsx`, `components/layout/CookieConsent.tsx`, `components/map/BusinessMap.tsx`, `components/map/BusinessPopup.tsx`, `components/map/PlacesSearchBar.tsx`, `components/ui/slider.tsx`, `lib/business-discovery.ts`, `lib/category-theme.ts`, `lib/db/businesses.ts`, `lib/db/owned-businesses.ts`, `lib/db/photos.ts`, `lib/db/schedules.ts`, `lib/storage/photo-urls.ts`, `lib/types.ts`, `lib/utils/schedule.ts`, `package.json`, `package-lock.json`, `supabase/migrations/20260715144513_launch_privacy_hardening.sql`, `tests/launch-privacy-migration.test.mjs`, `tests/photo-urls.test.mjs`, `tests/public/map-availability.spec.ts`, `tests/public/map.spec.ts`, `tests/schedule.test.mjs`, `TASKS.md`, `AGENTS.md`
  - Summary: Centralized map/list filtering so confirmed-closed businesses disappear while unknown-hours businesses remain, fixed Israel midnight and overnight hours, restored mobile map markers with colorful category styling and accessible dialogs, added graceful themed fallbacks for failed legacy photos, repaired sitemap business URLs, added a private signed-photo/RLS migration for draft and expired content, and upgraded the production dependency chain until `npm audit --omit=dev` reported zero advisories.
- [x] Hebrew visible brand standardized to "פה קרוב"
- [x] Business-owner CTA standardized around one duration-based listing product
- [x] About/contact trust copy uses configured business contact info without public placeholders
- [x] Vendor and pricing FAQ sections added
- [x] Demo/test businesses removed from the production database
- [x] Sentry test route removed from public routing
- [x] HYP payment return handling accepts legacy Pay Protocol and CreditGuard callback shapes
- [x] Public business cards render for active businesses even when no same-day schedule row exists
- [x] HYP payment completion redirects are captured from page routes and forwarded into settlement
- [x] Navbar CTA uses server dashboard-access status so paid users see לוח בקרה after payment

### Infrastructure
- [x] Environment variable validation (`lib/env.ts`)
- [x] Supabase database schema (users, businesses, photos, reviews, schedules)
- [x] Storage bucket migration for photos
- [x] `next.config.ts` image optimization config
- [x] Dynamic import for map component (SSR disabled)
- [x] SEO metadata on auth & dashboard pages
- [x] Next.js 16 `proxy.ts` convention adopted
- [x] Sentry instrumentation updated for request errors and router transitions
- [x] Add paid-listing lifecycle regression coverage — 2026-07-14
  - Files modified: `app/api/businesses/route.ts`, `app/api/payments/return/route.ts`, `app/sitemap.ts`, `lib/dashboard-access-core.ts`, `lib/dashboard-access.ts`, `lib/db/businesses.ts`, `lib/payments.ts`, `supabase/migrations/20260714054020_enforce_paid_listing_lifecycle.sql`, `supabase/migrations/20260714054311_preserve_legacy_public_listings.sql`, `tests/dashboard-access.test.mjs`, `tests/destructive/paid-listing-lifecycle.spec.ts`, `tests/destructive/unpaid-business-owner.spec.ts`, `tests/utils/supabase-admin.ts`, `TASKS.md`, `AGENTS.md`
  - Summary: Enforced single-use paid listing credits and expiry at the database and public-route layers, preserved legacy seeded listings, removed the stale profile flag from entitlement decisions, and added provider-free paid/unpaid lifecycle regressions including the signed-in owner public-listing path.
- [x] Replace subscriptions and boost packages with one duration-based listing product — 2026-07-14
  - Files modified: `.env.local.example`, `app/pricing/page.tsx`, `app/pricing/PricingClient.tsx`, `app/dashboard/billing/page.tsx`, `app/dashboard/billing/BillingClient.tsx`, `components/business/DurationSelectorCard.tsx`, `app/api/payments/checkout/route.ts`, `app/api/admin/payments/[id]/refund/route.ts`, `app/api/cron/expiry-reminders/route.ts`, `lib/plans.ts`, `lib/plans-server.ts`, `lib/expiry-reminders.ts`, `lib/email.ts`, `lib/email-templates.ts`, `lib/site-config.ts`, `supabase/migrations/20260714105000_duration_slider_pricing.sql`, `supabase/migrations/20260714105500_deactivate_legacy_payment_products.sql`, `tests/plans.test.mjs`, `tests/expiry-reminders.test.mjs`, `tests/public/pricing-v2.spec.ts`, `tests/destructive/pricing-duration-products.spec.ts`, `tests/destructive/paid-listing-lifecycle.spec.ts`, `vercel.json`, `design-qa.md`
  - Summary: Added the 1–12 month one-time price slider, calendar-month renewals with exact LIFO refunds, automatic expiry reminders, and removed boost sales and promoted placement while preserving historical payment records.
- [x] Harden mobile launch UX, public data, reviews, payments, and production storage — 2026-07-14
  - Files modified: `app/MapPage.tsx`, `app/admin/businesses/page.tsx`, `app/admin/layout.tsx`, `app/admin/page.tsx`, `app/admin/stats/page.tsx`, `app/api/analytics/events/route.ts`, `app/api/businesses/route.ts`, `app/api/payments/checkout/route.ts`, `app/api/payments/return/route.ts`, `app/api/reviews/route.ts`, `app/auth/callback/route.ts`, `app/auth/login/page.tsx`, `app/auth/register/page.tsx`, `app/businesses/[id]/page.tsx`, `app/contact/page.tsx`, `app/dashboard/billing/BillingClient.tsx`, `app/dashboard/events/page.tsx`, `app/dashboard/page.tsx`, `app/dashboard/photos/page.tsx`, `app/dashboard/profile/page.tsx`, `app/dashboard/schedule/page.tsx`, `app/globals.css`, `app/layout.tsx`, `components/business/BusinessCard.tsx`, `components/business/BusinessListPanel.tsx`, `components/business/DurationSelectorCard.tsx`, `components/business/FavoritesPanel.tsx`, `components/business/ReviewForm.tsx`, `components/business/ReviewsList.tsx`, `components/business/StatusCard.tsx`, `components/filters/FilterBar.tsx`, `components/filters/FilterDrawer.tsx`, `components/layout/AccessibilityWidget.tsx`, `components/layout/CookieConsent.tsx`, `components/layout/DashboardSidebar.tsx`, `components/layout/Navbar.tsx`, `components/map/BusinessMap.tsx`, `components/map/BusinessPopup.tsx`, `lib/analytics.ts`, `lib/db/businesses.ts`, `lib/hyp.ts`, `lib/safe-redirect.ts`, `public/google-g.svg`, `supabase/migrations/20260714112838_split_business_analytics_events.sql`, `supabase/migrations/20260714133500_harden_review_policies.sql`, `tests/public/pricing-v2.spec.ts`, `tests/safe-redirect.test.mjs`, `TASKS.md`, `AGENTS.md`.
  - Summary: Unified responsive product-paper UI across public, owner, and admin flows; added 44 px mobile controls and accessible overlays; prevented expired or private data from leaking through public discovery; hardened auth redirects, reviews, payment reconciliation, analytics, and photo storage; and applied the production database migrations.
- [x] Add two-day and three-day choices to the duration slider — 2026-07-16
  - Files modified: `app/admin/pricing/PricingEditor.tsx`, `app/api/admin/pricing/route.ts`, `components/business/DurationSelectorCard.tsx`, `lib/plans.ts`, `supabase/migrations/20260716071745_add_two_three_day_listing_plans.sql`, `tests/destructive/pricing-duration-products.spec.ts`, `tests/plans.test.mjs`, `tests/public/pricing-v2.spec.ts`, `tests/utils/supabase-admin.ts`, `TASKS.md`, `AGENTS.md`.
  - Summary: Added exact one-, two-, three-, and seven-day products to the same discrete price slider, aligned admin validation and expiry arithmetic, and applied the production catalog migration.

---

## TODO

### High Priority
- [x] **Apply and verify launch privacy migration in production** - Applied `supabase/migrations/20260715144513_launch_privacy_hardening.sql`; verified the owner RPC exists, private business columns are not selectable by anonymous clients, and the photos bucket is private.
- [x] **Complete legal operator identity** - Added the registered legal name, registration/ID, public address, and customer-service phone to `lib/site-config.ts` — 2026-07-16.
  - Files modified: `lib/site-config.ts`, `TASKS.md`
  - Summary: Completed the public legal operator disclosure so the legal pages identify the registered operator and support contact.
- [ ] **Reconcile pending HYP attempts** - Review the existing pending production payment and add provider transaction inquiry before treating lost browser returns as automatic.
- [x] **Apply and verify the bounded pricing migration** - Production has exact version `20260716091547_enforce_duration_price_ladder.sql`; all 16 prices match the ₪20–₪250 ladder and only `service_role` can execute the atomic admin pricing RPC — 2026-07-16.
- [x] **Apply and verify the final privacy migration** - Production has exact version `20260716091648_move_policy_helpers_private.sql`; policy helpers are private and both privilege introspection and anonymous REST probes deny review account IDs, provider callback fields, analytics session IDs, and coupons — 2026-07-16.
- [ ] **Design atomic coupon redemption** - Decide per-user reuse, pending reservation expiry, minimum charge, plan eligibility, and whether cancellation/refund restores quota before reconnecting coupon issuance to checkout.
- [x] **Optimize static images** - Static logos use `next/image`; expiring signed business photos intentionally stay inside `SafeBusinessImage` so load failures can switch to the branded fallback.

### Medium Priority
- [x] **Fix search on non-homepage** - Navbar search returns to the map with a shareable `q` parameter.
- [x] **Verify storage bucket migration** - Production `photos` bucket is limited to 10 MB JPEG, PNG, and WebP uploads.
- [x] **Resolve remaining repo-wide ESLint debt** — 2026-07-16
  - Files modified: `.gitignore`, `eslint.config.mjs`, `tests/public/link-crawl.spec.ts`, `tsconfig.json`, `TASKS.md`
  - Summary: Full `npm run lint` passes after excluding historical `.claude` worktrees and `.codex-release` staging from project tooling and removing the final unused catch binding.
- [ ] **Strengthen production authentication controls** - Enable Supabase leaked-password protection and replace the shared admin secret with individual, MFA-capable admin identities plus an audit trail.
- [ ] **Use durable rate limiting** - Move sensitive login/contact/analytics throttles from per-instance memory to a shared production store or edge firewall.

### Low Priority
- [ ] **Image fill parent styling** - Some `<Image fill>` usage may need explicit `position: relative` on parent
- [ ] **Dashboard null return** - `app/dashboard/page.tsx` returns null if no user (layout redirects, so minor)

---

## Summary

| Area | Status |
|------|--------|
| Auth | Done |
| Map & Filters | Done |
| Business Pages | Done |
| Dashboard | Done |
| Reviews | Done |
| RTL / i18n | Done |
| Image Optimization | Done (signed business photos use an intentional fallback component) |
| SEO | ~90% (static + business metadata done, content should be rechecked after real inventory) |
| Mobile Nav | Done |
| **Overall** | **~90% complete** |
