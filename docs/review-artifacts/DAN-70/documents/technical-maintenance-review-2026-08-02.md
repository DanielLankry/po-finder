# DAN-70 — Weekly technical maintenance review

**Observed:** 2026-08-02 07:00–07:21 UTC; evidence reverified 07:39–07:44 UTC  
**Production:** <https://pokarov.co.il>  
**Repository:** `DanielLankry/po-finder`  
**Production commit:** `4e12fa3df8bbbed0fadf818dd1bf58add0abc910`  
**Latest production deployment:** `dpl_HKYw3WJL5XSV7JwoM9kLx6HZKpUB` (`READY`)  
**Verdict:** **AMBER — production is serving successfully, but migration reproducibility, mobile performance, CI/security alert coverage, and recovery evidence need action.**

No application code, deployment, database migration, secret, repository setting, or production data was changed during this review.

## Executive findings

| Priority | Finding | Evidence | Disposition |
|---|---|---|---|
| Critical | Production migration history is not reproducible from `master` | Repository has 34 migration files; production reports 19 history rows. Production-only migrations `20260716091547_enforce_duration_price_ladder` and `20260716091648_move_policy_helpers_private` are present only on open, conflicting draft PR #7. Several shared migration names also have different timestamps locally and remotely. | DAN-71. Freeze database pushes/history repair until reviewed and approved. |
| High | Mobile homepage performance is poor | Lighthouse 13 mobile runs scored 60 and 49 with LCP 7.66s and 7.97s. First-run TBT was 577ms. A repeat estimated 425 KiB unused JS; Google Maps transferred about 350 KiB and first-party chunks produced multiple long tasks. Desktop scored 95 with LCP 1.53s. | DAN-72. |
| High | CI and security alerting are incomplete | GitHub Actions returned no workflow runs; the repository has no `.github/workflows`; Dependabot alerts are disabled; CodeQL reports no analysis. A fresh repo-wide lint passes with one warning, but generated-output ignores and a clean-clone CI check are not enforced. | DAN-73. |
| High | Backup/recovery posture is unverified | Supabase reports `ACTIVE_HEALTHY`, but the available management surface did not expose retention, PITR/latest restore point, or a completed restore drill. A proposed runbook exists on the current unmerged branch, but not on production `master`; it has no executed backup or restore evidence. | DAN-74; any restore/branch/cost requires Daniel approval. |
| High | Supabase advisor debt remains | Security: leaked-password protection disabled; authenticated `SECURITY DEFINER` RPC warning; two RLS-without-policy INFO findings. Performance: 3 unindexed foreign keys, 5 auth RLS init-plan warnings, 1 multiple-permissive-policy warning, and 5 unused indexes. | DAN-75; intentional exceptions must be documented, not blindly changed. |
| High | HYP can leave charged attempts pending | Repository operations notes document the generic charged-without-browser-return gap and an existing pending production payment that requires reconciliation. The notes do not identify its date or product. | DAN-76. Any live inquiry/settlement/refund requires Daniel approval. |

## Builds, checks, and delivery health

