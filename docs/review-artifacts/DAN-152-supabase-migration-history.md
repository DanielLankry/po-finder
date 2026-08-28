# DAN-152 Supabase Migration History Reconstruction

## Result

The repository migration directory now represents the current read-only production
ledger: 20 timestamped files, with no legacy numeric or mismatched timestamp paths.
`supabase/migration-history.json` is the machine-readable audit record. It captures:

- the exact remote `master` baseline commit (`2f44e40d82bfa3c61ebe6616a237f726e2f6f176`);
- path and Git blob identity for all 34 baseline migration files;
- a `mapped` or `pre_ledger` disposition for every baseline file;
- all 20 production version/name pairs and normalized statement SHA-256 hashes; and
- immutable PR #7 source commit/blob identities for the three launch migrations
  that are absent from `master`.

## Current-ledger provenance

On 2026-08-17, read-only `supabase migration list --linked` returned 20 remote
versions. `supabase migration fetch --linked` supplied the stored names and SQL
statements without changing migration history. The new row is:

`20260811100008_first_twenty_business_promotion.sql`

Its durable source is open PR #7 (`codex/production-launch-hardening`) at commit
`12e184587c36b9ed803e4cada62a20dbb9ae91a6`, blob
`dd4cc2724438ad5c68f4122291559f38753491b6`. The repository file has that exact
Git blob identity. The same byte-for-byte check is retained for:

- `20260716091547_enforce_duration_price_ladder.sql` — blob `cca51541bc192e10fd7c6115305017f7bac37717`
- `20260716091648_move_policy_helpers_private.sql` — blob `c2427f67b773a58f6b6bd7a3dbbc8d71cb72408b`

## Normalization and verification

Normalized statement hashes convert CRLF to LF, remove horizontal end-of-line
whitespace, and remove trailing EOF whitespace. They do not alter executable SQL.
The focused test verifies the exact active file
set, all 20 hashes, the 34-file baseline map, and PR blob preservation:

```bash
node --test tests/migration-history-reconciliation.test.mjs
npx eslint tests/migration-history-reconciliation.test.mjs
SUPABASE_TELEMETRY_DISABLED=1 npx supabase migration list --linked
SUPABASE_TELEMETRY_DISABLED=1 npx supabase db push --linked --dry-run
```

No migration repair, non-dry-run push, DDL, production write, merge, or deployment
is part of this reconciliation. The retained ledger is intentionally not a
from-zero bootstrap; producing one is separate approval-gated work.

Sentinel independent review is required before development completion.
