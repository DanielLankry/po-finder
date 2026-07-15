# Po-Finder (פה קרוב) - Tasks

> Small business discovery app (Next.js 16 + Supabase + Google Maps)
> Last updated: 2026-07-15

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

### Static Pages
- [x] Privacy policy page
- [x] Terms of service page
- [x] Accessibility statement page
- [x] About, contact, pricing, and vendor launch pages
- [x] Dynamic SEO metadata for business pages

### Launch Readiness
- [x] Harden live discovery, schedule edge cases, map UX, and private business content — 2026-07-15
  - Files modified: `app/MapPage.tsx`, `app/api/businesses/route.ts`, `app/api/businesses/[id]/events/route.ts`, `app/api/businesses/[id]/events/[eventId]/route.ts`, `app/api/payments/checkout/route.ts`, `app/businesses/[id]/page.tsx`, `app/dashboard/events/page.tsx`, `app/dashboard/photos/page.tsx`, `app/dashboard/profile/page.tsx`, `app/dashboard/schedule/page.tsx`, `app/sitemap.ts`, `components/business/BusinessCard.tsx`, `components/business/BusinessListPanel.tsx`, `components/business/PhotoGrid.tsx`, `components/business/SafeBusinessImage.tsx`, `components/business/StatusCard.tsx`, `components/layout/AccessibilityWidget.tsx`, `components/layout/CookieConsent.tsx`, `components/map/BusinessMap.tsx`, `components/map/BusinessPopup.tsx`, `components/map/PlacesSearchBar.tsx`, `components/ui/slider.tsx`, `lib/business-discovery.ts`, `lib/category-theme.ts`, `lib/db/businesses.ts`, `lib/db/owned-businesses.ts`, `lib/db/photos.ts`, `lib/db/schedules.ts`, `lib/storage/photo-urls.ts`, `lib/types.ts`, `lib/utils/schedule.ts`, `package.json`, `package-lock.json`, `supabase/migrations/20260715170000_launch_privacy_hardening.sql`, `tests/launch-privacy-migration.test.mjs`, `tests/photo-urls.test.mjs`, `tests/public/map-availability.spec.ts`, `tests/public/map.spec.ts`, `tests/schedule.test.mjs`, `TASKS.md`, `AGENTS.md`
  - Summary: Centralized map/list filtering so confirmed-closed businesses disappear while unknown-hours businesses remain, fixed Israel midnight and overnight hours, restored mobile map markers with colorful category styling and accessible dialogs, added graceful themed fallbacks for failed legacy photos, repaired sitemap business URLs, added a private signed-photo/RLS migration for draft and expired content, and upgraded the production dependency chain until `npm audit --omit=dev` reported zero advisories.
- [x] Hebrew visible brand standardized to "פה קרוב"
- [x] Business-owner CTA standardized around one duration-based listing product
- [x] About/contact trust copy uses configured business contact info without public placeholders
- [x] Vendor and pricing FAQ sections added
- [x] Demo/test businesses filtered from the public map
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

---

## TODO

### High Priority
- [ ] **Apply and verify launch privacy migration in production** - Run `supabase/migrations/20260715170000_launch_privacy_hardening.sql` before deploying the matching app build, then verify anon clients cannot read `owner_id`, `business_number`, or private schedule/photo rows.
- [ ] **Complete legal operator identity** - Fill the real legal name, registration/ID, postal address, and customer-service phone in `lib/site-config.ts` before accepting public payments.
- [ ] **Reconcile pending HYP attempts** - Review the existing pending production payment and add provider transaction inquiry before treating lost browser returns as automatic.
- [ ] **Replace `<img>` with `<Image>`** - Several components still use unoptimized `<img>` tags:
  - `components/business/BusinessCard.tsx`
  - `components/business/PhotoGrid.tsx`
  - `components/business/BusinessListPanel.tsx`
  - `app/dashboard/photos/page.tsx`

### Medium Priority
- [x] **Fix search on non-homepage** - Navbar search returns to the map with a shareable `q` parameter.
- [x] **Verify storage bucket migration** - Production `photos` bucket is limited to 10 MB JPEG, PNG, and WebP uploads.
- [ ] **Resolve remaining repo-wide ESLint debt** - Full `npm run lint` still reports pre-existing React Compiler issues in admin, map, cookie, and UI utility files.

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
| Image Optimization | ~70% (config done, components need `<Image>`) |
| SEO | ~90% (static + business metadata done, content should be rechecked after real inventory) |
| Mobile Nav | Done |
| **Overall** | **~90% complete** |