- Vercel returned 9 deployments since 2026-07-26; all 9 were `READY`. The latest production deployment corresponds to GitHub `master` commit `4e12fa3`.
- Latest Vercel build error scan contained no build error. It reported the existing edge-runtime/static-generation warning and `Build Completed in /vercel/output [59s]`.
- Vercel reported zero grouped runtime error clusters, zero production 5xx route groups, and zero unresolved toolbar threads over the selected 7-day window.
- GitHub has no Actions run history. Vercel is currently the only visible PR/deployment status provider.
- During the review the shared checkout moved to `a8765b4`; it is 5 commits ahead and 1 merge commit behind `origin/master`. Those unmerged commits include accessibility/resilience fixes, regression tests, and the proposed backup/migration runbooks. They are not part of production commit `4e12fa3` and need Atlas-controlled delivery triage after the active regression review.
- Local `npm run build` without environment configuration failed as expected on required build-time variables. With non-secret placeholder values for every documented build-time variable, Next.js 16.2.12 built successfully and generated 50/50 static pages.
- `npx tsc --noEmit`: pass.
- `node --test tests/*.test.mjs`: 39/39 pass. Node emits `MODULE_TYPELESS_PACKAGE_JSON` warnings because `package.json` has no module type; this is non-blocking.
- Fresh `npm run lint` at 07:42 UTC: pass with zero errors and one warning in `tests/public/link-crawl.spec.ts`. The earlier 185-error/2,829-warning result depended on generated `playwright-report` assets that are no longer present apart from `playwright-report/index.html`; it is not currently reproducible. An explicit generated-output ignore remains valid deterministic-CI hardening, not a current lint failure.
- The checkout already contained unrelated untracked files (`FACEBOOK-PAGE-OPERATING-PLAYBOOK.md`, `supabase/.temp/linked-project.json`, `tests/public/accessibility-security.spec.ts`). They were preserved and are not part of DAN-70.

## Dependencies and repository security

- `npm audit --omit=dev --json`: **0 production vulnerabilities** across 275 production packages.
- Full `npm audit --json` is registry-backed and produced divergent affected-package counts on the unchanged `a8765b4` checkout. Two Sentinel runs at approximately 07:39 UTC returned four development-tree package entries: `brace-expansion` (high), `@hono/node-server` and `@modelcontextprotocol/sdk` (moderate), and `body-parser` (low). Forge runs at 07:42 and 07:43 UTC with Node 24.15.0/npm 11.17.0 returned 23 propagated affected-package nodes (17 high, 3 moderate, 3 low), not 23 independent advisories. The latter output traces to three underlying GHSA records (`brace-expansion`, `@hono/node-server`, and `body-parser`) propagated through the ESLint/minimatch and shadcn/MCP trees. There are no critical findings and no production finding. DAN-73 must capture the audit timestamp, tool versions, raw JSON, and lockfile commit in CI rather than treating a transient aggregate count as fixed.
- `npm outdated --json` shows patch/minor updates available for Sentry, Supabase JS/CLI, Playwright, PostHog, Radix, Resend, Zod, Tailwind, and other tooling; major upgrades exist for some packages and need isolated regression work.
- GitHub Dependabot alerts endpoint returned `403` because Dependabot alerts are disabled.
- GitHub code-scanning endpoint returned `404 no analysis found`.
- GitHub secret-scanning returned zero open alerts.
- Open PRs #1, #6, and #7 are all conflicting/`DIRTY`; #6 and #7 are drafts. They should be triaged after DAN-71 preserves the production-only migration artifacts from #7.

## Vercel and public-route health

