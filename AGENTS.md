# Repository Guidelines

## Project Structure & Module Organization
`app/` contains the Next.js 16 App Router code: public pages, auth, admin, dashboard flows, and `app/api/*` route handlers. Reusable UI lives in `components/`, with domain groups such as `components/business`, `components/layout`, `components/map`, and `components/ui`. Shared logic and integrations live in `lib/`, including Supabase clients, DB helpers in `lib/db/`, payment code, analytics, and utility functions. Static assets are in `public/`. Database migrations are tracked in `supabase/migrations/`. End-to-end coverage lives in `tests/`, split into `public`, `auth`, `destructive`, and `utils`.

## Build, Test, and Development Commands
Use `npm run dev` to start local development on `http://localhost:3000`. Use `npm run build` to verify the production bundle, and `npm run start` to serve that build. Run `npm run lint` before opening a PR; it uses the repo’s ESLint config for Next.js and TypeScript. Supabase workflows use the packaged scripts, for example `npm run db:diff`, `npm run db:push`, and `npm run db:gen-types`.

## Coding Style & Naming Conventions
This codebase uses TypeScript with strict mode, React function components, and the `@/*` path alias. Follow the existing style: 2-space indentation, semicolons, and double quotes. Use `PascalCase` for component files (`Navbar.tsx`), `camelCase` for functions and hooks, and Next route folder naming for pages (`app/auth/login/page.tsx`). Keep shared helpers in `lib/` instead of embedding them in route files. There is no dedicated formatter config here, so match surrounding code and rely on `npm run lint` for enforcement.

## Testing Guidelines
Tests are Playwright-first. Name specs `*.spec.ts` under `tests/<area>/`. Public route, auth, and SEO coverage already live under `tests/public` and `tests/auth`; destructive paid/unpaid business flows are isolated under `tests/destructive`. Run Playwright with `npx playwright test`. Set `PLAYWRIGHT_BASE_URL` when targeting a non-default environment.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commit style such as `fix(payments): ...`, `fix(ux): ...`, and `diag(payments): ...`. Keep that format for new commits. PRs should include a short problem statement, the concrete user-facing change, any required env or migration steps, and screenshots for visible UI updates. Link the relevant issue or task when one exists.

## Security & Configuration Tips
Keep secrets in `.env.local` only; use `.env.local.example` as the template for new variables. Do not commit generated credentials, production URLs, or Supabase service-role secrets. Treat files under `tests/destructive/` as state-changing and run them only against disposable or explicitly approved environments.

## Launch Notes
Next.js 16 uses `proxy.ts` for request guarding and Supabase session refresh; do not reintroduce `middleware.ts`. Visible Hebrew branding should remain `פה קרוב`, while `pokarov.co.il` is reserved for domains, email addresses, and technical identifiers.

