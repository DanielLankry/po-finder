# Po Finder backup and restore controls

Owner: Rivet
Lead: Forge
Reviewer: Sentinel
Decision/approval source: DAN-267, recorded by Atlas from Daniel approval on 2026-08-28

## Scope

Po Finder runs on the Free Supabase plan. Repository controls therefore use an
independent logical database export plus a separate Storage-object export. They
do not use Supabase managed daily backup restore, PITR, Branching, or
restore-to-new-project.

Approved operating target:

- RPO: 24 hours for database rows and Storage objects.
- RTO: 8 hours to a validated recovery target handoff.
- Schedule: daily around 02:15 Asia/Jerusalem.
- Retention: 35 daily encrypted off-site recovery sets.
- Drill cadence: quarterly and after material Auth, Storage, schema, or backup
  tooling changes.

## Hard gates

The scripts and workflow are not enough to authorize a restore. Operators must
have a recorded approval that names the off-site destination, protected
credentials, disposable Supabase target, target teardown, and reviewer path.

Never use these controls to:

- restore or mutate the production project `ymqlqdhelsocibhnanjy`;
- use `pokarov.co.il` as a restore target;
- use the inactive `Shift_Database` project;
- create a paid plan, paid add-on, external service, or paid storage;
- write application data to production during a drill;
- print database URLs, tokens, object names, SQL contents, or customer data.

## Export workflow

Workflow: `.github/workflows/backup-recovery.yml`
Script: `scripts/backup/export-recovery-set.sh`

The workflow runs from the protected `backup-recovery` GitHub environment by
manual dispatch or by the two UTC cron entries needed to cover daylight-saving
time for Asia/Jerusalem. The job identifies the exact export schedule before it
applies the local 02:00 gate. A disjoint monitor schedule and workflow-level
concurrency group prevent monitor/export overlap and concurrent recovery jobs.

Required protected secrets:

- `PO_FINDER_BACKUP_SOURCE_DB_URL`: read-capable Supabase Postgres URL.
- `PO_FINDER_BACKUP_AGE_RECIPIENTS`: comma-separated age public recipients;
  at least two recipients are required.
- `PO_FINDER_BACKUP_DESTINATION_RCLONE`: rclone destination prefix for encrypted
  recovery sets and `latest-success.json`.
- `PO_FINDER_STORAGE_RCLONE_SOURCE`: rclone source for Supabase Storage objects.
- `PO_FINDER_BACKUP_RCLONE_CONFIG`: complete protected rclone configuration for
  the named off-site, source Storage, and disposable target Storage remotes.
  The workflow writes it with mode `0600` under `RUNNER_TEMP`, points
  `RCLONE_CONFIG` to it, and removes it in an `always()` cleanup step. Never
  commit this content or pass backend credentials on a command line.

The runner installs checksum-pinned rclone `1.75.0`. Before an export or marker
check, the scripts require each named remote to exist in that protected config
and perform a read-only root listing to validate configuration and credentials.

Each successful export:

1. Captures before/after row counts and deterministic row checksums for all
   public base tables plus `auth.users`, `auth.identities`, `storage.buckets`,
   and `storage.objects`.
2. Refuses to publish if the before/after manifests differ.
3. Runs Supabase's documented role, schema, and data dump sequence.
4. Copies Storage objects separately through rclone.
5. Packages the recovery set, verifies the archive, encrypts it with age, and
   uploads only ciphertext plus a non-sensitive success marker.
6. Writes the immutable run marker with run id, completion time, manifest hash,
   ciphertext hash, size, source region, commit, RPO, and retention.
7. Verifies the remote ciphertext and completes the 35-day retention operation.
8. Publishes the global `latest-success.json` last. A failed verification or
   retention operation therefore cannot advertise the run as healthy.

The disjoint scheduled monitor checks `latest-success.json` at 05:45, 11:45,
and 17:45 UTC, between the daily export windows. It fails when the latest
completed marker is older than 36 hours; GitHub Actions failure notifications
for the protected environment are the alert path for Atlas/Rivet until a
separately approved incident channel is configured.

## Restore drill workflow

Script: `scripts/backup/restore-drill.sh`

Run restore drills only by manual dispatch after approval. The operator supplies
the approved disposable target ref and separately types
`RESTORE:<approved-target-ref>`. The protected environment supplies a configured
target ref independently; all three values must agree. The script refuses known
production target strings and malformed project refs.

Required protected secrets:

- `PO_FINDER_RESTORE_TARGET_DB_URL`: disposable target Postgres URL.
- `PO_FINDER_RESTORE_TARGET_REF`: protected disposable project ref independently
  bound to the target credentials.
- `PO_FINDER_RESTORE_AGE_IDENTITY`: age private identity material for the
  approved restore operator. The workflow writes it to a temporary file.
- `PO_FINDER_BACKUP_DESTINATION_RCLONE`: read path for encrypted recovery sets.
- `PO_FINDER_RESTORE_STORAGE_RCLONE_DESTINATION`: disposable target Storage
  destination.

Before any recovery-set download or target write, the script requires the
database URL to use either the exact `db.<ref>.supabase.co` direct host or a
Supabase pooler with username `postgres.<ref>`. It then inspects only rclone's
redacted target configuration and requires the Storage S3 endpoint to be the
same approved project ref. Both source and target remotes must pass a read-only
root listing. Aliased/proxied database targets and Storage remotes without an
exact Supabase project endpoint are deliberately rejected.

The drill:

1. Downloads `latest-success.json` and the named encrypted recovery set.
2. Verifies ciphertext and manifest hashes before decrypting/restoring.
3. Restores roles, schema, and data to the disposable target in one transaction.
4. Restores Storage objects when present.
5. Recomputes durable table counts and checksums on the target.
6. Fails the drill on any count/checksum mismatch.
7. Emits a redacted JSON report for Sentinel review.

Sentinel review is mandatory before calling the implementation complete. The
review packet must include the workflow run URL, commit SHA, latest success
marker, redacted drill report, and exact command/test output.

## Source references

- Supabase backups: https://supabase.com/docs/guides/platform/backups
- Supabase CLI backup/restore sequence:
  https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
- Supabase Storage object download guidance:
  https://supabase.com/docs/guides/storage/management/download-objects
- Supabase Storage S3 endpoint and server-side credential guidance:
  https://supabase.com/docs/guides/storage/s3/authentication
- rclone configuration and redacted configuration commands:
  https://rclone.org/docs/ and https://rclone.org/commands/rclone_config_redacted/
- age encryption: https://github.com/FiloSottile/age
- Relevant Supabase changelog checks on 2026-08-28:
  https://supabase.com/changelog/bulk-prepare-retry-on-transient-failure and
  https://supabase.com/changelog/restore-credential-resync
