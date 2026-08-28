# DAN-283 evidence

## Implemented controls

- Added `scripts/backup/export-recovery-set.sh` for encrypted logical database
  plus Storage recovery-set export.
- Added `scripts/backup/restore-drill.sh` for approved disposable restore drills.
- Added `scripts/backup/check-latest-success.sh` for the 36-hour marker monitor.
- Added `.github/workflows/backup-recovery.yml` for protected manual and
  scheduled execution.
- Added `docs/operations/backup-recovery.md` with operator gates, secrets,
  pass criteria, and source references.
- Added `tests/backup-controls.test.mjs` to validate repository guardrails
  without using real credentials.

## Required live evidence after protected secrets are configured

The first operational run must add:

- GitHub Actions run URL for the export.
- `latest-success.json` values: completion time, run id, manifest hash,
  ciphertext hash, and ciphertext size.
- GitHub Actions run URL for the restore drill.
- Redacted restore drill JSON report.
- Sentinel review approval.

Until those items exist, the repository controls are implemented but operational
recoverability is not proven.

## Source links checked during implementation

- Supabase backups:
  https://supabase.com/docs/guides/platform/backups
- Supabase CLI backup/restore:
  https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
- Supabase changelog backup scheduling fix:
  https://supabase.com/changelog/bulk-prepare-retry-on-transient-failure
- Supabase changelog restore credential fix:
  https://supabase.com/changelog/restore-credential-resync
- `actions/checkout` v4 SHA:
  https://github.com/actions/checkout/tree/11d5960a326750d5838078e36cf38b85af677262