- Project `prj_HEx8NLwsMLXjO9BMgYsiUXyQod8i` uses Next.js and Node 24.x. The audit host also runs Node 24.15.0.
- Latest production deployment: <https://vercel.com/daniellankrys-projects/po-finder/HKYw3WJL5XSV7JwoM9kLx6HZKpUB>.
- Public probes returned `200` for `/`, `/pricing`, `/api/businesses`, `/robots.txt`, and `/sitemap.xml`. `/businesses` returned `404`; the implemented listing route is `/vendors`, so this is not classified as a regression.
- Homepage TTFB during the point probe was about 121ms. Ten sequential `/api/businesses` probes all returned `200`, with mean TTFB 662ms and an observed range of 396ms–1.454s.
- Security headers are present on production: HSTS, CSP `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, strict-origin referrer policy, and a restrictive permissions policy.

## Performance and Core Web Vitals

These are throttled Lighthouse lab measurements, not real-user CWV percentiles.

| Profile | Score | FCP | LCP | TBT | CLS | Transfer |
|---|---:|---:|---:|---:|---:|---:|
| Mobile run 1 | 60 | 1.10s | 7.66s | 577ms | 0.0029 | 1.14 MB |
| Mobile run 2 | 49 | — | 7.97s | — | — | — |
| Desktop | 95 | 0.32s | 1.53s | 21ms | 0.0021 | 1.14 MB |

The repeat mobile trace identified the empty-launch invitation text as the LCP element and recorded about 2.18s of element-render delay. It estimated 425 KiB of removable JavaScript. The largest long tasks were attributed to the first-party application chunk; Google Maps contributed about 350 KiB of transfer. The PageSpeed Insights API could not provide CrUX data because the available caller quota was zero. The code mounts consent-gated Vercel Web Analytics but does not mount `@vercel/speed-insights`, so no accessible production RUM CWV evidence was available.

## Supabase health, security, and migration drift

- Project `ymqlqdhelsocibhnanjy` (`Po Finder`) is `ACTIVE_HEALTHY`, region `ap-northeast-1`, PostgreSQL `17.6.1.084`.
- Auth and Storage logs returned no entries in the sampled 24-hour window. PostgreSQL logs showed normal checkpoints and one client connection reset; no fatal database signal was returned.
- Data API logs sampled during the review were predominantly `200`; observed `406` responses were lookups for a deliberately nonexistent UUID used by production probes, not a server failure.
- The `get_my_businesses()` security-definer warning is expected by the current architecture: the migration revokes execution from `PUBLIC`/`anon`, grants only `authenticated`, and the repository contract requires the RPC for owner-private columns. DAN-75 must still revalidate its body, `search_path`, grants, and ownership against production.
- The RLS-without-policy INFO findings on `coupons` and `expiry_reminder_deliveries` may be correct for service-role/admin-only tables. DAN-75 must verify grants before accepting them as documented exceptions.
- Current Supabase breaking-change review found no explicit extension version pin and found explicit table grants in recent migrations. The upcoming platform change that stops automatically exposing new public tables reinforces the need to keep explicit grants and RLS together: <https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically>.

### Migration history comparison

Production reports 19 migration rows. The repository contains 34 files. Exact-match recent versions are limited to:

- `20260714054020_enforce_paid_listing_lifecycle`
- `20260714054311_preserve_legacy_public_listings`
- `20260715144513_launch_privacy_hardening`
- `20260716045924_add_day_week_listing_plans`
- `20260716071745_add_two_three_day_listing_plans`

Examples of timestamp/name divergence:

| Repository | Production history |
|---|---|
| `20260714064146_pricing_v3_free_draft_product_catalog.sql` | `20260714071220_pricing_v3_free_draft_product_catalog` |
| `20260714105000_duration_slider_pricing.sql` | `20260714082321_duration_slider_pricing` |
| `20260714105500_deactivate_legacy_payment_products.sql` | `20260714083850_deactivate_legacy_payment_products` |
| `20260714112838_split_business_analytics_events.sql` | `20260714131423_split_business_analytics_events` |
| `20260714133500_harden_review_policies.sql` | `20260714131839_harden_review_policies` |

Production additionally records `20260716091547_enforce_duration_price_ladder` and `20260716091648_move_policy_helpers_private`. Their SQL files exist on PR #7 head `96a4cf5aeaa7fc8e291d3cee36109f8e0213d51a`, but not on `master`. This makes a future naïve migration push unsafe. DAN-71 is critical and must complete before any new database migration work.

The current unmerged branch already contains `docs/operations/migration-history-reconciliation-plan.md` with the same five exact matches, 14 remote-only versions, 29 local-only file rows, safety invariants, disposable rebuild requirements, and a Daniel approval gate. DAN-71 should use that reviewed planning artifact as its starting point and move the canonical evidence onto a dedicated reviewable delivery branch; it must not execute the production repair.

## Backup and recovery signals

Positive signals are limited to a healthy project state, normal sampled database logs, and a rollback-candidate Vercel production artifact. The current unmerged branch contains `docs/operations/backup-recovery-runbook.md`, which proposes a 24-hour RPO, four-hour RTO, daily logical exports, separate Storage coverage, and a quarterly restore drill. It explicitly states that no accessible backup, PITR, owned off-site export, or prior restore drill had been verified on 2026-08-01. The design is useful but does not prove recoverability, and it is not on production `master`. Backup retention, PITR, last successful snapshot, restore permissions, integrity verification, and actual RTO therefore remain unknown. DAN-74 owns a non-production recovery drill; it is explicitly gated from creating resources, incurring cost, or restoring data without Daniel approval.

## Prioritized implementation backlog created

1. **DAN-71 — Critical:** Reconcile production Supabase migration history with the repository.
2. **DAN-72 — High:** Reduce mobile homepage LCP and JavaScript cost.
3. **DAN-73 — High:** Restore deterministic CI, lint, and dependency alerting.
4. **DAN-74 — High:** Verify Supabase backup retention and perform a recovery drill.
5. **DAN-75 — High:** Remediate and document Supabase advisor findings.
6. **DAN-76 — High:** Close the HYP pending-payment reconciliation gap.

## Commands and read-only checks executed

```text
git fetch --prune origin
gh run list --repo DanielLankry/po-finder ...
gh pr list/view --repo DanielLankry/po-finder ...
gh api repos/DanielLankry/po-finder/{dependabot,code-scanning,secret-scanning}/alerts
npm audit --omit=dev --json
npm audit --json
npm outdated --json
npm run lint
npx eslint app components lib tests proxy.ts instrumentation*.ts next.config.ts sentry*.ts
npx tsc --noEmit
node --test tests/*.test.mjs
npm run build                         # first confirmed missing required build env
<non-secret placeholder build env> npm run build
curl production routes and headers
Lighthouse 13.0.1 mobile (two runs) and desktop
Supabase project, migration, advisor, and 24-hour log reads
Vercel project, deployment, build-log, runtime-error, 5xx, and toolbar-thread reads
```

### Post-review reverification evidence

All commands below ran on unchanged checkout `a8765b4bf6a092e58ff387e843901dd8aa1c2bec`.

| UTC | Command | Exit | Exact result |
|---|---|---:|---|
| ~07:39 | `npm audit --json` (Sentinel, twice) | 1 | 4 affected package entries: 1 high, 2 moderate, 1 low |
| 07:42 | `npm audit --omit=dev --json` (Forge) | 0 | 0 total; 275 production dependencies |
| 07:42 | `npm audit --json` (Forge) | 1 | 23 propagated package nodes: 17 high, 3 moderate, 3 low |
| 07:42 | `npm run lint` (Forge) | 0 | 0 errors, 1 warning at `tests/public/link-crawl.spec.ts:28` |
| 07:43 | `npm audit --json` (Forge) | 1 | Same 23-node aggregate; GHSA sources `GHSA-mh99-v99m-4gvg`, `GHSA-frvp-7c67-39w9`, and `GHSA-v422-hmwv-36x6` |

This table preserves the time and counting-method difference: npm's `metadata.vulnerabilities.total` counts affected package nodes after meta-vulnerability propagation, not unique advisory records. The production-tree result was stable at zero.

## Verification summary

- Production availability: **PASS**
- Recent Vercel deployments/builds: **PASS**
- Vercel runtime errors/5xx: **PASS for available 7-day telemetry**
- TypeScript/unit/build with documented placeholders: **PASS**
- Repo-wide lint: **PASS with one warning; prior generated-report failure not currently reproducible**
- Production dependency audit: **PASS (0)**
- Development dependency audit: **FAIL/maintenance debt; dynamic aggregate observed as 4 or 23 affected package nodes, with three underlying GHSA records in the 07:43 output**
- GitHub CI/dependency/code scanning: **FAIL/not configured**
- Supabase platform health: **PASS**
- Supabase advisor posture: **AMBER**
- Mobile performance: **FAIL**
- Migration reproducibility: **FAIL / release-blocking for future DB work**
- Backup/recovery proof: **UNKNOWN / unverified**

