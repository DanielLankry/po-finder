# DAN-264 performance-advisor evidence

Status: migration candidate only. No migration, DDL, DML, configuration, or
other production mutation was run. Production catalog and plans were read
through Supabase's Management API read-only query endpoint.

## Live baseline

- Project: `Po Finder` (`ymqlqdhelsocibhnanjy`)
- Database: PostgreSQL 17.6, `ACTIVE_HEALTHY`
- Performance advisor before: 15 notices
  - 3 unindexed foreign keys: `favorites.business_id`,
    `photos.business_id`, `reviews.user_id`
  - 5 auth RLS init-plan warnings: three `users` policies,
    `Users manage own favorites`, and `Owners read own payment attempts`
  - 1 multiple-permissive-policy warning for authenticated `businesses`
    SELECT
  - 6 unused indexes

The advisor baseline was recaptured on 2026-08-26 immediately before this
candidate was finalized. Remediation reference:
<https://supabase.com/docs/guides/database/database-advisors>.

## Catalog and EXPLAIN evidence

No `EXPLAIN ANALYZE` was used against production. Plain `EXPLAIN (FORMAT JSON)`
was sufficient to prove plan shape without executing application queries.

| Predicate | Production plan | Cost | Decision |
| --- | --- | ---: | --- |
| `favorites.business_id = $1` | bitmap scan over `favorites_user_id_business_id_key` | 9.63..13.84 | Add `favorites_business_id_idx`; the chosen composite index has `business_id` trailing and does not provide efficient standalone FK lookup/cascade coverage. |
| `photos.business_id = $1` | sequential scan | 0.00..20.00 | Add `photos_business_id_idx`; this is also a repeated application filter. |
| `reviews.user_id = $1` | bitmap scan over `reviews_business_id_user_id_key` | 6.33..9.50 | Add `reviews_user_id_idx`; the chosen composite index has `user_id` trailing and does not provide efficient standalone FK lookup/cascade coverage. |
| favorite by `(user_id, business_id)` | index-only scan using the composite unique index | 0.15..2.37 | Existing index matches the product query. |
| review by `(business_id, user_id)` | index-only scan using the composite unique index | 0.15..2.37 | Existing index matches the product query. |
| event by `business_id` | bitmap scan using `idx_business_events_business_date` | 1.26..3.40 | The single-column event index is redundant. |

Relevant cumulative table statistics at capture time:

| Table | Live rows | Sequential scans | Index scans |
| --- | ---: | ---: | ---: |
| `favorites` | 0 | 3 | 139 |
| `photos` | 0 | 3,356 | 0 |
| `reviews` | 0 | 6 | 184 |
| `business_events` | 0 | 2 | 68 |

The single-column `idx_business_events_business_id` had zero scans. Its two
longer `business_id`-leading alternatives were used:
`idx_business_events_business` had 37 scans and
`idx_business_events_business_date` had 27 scans. The live plan selected the
latter. This is plan/prefix evidence for the drop, not a drop based only on the
unused counter.

The production tables were empty at capture time. PostgreSQL could therefore
choose a full bitmap scan of either trailing-column composite index at low
estimated cost, but that plan does not demonstrate scalable FK coverage. The
candidate indexes all three reported FK columns as leading columns.

All five other unused indexes remain untouched because low-traffic counters do
not prove they are unnecessary.

## RLS plan and behavior evidence

The live users predicate `auth.uid() = id` produced a sequential scan with the
expanded JWT/current-setting expression in its row filter. The candidate form
`(SELECT auth.uid()) = id` produced `InitPlan 1` and a cached filter of
`(InitPlan 1).col1 = id`. The equivalent businesses owner branch showed the
same change from an inline expression to `InitPlan 1`.

The migration retains each command and ownership comparison. The five
ownership-only policies are scoped to `authenticated`; anonymous callers were
already rejected because `auth.uid()` is NULL. Registration inserts occur only
after a Supabase session exists (`app/auth/register/page.tsx` and
`app/auth/callback/route.ts`).

The merged businesses SELECT policy preserves the old permissive OR behavior:

