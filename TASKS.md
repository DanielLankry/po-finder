# Po-Finder (פה קרוב) - Tasks

> Small business discovery app (Next.js 16 + Supabase + Google Maps)
> Last updated: 2026-05-14

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

### Static Pages
- [x] Privacy policy page
- [x] Terms of service page
- [x] Accessibility statement page
- [x] About, contact, pricing, and vendor launch pages
- [x] Dynamic SEO metadata for business pages

### Launch Readiness
- [x] Hebrew visible brand standardized to "פה קרוב"
- [x] Business-owner CTA standardized around the ₪99 launch offer
- [x] About/contact trust copy uses configured business contact info without public placeholders
- [x] Vendor and pricing FAQ sections added
- [x] Demo/test businesses filtered from the public map
- [x] Sentry test route removed from public routing

### Infrastructure
- [x] Environment variable validation (`lib/env.ts`)
- [x] Supabase database schema (users, businesses, photos, reviews, schedules)
- [x] Storage bucket migration for photos
- [x] `next.config.ts` image optimization config
- [x] Dynamic import for map component (SSR disabled)
- [x] SEO metadata on auth & dashboard pages
- [x] Next.js 16 `proxy.ts` convention adopted
- [x] Sentry instrumentation updated for request errors and router transitions

---

## TODO

### High Priority
- [ ] **Replace `<img>` with `<Image>`** - Several components still use unoptimized `<img>` tags:
  - `components/business/BusinessCard.tsx`
  - `components/business/PhotoGrid.tsx`
  - `components/business/BusinessListPanel.tsx`
  - `app/dashboard/photos/page.tsx`

### Medium Priority
- [ ] **Fix search on non-homepage** - Navbar search input on other pages doesn't navigate back to map with search params
- [ ] **Verify storage bucket migration** - Confirm `002_storage_bucket.sql` has been applied to production Supabase
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
