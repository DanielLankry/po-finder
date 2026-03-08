# Po Finder - Remaining Tasks Design

## Scope

Fix 13 critical, functional, and polish items. No nice-to-haves (favorites, notifications, admin, analytics, multi-day schedule).

## Phase 1: Auth Infrastructure

### 1. Supabase Middleware
- Create `middleware.ts` at project root
- Use `@supabase/ssr` `createServerClient` to refresh auth cookies on every request
- Match all routes except `_next/static`, `_next/image`, `favicon.ico`, static assets
- Call `supabase.auth.getUser()` to refresh session
- No route blocking — dashboard layout already redirects unauthenticated users

### 2. Auth Callback User Row Creation
- Update `app/auth/callback/route.ts`
- After exchanging code for session, check if `public.users` row exists
- If missing, insert using email + user_metadata (name, role)
- Default role to `customer` if not specified

## Phase 2: Error Pages + Password Reset

### 3. Error Pages
- `app/not-found.tsx` — RTL 404 page with link to home
- `app/error.tsx` — Client error boundary with retry button

### 4. Forgot Password Flow
- `app/auth/forgot-password/page.tsx` — Email form calling `resetPasswordForEmail()`
- `app/auth/reset-password/page.tsx` — New password form calling `updateUser()`
- Add "forgot password" link to login page

## Phase 3: Functional Gaps

### 5. Storage Bucket Migration
- `supabase/migrations/002_storage_bucket.sql` — Creates `photos` bucket with public read policy

### 6. Map/List Filtering
- Verify and fix filtering in `BusinessListPanel` and `BusinessMap`
- Apply `kashrut`, `minRating`, `openNow` filters from `FilterState`

### 7. Search on Non-Homepage
- Navbar search on non-home pages navigates to `/?search=<location>`

### 8. Active Sidebar Link
- Use `usePathname()` in dashboard sidebar to highlight current page

## Phase 4: Polish

### 9. SEO Metadata
- `generateMetadata()` on business detail page
- Static `metadata` exports on auth, dashboard, and static pages

### 10. Image Optimization
- Replace `<img>` with Next.js `<Image>` in PhotoGrid, PhotosPage, BusinessCard
- Configure `remotePatterns` in `next.config.ts` for Supabase storage URLs

### 11. Loading/Error States
- Fix pages returning `null` silently — redirect or show messages

### 12. Env Validation
- `lib/env.ts` — Validate required env vars at build time, no extra deps

### 13. Mobile Menu
- Expand hamburger menu: login/logout, dashboard, home, add business