```text
old = public_visible OR (authenticated AND caller_id = owner_id)
new = role IN (anon, authenticated) AND (public_visible OR caller_id = owner_id)
```

`supabase/tests/database/performance_advisor_rls.test.sql` is a transactional
pgTAP integration test. It creates isolated fixtures, switches to the real
`authenticated` and `anon` database roles, supplies JWT claims through
`request.jwt.claims`, and executes SELECT/INSERT/UPDATE statements against all
five optimized ownership policies and the merged business policy. Its matrix
covers owner/non-owner, legacy, current, expired, inactive, and unverified
businesses, plus denied cross-user profile/favorite writes. Every fixture is
rolled back.

The exact fixture passed 14/14 assertions against a scratch PostgreSQL 17.11
cluster created under `PAPERCLIP_RUN_SCRATCH_DIR`. The scratch schema recreated
the production pre-migration policies and relevant constraints; the candidate
was applied only there. pgTAP was loaded from the Debian extension package, so
the already-satisfied `CREATE EXTENSION` line was omitted from the input stream
for that run. The transaction ended with `ROLLBACK`, the scratch server was
stopped, and production was never contacted by the test.

Post-migration scratch EXPLAIN output confirmed both optimized branches:

```text
Index Only Scan using users_pkey on users
  Index Cond: (id = (InitPlan 1).col1)
  InitPlan 1
    -> Result

Seq Scan on businesses
  Filter: (... OR ((InitPlan 1).col1 = owner_id))
  InitPlan 1
    -> Result
```

The scratch catalog also reported these exact definitions:

```text
favorites_business_id_idx ON public.favorites USING btree (business_id)
photos_business_id_idx    ON public.photos USING btree (business_id)
reviews_user_id_idx       ON public.reviews USING btree (user_id)
```

The normal command for a local Supabase stack or CI database service remains:

```sh
supabase test db supabase/tests/database/performance_advisor_rls.test.sql
```

It must not be run with `--linked`, because that would execute fixtures against
production.

## Expected advisor delta after approval

This is projected output, not a claimed production-after capture. Capturing the
actual after output requires applying the reviewed migration and is therefore
behind Daniel's recorded approval gate.

| Lint | Before | Expected immediately after |
| --- | ---: | ---: |
| Unindexed foreign keys | 3 | 0 |
| Auth RLS init plan | 5 | 0 |
| Multiple permissive policies | 1 | 0 |
| Existing unused indexes | 6 | 5 |
| Newly created unused FK indexes | 0 | 3 until matching queries use them |
| Total | 15 | 8 |

Supabase's linter reports every non-unique index with `idx_scan = 0`, so the
new FK indexes may initially appear as unused on this currently empty launch
database. After approved application, rerun the advisor and the same EXPLAIN
queries; replace this projection with the captured output.

## Candidate, rollback, and verification

- Candidate: `supabase/migrations/20260826063000_remediate_performance_advisor.sql`
- Rollback: `docs/review-artifacts/DAN-264/rollback.sql`
- Focused static tests: `tests/performance-advisor-migration.test.mjs`
- Database RLS integration test:
  `supabase/tests/database/performance_advisor_rls.test.sql`
- Test commands:
  - `node --test tests/performance-advisor-migration.test.mjs`
  - `supabase test db supabase/tests/database/performance_advisor_rls.test.sql`

Post-approval verification sequence:

1. Apply through the governed migration path; do not paste ad hoc DDL into
   production.
2. Rerun the Supabase performance advisor and save its exact output.
3. Rerun the six read-only EXPLAIN predicates above.
4. Run the focused Node test and the normal migration validation in the
   approved release workspace.
5. If rollback is required, review and run `rollback.sql` through the same
   governed migration path, then repeat advisor and RLS checks.

## Documentation checked

- Supabase changelog: <https://supabase.com/changelog>
- Supabase RLS performance guidance:
  <https://supabase.com/docs/guides/database/postgres/row-level-security>
- Supabase index guidance:
  <https://supabase.com/docs/guides/database/postgres/indexes>
- Supabase linter source: <https://github.com/supabase/splinter>
