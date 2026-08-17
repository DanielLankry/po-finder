# DAN-152 Supabase Migration History Reconstruction

## Scope

Reconstructed the missing launch-era Supabase migration files on a durable task branch without executing database migrations.

## Restored Files

- `supabase/migrations/20260716091547_enforce_duration_price_ladder.sql`
- `supabase/migrations/20260716091648_move_policy_helpers_private.sql`

## Source Evidence

The files were restored exactly from historical Git commit `96a4cf5aeaa7fc8e291d3cee36109f8e0213d51a` (`fix(launch): harden pricing privacy and mobile UI`).

Evidence commands:

```bash
git show --stat --oneline --name-status 96a4cf5 -- supabase/migrations
git show 96a4cf5:supabase/migrations/20260716091547_enforce_duration_price_ladder.sql
git show 96a4cf5:supabase/migrations/20260716091648_move_policy_helpers_private.sql
```

## Verification

No Supabase migration was run. Verification is limited to repository history reconstruction:

```bash
find supabase/migrations -maxdepth 1 -type f -name '*.sql' -printf '%f\n' | sort
git diff --cached --check
```

Sentinel review is required before development completion.
