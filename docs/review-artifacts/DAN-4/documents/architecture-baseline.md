# Po Finder architecture and service dependency baseline

Snapshot: 2026-07-28 UTC  
Scope: `pokarov.co.il`, GitHub repository `DanielLankry/po-finder`, Supabase project `Po Finder`, and Vercel project `po-finder`.

## Objective

Establish a verified, decision-ready map of the production architecture, distinguish confirmed facts from assumptions, identify material delivery and runtime risks, and recommend the safest order for deeper work.

No production configuration, secrets, database state, deployment, or paid service was changed during this review.

## Executive recommendation

Keep the current managed Next.js + Vercel + Supabase architecture. It is coherent, current, and serving production successfully. Do not start a rewrite or service consolidation.

The safe next move is to harden the delivery path before feature or growth work:

1. Reconcile repository migrations with production Supabase history in a disposable environment.
2. Add CI and protect `master` before it can auto-deploy production.
3. Inventory environment-variable names and target coverage without exporting secret values.
4. Add HYP transaction inquiry/reconciliation for payments that complete without a browser return.
5. Address the highest-value security and abuse-control findings.
6. Benchmark a Vercel `hnd1` preview and evaluate a future EU database migration only from measured latency and data-residency requirements.

## Confirmed production topology

```text
Browser in Israel
  |
  +--> Cloudflare authoritative DNS + HTTP reverse proxy + edge TLS
         |
         +--> Vercel project po-finder
                |
                +--> Global CDN for static output
                |
                +--> Node.js 24.x Functions in iad1 (Washington, D.C.)
                       |
                       +--> Supabase project ymqlqdhelsocibhnanjy
                       |      Postgres 17, Auth, PostgREST, Storage
                       |      ap-northeast-1 (Tokyo)
                       |
                       +--> HYP hosted payment page / verify / cancel
                       +--> Resend transactional email
                       +--> Sentry error and trace ingestion
                       +--> Vercel Cron daily expiry-reminder request
                       |
Browser-only integrations
  +--> Google Maps JavaScript / Places
  +--> PostHog EU ingestion after consent
  +--> Meta Pixel after consent
  +--> Vercel Analytics after consent

Email
  Cloudflare Email Routing MX --> support@pokarov.co.il destination (unverified)
  Resend --> noreply@pokarov.co.il outbound mail
```

## Confirmed facts and evidence

### GitHub and delivery