## Project Patterns
- HYP checkout keeps the legacy `/p/` APISign flow but sends both legacy (`SuccessUrl`, `Order`) and CreditGuard-style (`successUrl`, `uniqueid`, `returnUrl`) return fields.
- HYP completion redirects may arrive on page routes such as `/pricing`; `proxy.ts` detects HYP return parameters and redirects them to `/api/payments/return` for settlement.
- Dashboard access is centralized in `lib/dashboard-access.ts`; the navbar reads `/api/account/status` instead of duplicating paid-state Supabase queries client-side.
- Public map/list readiness lives in `lib/public-business.ts`; shared discovery filtering lives in `lib/business-discovery.ts`, hides only confirmed-closed businesses from both map and list, and keeps missing/unknown hours discoverable.
- Shared product-paper UI primitives live in `app/globals.css` under `brand-*`; use `brand-canvas` for the common neighborhood-map paper pattern and the other utilities for ink-bordered panels, tactile controls, and hard-shadow CTAs instead of inventing page-local styles.
- Transient UI must use the same product-paper language: build custom overlays with `brand-modal-overlay`, `brand-dialog-surface`, and `brand-icon-button`, and keep the shared Radix dialog, sheet, select, dropdown, and slider primitives themed. Photo lightboxes are the intentional dark exception, but their controls still use the branded icon treatment.
- The pricing duration slider indexes the ordered `PLAN_CODES` catalog directly: day, week, then one through twelve months. Keep all durations inside that single discrete slider instead of restoring separate short-plan buttons.
- Mobile navbar layout keeps the brand at the RTL start and a compact action group at the opposite edge; account details live in the navigation sheet below 1440px, and favorites render only when a working `onFavoritesOpen` handler is supplied.
- Below 640px, accessibility is reached through the mobile navigation sheet instead of a floating control that can cover card ratings or calls to action. A `PhotoGrid` with one image must render that image at full gallery width rather than reserving an empty secondary column.
- A succeeded, unconsumed `listing` payment attempt is the single-use business INSERT entitlement; the trigger links it to the new business, and `users.subscription_status` must not grant another listing.
- Expired owners retain business/payment reads and normal profile edits, but authenticated clients have no UPDATE grant for `is_active`, `expires_at`, or `boost_expires_at`; current paid listings require approval plus future expiry, while pre-expiry active seed rows with `expires_at IS NULL` are deliberately grandfathered.
- Public discovery queries must always apply the expiry predicate explicitly because the permissive owner SELECT policy intentionally exposes an owner's expired row for dashboard and billing continuity.
- New purchases use `listing_1d`, `listing_7d`, and `listing_1m` through `listing_12m`; exact day plans use immutable `plan_days`, month plans use immutable `duration_months`, and every new listing settlement snapshots the expiry before/after state for newest-first refunds.
- Duration refunds restore stored before/after expiry snapshots and must pass `preflight_refund_payment_entitlement` newest-first; never subtract calendar months because month-end arithmetic is not invertible.
- Expiry reminders run through `/api/cron/expiry-reminders` at 30, 7, and 1 days and deduplicate on `(business_id, expires_at, days_before)`, so a renewed expiry starts a fresh reminder cycle.
- Product analytics are written server-side to `business_analytics_events`; `business_events` is reserved for owner-managed scheduled events.
- Authentication return paths must pass through `safeRedirectPath`; public business selects must exclude owner and business-number fields.
- HYP verification transport failures leave the payment attempt pending for reconciliation; only a completed negative verification marks it failed.
- Review writes require an authenticated user; after `20260715144513_launch_privacy_hardening.sql`, the `photos` bucket is private and UI/API reads must convert stored object paths or legacy URLs into short-lived signed URLs through `lib/storage/photo-urls.ts`.
- Israel schedule resolution is centralized in `lib/utils/schedule.ts`; never reparse `toLocaleString`, overnight hours belong to their start date, exact closing time is closed, and API responses use `hours_status` to distinguish confirmed closed from unknown hours.
- Owner-only business reads use the `get_my_businesses` security-definer RPC because public column grants intentionally exclude `owner_id` and `business_number`; apply the matching migration before deploying code that calls the RPC.
- Patched transitive production packages are pinned through `package.json` overrides; retain those pins unless a dependency upgrade proves `npm audit --omit=dev` stays at zero without them.
- Admin authentication is the signed `admin_session` cookie, independent of Supabase user auth; admin pages and APIs that need private data must use `adminClient()` server-side, and the browser must never receive the service-role key.
- Meta Pixel is mounted through `components/providers/MetaPixelProvider.tsx`; it must remain gated by `po-cookie-consent`, track App Router navigation without duplicate initial page views, and revoke tracking on the existing decline event. Do not add the raw `noscript` image because it cannot honor the JavaScript-stored consent choice.
- Meta standard events remain browser-side and consent-aware: `CompleteRegistration` follows the verified signup callback, `Lead` follows the first real business draft insert, `InitiateCheckout` fires immediately before HYP, and `Purchase` is hydrated only from a succeeded payment owned by the signed-in user. Keep the payment-attempt ID as the Meta event ID and preserve client-side deduplication.
- Pricing registrations redirect toward `/dashboard/billing` and must default to `business_owner`; email and Google signup callbacks carry only the allowlisted `customer` or `business_owner` role, never an admin role.
- The public empty-launch invitation is shown only when the unfiltered platform result is truly empty. A zero-result search or filter must keep the ordinary “change filters” state.
- Destructive Playwright helpers must hard-fail against the production Supabase project or `pokarov.co.il`; production must never be reseeded with QA businesses.

## Known Issues
- Production has `20260715144513_launch_privacy_hardening.sql` applied; preserve that migration version so future CLI pushes do not try to replay the policy cutover.
- If HYP charges a card but no browser return reaches `/api/payments/return`, existing pending attempts must be reconciled manually or via a future transaction inquiry integration.
- Repo-wide `npm run lint` also scans historical `.claude/worktrees` and can fail on stale copies; run targeted ESLint for changed files alongside the production build until those worktrees are excluded.
- `CRON_SECRET` is configured in production; an unauthenticated expiry-reminder request returns `401`, and Vercel Cron supplies the bearer token for authorized runs.
- Production has `20260716045924_add_day_week_listing_plans.sql` applied; preserve that version so future pushes keep the day/week catalog and exact refund functions aligned with migration history.

## Architecture Decisions
- The PostHog-inspired direction is interpreted as Hebrew neighborhood field notes—warm paper, green ink, terracotta accents, offset shadows, and map geometry—so the site keeps its own `פה קרוב` identity rather than copying another product.
- Launch pricing is one duration-based listing product with no subscription, boost sale, promoted badge, or promoted sorting; legacy boost rows/columns remain only for historical audit and refund compatibility.
- Full admin control is exposed through allowlisted server routes for businesses, users, reviews/events, payments, pricing, and coupons; destructive user/content actions require explicit confirmation and remain behind the signed admin session.