- The source of record is the public repository [`DanielLankry/po-finder`](https://github.com/DanielLankry/po-finder), repository ID `1172849204`.
- The default branch is `master`. It is **not protected** according to the GitHub branch API.
- GitHub reports no Actions workflows, and the repository has no `.github/workflows` directory.
- Reviewed commit: [`85277d15a761c0af336a9ff7074b237af25e7cc9`](https://github.com/DanielLankry/po-finder/commit/85277d15a761c0af336a9ff7074b237af25e7cc9).
- The latest Vercel production deployment was built automatically from that exact `master` commit. This confirms GitHub-to-Vercel Git integration and direct production deployment from the default branch.
- Production dependencies are lockfile-backed. `npm audit --omit=dev` reported zero known production vulnerabilities on 2026-07-28.
- There is no explicit repository license.

Primary repository evidence:

- [`package.json`](https://github.com/DanielLankry/po-finder/blob/85277d15a761c0af336a9ff7074b237af25e7cc9/package.json)
- [`package-lock.json`](https://github.com/DanielLankry/po-finder/blob/85277d15a761c0af336a9ff7074b237af25e7cc9/package-lock.json)
- [`AGENTS.md`](https://github.com/DanielLankry/po-finder/blob/85277d15a761c0af336a9ff7074b237af25e7cc9/AGENTS.md)
- [GitHub repository metadata](https://api.github.com/repos/DanielLankry/po-finder)
- [`master` branch metadata](https://api.github.com/repos/DanielLankry/po-finder/branches/master)
- [GitHub Actions workflow inventory](https://api.github.com/repos/DanielLankry/po-finder/actions/workflows)

### Application and Vercel runtime

- The application is Next.js `16.2.12`, React `19.2.7`, TypeScript, and App Router.
- Vercel project: `po-finder`, project ID `prj_HEx8NLwsMLXjO9BMgYsiUXyQod8i`.
- Latest production deployment: `dpl_CGM4vdBhnzL8JC3rkHNQCkRCAakB`, created 2026-07-28T14:07:17Z and ready at 14:08:38Z.
- Vercel reports Node.js `24.x`, Next.js framework detection, Turbopack, production target, and Function region `iad1`.
- The build cloned `master`, restored the Vercel cache, ran `npm run build`, compiled successfully, uploaded source maps to Sentry, and produced static plus dynamic App Router routes.
- The live domain aliases are `pokarov.co.il`, `po-finder.vercel.app`, the team project alias, and the `master` branch alias.
- [`vercel.json`](https://github.com/DanielLankry/po-finder/blob/85277d15a761c0af336a9ff7074b237af25e7cc9/vercel.json) configures `/api/cron/expiry-reminders` daily at `0 6 * * *`.
- No Vercel Function region is set in the repository, so the platform default is used. Vercel documents `iad1` as the default and recommends placing Functions near their data source: [Configuring regions for Vercel Functions](https://vercel.com/docs/functions/configuring-functions/region).
- Vercel reported no runtime error clusters in the preceding seven days. Runtime log counts showed 193 HTTP 200 responses and one 404 in the returned groups.
- Live checks on 2026-07-28:
  - `https://pokarov.co.il/` returned 200.
  - `https://www.pokarov.co.il/` returned 307 to the apex.
  - `https://po-finder.vercel.app/` returned 200.
  - `GET /api/businesses?includeSchedule=1` returned 200 with a valid response shape.
  - `GET /api/cron/expiry-reminders` without a bearer secret returned 401.
  - `/sitemap.xml` returned 200.

Repository evidence:

- [`vercel.json`](https://github.com/DanielLankry/po-finder/blob/85277d15a761c0af336a9ff7074b237af25e7cc9/vercel.json)
- [`proxy.ts`](https://github.com/DanielLankry/po-finder/blob/85277d15a761c0af336a9ff7074b237af25e7cc9/proxy.ts)
- [`app/api/businesses/route.ts`](https://github.com/DanielLankry/po-finder/blob/85277d15a761c0af336a9ff7074b237af25e7cc9/app/api/businesses/route.ts)
- [`app/api/cron/expiry-reminders/route.ts`](https://github.com/DanielLankry/po-finder/blob/85277d15a761c0af336a9ff7074b237af25e7cc9/app/api/cron/expiry-reminders/route.ts)

### Supabase

- Connected project: `Po Finder`, ref `ymqlqdhelsocibhnanjy`.
- Project status: `ACTIVE_HEALTHY`.
- Region: `ap-northeast-1` (Tokyo).
- Database: Postgres 17, platform version `17.6.1.084`, GA channel.
- The application uses Supabase for:
  - Postgres and PostgREST data access.
  - Email/password and Google OAuth authentication.
  - Browser and server session cookies through `@supabase/ssr`.
  - Private photo storage with short-lived signed URLs.
  - Admin operations through a server-only service-role client.
- The remote schema inventory contains 13 application tables in `public`; RLS is enabled on all returned application tables.
- There are no Supabase Edge Functions.
- Installed non-platform extensions returned by the connector are limited to `pg_stat_statements`, `uuid-ossp`, `supabase_vault`, `plpgsql`, and `pgcrypto`.
- The production migration history confirms that the privacy-hardening migration and the day/week pricing migrations are applied.

Repository evidence:

- [`lib/supabase/client.ts`](https://github.com/DanielLankry/po-finder/blob/85277d15a761c0af336a9ff7074b237af25e7cc9/lib/supabase/client.ts)
- [`lib/supabase/server.ts`](https://github.com/DanielLankry/po-finder/blob/85277d15a761c0af336a9ff7074b237af25e7cc9/lib/supabase/server.ts)
- [`lib/supabase/admin.ts`](https://github.com/DanielLankry/po-finder/blob/85277d15a761c0af336a9ff7074b237af25e7cc9/lib/supabase/admin.ts)
- [`lib/storage/photo-urls.ts`](https://github.com/DanielLankry/po-finder/blob/85277d15a761c0af336a9ff7074b237af25e7cc9/lib/storage/photo-urls.ts)
- [`supabase/migrations`](https://github.com/DanielLankry/po-finder/tree/85277d15a761c0af336a9ff7074b237af25e7cc9/supabase/migrations)
- [Supabase project dashboard](https://supabase.com/dashboard/project/ymqlqdhelsocibhnanjy)

### DNS, domain, TLS, and email

- Authoritative nameservers are Cloudflare: `kip.ns.cloudflare.com` and `nia.ns.cloudflare.com`.
- Apex and `www` resolve to Cloudflare anycast addresses. Cloudflare documents that proxied records return Cloudflare anycast IPs rather than the origin: [Proxy status](https://developers.cloudflare.com/dns/proxy-status/).
- HTTP responses include both `server: cloudflare` and Vercel response headers such as `x-vercel-id`, confirming Cloudflare is the public reverse proxy and Vercel is the application origin.
- The apex TLS certificate observed on 2026-07-28 was a Let's Encrypt wildcard certificate for `pokarov.co.il` and `*.pokarov.co.il`, valid 2026-07-24 through 2026-10-22.
- MX records point to Cloudflare Email Routing.
- Apex SPF authorizes Cloudflare Email Routing.
- `send.pokarov.co.il` has the Amazon SES MX and SPF records used by Resend.
- `resend._domainkey.pokarov.co.il` publishes a DKIM public key.
- No `_dmarc.pokarov.co.il` TXT record was observed.
- The registrar, renewal owner, expiry date, Cloudflare account owner, and final destination for `support@pokarov.co.il` were not confirmed.

Live DNS evidence:

- [NS lookup](https://dns.google/resolve?name=pokarov.co.il&type=NS)
- [A lookup](https://dns.google/resolve?name=pokarov.co.il&type=A)
- [MX lookup](https://dns.google/resolve?name=pokarov.co.il&type=MX)
- [`send` TXT lookup](https://dns.google/resolve?name=send.pokarov.co.il&type=TXT)
- [Resend DKIM lookup](https://dns.google/resolve?name=resend._domainkey.pokarov.co.il&type=TXT)
- [Resend domain requirements](https://resend.com/docs/dashboard/domains/introduction)

### External-service dependency inventory

| Service | Runtime relationship | Confirmed configuration evidence | Failure effect |
|---|---|---|---|
| Supabase Database/PostgREST | Server and browser data layer | Supabase clients, DB helpers, migrations | Map, business pages, dashboards, admin, payments, and analytics degrade or fail |
| Supabase Auth | Email/password, Google OAuth, sessions | Auth pages, callback, `proxy.ts` | Login, registration, dashboard, and owner actions fail |
| Supabase Storage | Private `photos` bucket; signed URLs | Privacy migration and photo URL helper | Business images fail while core text data can remain available |
| Vercel Functions/CDN | Next.js host and API runtime | Vercel deployment metadata and build logs | Whole application or dynamic features fail |
| Vercel Cron | Daily authenticated expiry reminders | `vercel.json`, cron route | Expiry reminders are delayed; core site remains available |
| Cloudflare | Authoritative DNS, HTTP proxy/TLS, email routing | NS/A/MX and live headers | Domain and/or support email become unavailable even if Vercel remains healthy |
| Google Maps Platform | Browser map and Places search | [`lib/env.ts`](https://github.com/DanielLankry/po-finder/blob/85277d15a761c0af336a9ff7074b237af25e7cc9/lib/env.ts), map components | Core map/search UX fails; list data may still load |
| HYP / YaadPay | Hosted checkout, redirect verification, same-day cancel | [`lib/hyp.ts`](https://github.com/DanielLankry/po-finder/blob/85277d15a761c0af336a9ff7074b237af25e7cc9/lib/hyp.ts), payment routes | Revenue and entitlement activation fail or become inconsistent |
| Resend | Transactional and support email | [`lib/email.ts`](https://github.com/DanielLankry/po-finder/blob/85277d15a761c0af336a9ff7074b237af25e7cc9/lib/email.ts), contact and cron routes, DNS | Alerts, auto-replies, approvals, and expiry reminders fail |
| Sentry | Client/server/edge errors, tracing, source maps | [`next.config.ts`](https://github.com/DanielLankry/po-finder/blob/85277d15a761c0af336a9ff7074b237af25e7cc9/next.config.ts), instrumentation files, build log | Observability degrades; application should continue |
| PostHog | Browser analytics after consent; EU host fallback | [`lib/posthog.ts`](https://github.com/DanielLankry/po-finder/blob/85277d15a761c0af336a9ff7074b237af25e7cc9/lib/posthog.ts), provider | Product analytics degrades; application continues |
| Meta Pixel | Browser advertising events after consent | [`lib/meta-pixel.ts`](https://github.com/DanielLankry/po-finder/blob/85277d15a761c0af336a9ff7074b237af25e7cc9/lib/meta-pixel.ts), provider | Ad attribution degrades; application continues |
| Vercel Analytics | Browser analytics after consent | [`ConsentAnalytics.tsx`](https://github.com/DanielLankry/po-finder/blob/85277d15a761c0af336a9ff7074b237af25e7cc9/components/providers/ConsentAnalytics.tsx) | Analytics degrades; application continues |

The code and privacy notice consistently identify the same external processors: [`app/privacy/page.tsx`](https://github.com/DanielLankry/po-finder/blob/85277d15a761c0af336a9ff7074b237af25e7cc9/app/privacy/page.tsx).

## Environment-variable contract

Confirmed code references:

- Public/build-visible:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
  - `NEXT_PUBLIC_SITE_URL`
  - `NEXT_PUBLIC_POSTHOG_KEY`
  - `NEXT_PUBLIC_POSTHOG_HOST`
  - `NEXT_PUBLIC_META_PIXEL_ID`
- Server-only:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `RESEND_API_KEY`
  - `CRON_SECRET`
  - `ADMIN_SECRET`
  - `HYP_MASOF`
  - `HYP_PASSP`
  - `HYP_API_KEY`
- Build/integration:
  - Sentry source-map upload requires integration credentials supplied outside application code.

The exact Vercel environment matrix was not exposed by the connected read API. A successful build proves the three variables required by `lib/env.ts` were present for production build, and successful Sentry source-map upload proves build-time Sentry authorization was available. It does **not** prove that every runtime secret is present in production, preview, and development targets.

Secret values must not be copied into architecture notes. The next audit should record only key name, owner, target(s), last rotation date, and tested dependency.

## Material risks

### Critical delivery risk: repository/production migration drift

Production migration history does not cleanly match the repository:

- Several production migrations have names matching repository SQL but different version timestamps.
- Production includes migrations `enforce_duration_price_ladder` and `move_policy_helpers_private`, which are absent from the reviewed repository.
- Production also includes early corrective migrations not represented as versioned files under the same names.
- The repository contains legacy numeric migrations that do not map one-to-one to production history.

This makes a routine `supabase db push`, history repair, clean rebuild, or developer reset unsafe until reconciled. Supabase explicitly warns that direct remote edits and mismatched history cause deployment failures: [Database migrations](https://supabase.com/docs/guides/deployment/database-migrations).

Recommendation: freeze production DDL; export and compare the live schema in a disposable project; restore the exact production migration chain to version control; prove a clean reset and diff before any production repair or push. Production repair or migration requires Daniel approval.

### Critical delivery risk: unprotected `master` auto-deploys production

The default branch is unprotected, has no GitHub Actions checks, and is connected directly to Vercel production. A single push can change production without an independent build/test gate or review.

Recommendation: add a minimal CI gate (`npm ci`, production build, targeted unit tests, and a small non-destructive Playwright smoke suite), require it on pull requests, protect `master`, and use Vercel previews before production promotion.

### High reliability risk: payment completion depends on browser return

The current HYP flow verifies the redirect and settles a Supabase ledger/entitlement. The repository explicitly notes that if HYP charges a card but no browser return reaches `/api/payments/return`, a pending attempt requires manual reconciliation.

HYP now maintains a transaction inquiry API that can query by transaction identifiers or date range: [Transaction inquiry examples](https://developers.hyp.co.il/inquiring-transactions/examples). This is the existing supported solution; replacing HYP is not warranted.

Recommendation: store the appropriate inquiry identifier, run a scheduled inquiry for stale pending attempts, make settlement idempotent, alert on unresolved mismatches, and test lost-return recovery before increasing paid acquisition.

### High performance risk: Vercel Functions and Supabase are on opposite sides of the world

- Dynamic Node.js functions execute in `iad1` (Washington, D.C.).
- The database is in `ap-northeast-1` (Tokyo).
- A synthetic check from this review path observed:
  - cached/static homepage: 0.079–0.102 seconds;
  - database-backed `/api/businesses?includeSchedule=1`: 0.498–0.868 seconds.
- The API response header showed a Paris edge hop and `iad1` compute.

These samples are directional, not a user SLO, but the region mismatch is confirmed and materially explains the dynamic-path penalty. Vercel recommends locating functions close to their data source, and Supabase recommends choosing a region close to users: [Vercel Function regions](https://vercel.com/docs/functions/configuring-functions/region), [Supabase regions](https://supabase.com/docs/guides/platform/regions).

Recommendation: first instrument p50/p95 by route. Then test a preview in Vercel Tokyo (`hnd1`) against production-like read traffic. Treat a future Supabase move to Europe as a separate migration: Supabase region changes require a new project and data migration, not an in-place toggle ([Change project region](https://supabase.com/docs/guides/troubleshooting/change-project-region-eWJo5Z)).

### High security/operability risks

Supabase security advisor findings:

- Leaked password protection is disabled: [remediation](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
- `public.get_my_businesses()` is a `SECURITY DEFINER` RPC executable by `authenticated`. The repository intentionally uses it, but its ownership checks, grants, search path, and exposed columns should be re-reviewed.
- `public.coupons` and `public.expiry_reminder_deliveries` have RLS enabled but no policies. This may intentionally mean server-only denial, but that contract is undocumented and those tables would be clearer in a private schema.

Other confirmed concerns:

- Admin authentication is a shared `ADMIN_SECRET` plus signed eight-hour cookie, separate from Supabase user auth. It lacks per-admin identity, MFA, and granular auditability.
- Public analytics and contact endpoints use an in-memory `Map` rate limiter. Serverless instances do not share durable memory, so it is a best-effort throttle rather than an enforceable global control.
- The Google Maps browser key is necessarily public; its Google Cloud HTTP-referrer and API restrictions were not verified.
- No DMARC record was observed for the domain.

For abuse controls, evaluate Vercel WAF rate limiting before building a custom distributed limiter; it is maintained by the current hosting provider, applies before Function execution, and is available on all plans with usage pricing: [Vercel WAF rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting). Enabling a paid rule requires Daniel approval.

### Medium performance and maintenance findings

Supabase performance advisor reported:

- Unindexed foreign keys on `favorites.business_id`, `photos.business_id`, and `reviews.user_id`.
- Per-row `auth.*` evaluation in several RLS policies.
- Multiple permissive `SELECT` policies on `businesses`.
- Several currently unused indexes.

These are not launch blockers at current scale. Validate query plans and traffic before removing indexes; add obviously missing FK indexes in a reviewed migration after the history is reconciled.

Dependency review:

- The lockfile is current enough to build and audit cleanly.
- Maintained major versions are available for `@supabase/ssr`, `@vercel/analytics`, and `lucide-react`.
- React has a patch update available.
- Do not mix these upgrades with migration or payment-reliability work. Upgrade in isolated preview-tested batches.

## Assumptions and unresolved questions

The following are **not confirmed**:

- Domain registrar, expiry/auto-renew state, renewal owner, and recovery contacts.
- Cloudflare account owner, zone-level WAF/cache rules, origin record values, and break-glass access.
- Destination mailbox behind `support@pokarov.co.il`.
- Exact Vercel plan, spend alerts, deployment protection, environment-variable target coverage, and Git integration promotion settings.
- Supabase plan, backups/PITR, connection-pooler usage, Auth redirect allowlist, SMTP configuration, Google OAuth console owner, and branch availability.
- HYP merchant-console permissions for inquiry/refund operations and the correct production inquiry endpoint assigned during onboarding.
- Google Maps API/referrer restrictions and budget alerts.
- Resend dashboard verification/alerts, despite DNS records being present.
- Sentry alert rules/retention and PostHog project ownership/retention.
- Whether the Vercel project’s `live: false` metadata field has any operational meaning; the ready production deployment and successful public checks are stronger evidence that the site is live.

## Architecture options

### Option A — Harden the existing managed stack

Keep Next.js, Vercel, Supabase, Cloudflare, HYP, Resend, Sentry, PostHog, Meta, and Google Maps. Reconcile state, add delivery gates, and close reliability/security gaps.

Tradeoff: lowest change risk and fastest route to a safe baseline; preserves some multi-vendor operational complexity.

Recommendation: **choose this option**.

### Option B — Regional optimization without a rewrite

Short term: test Vercel `hnd1` Functions to co-locate compute with the Tokyo database.  
Long term: if Israel user latency/data-residency evidence warrants it, create a European Supabase project and migrate database/Auth/Storage, then place Vercel Functions nearby.

Tradeoff: can materially reduce latency, but a Supabase region move is a real migration with Auth, storage, DNS/env, rollback, and cutover work.

Recommendation: run only after Option A’s schema and deployment controls are complete.

### Option C — Consolidate or replace platforms

Examples include moving DNS off Cloudflare, replacing Supabase, self-hosting Postgres, or replacing HYP.

Tradeoff: large operational and regression surface with no current evidence that the managed services are failing.

Recommendation: **do not pursue now**.

## Safest implementation order

1. **Freeze risky paths**
   - No production DDL/history repair.
   - No direct `master` feature pushes.
2. **Reconcile database source of truth**
   - Capture live schema and remote migration list.
   - Reconstruct exact versioned migrations in a disposable Supabase project.
   - Prove clean reset, diff, and advisor results.
3. **Create a safe delivery path**
   - GitHub CI, required reviews/checks, protected `master`, Vercel previews.
4. **Validate configuration ownership**
   - Environment key-name/target matrix, domain renewal, vendor account owners, alerts, and break-glass access.
5. **Close revenue-integrity gaps**
   - HYP inquiry reconciliation, stale-pending alerts, idempotency tests, refund tests.
6. **Close high-value security gaps**
   - Supabase advisor review, admin identity/MFA design, Maps restrictions, DMARC, managed rate limiting.
7. **Measure and optimize region latency**
   - Route-level p50/p95, `hnd1` preview benchmark, then a separate EU migration decision if justified.
8. **Upgrade dependencies**
   - Small isolated batches after the operational baseline is stable.

## Validation plan

- GitHub/Vercel:
  - Verify production commit SHA equals approved merge SHA.
  - Required CI checks block an intentionally failing PR.
  - Preview smoke tests cover public page, database-backed API, auth callback shape, and protected routes.
- Supabase:
  - `supabase migration list --linked` matches committed filenames.
  - Disposable `db reset` succeeds from an empty database.
  - Schema diff against production is empty or fully explained.
  - Security/performance advisors are clean or each finding has an owner and accepted rationale.
- Payments:
  - HYP sandbox success, failure, cancel, duplicate return, lost return, inquiry recovery, and refund paths.
  - No duplicate entitlement and no charged-success left indefinitely pending.
- Domain/email:
  - Apex and `www` checks through Cloudflare and direct Vercel alias.
  - Renewal and recovery ownership recorded.
  - Resend SPF/DKIM and DMARC verified; support routing tested end-to-end.
- Runtime/performance:
  - Sentry/Vercel route p50/p95 before and after any region change.
  - Error-rate and latency rollback thresholds defined before production rollout.
- Security:
  - Service-role key never reaches client bundles.
  - Preview environments cannot mutate production data.
  - Admin, cron, payment, contact, and analytics endpoints receive negative-path tests.

## Decision

The architecture is viable and currently healthy. The largest risks are not framework choice; they are configuration drift, an ungated production branch, payment reconciliation, and cross-region runtime placement. Address those in that order, preserving the existing maintained services.
