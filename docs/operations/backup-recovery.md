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
time for Asia/Jerusalem. The job gates scheduled runs to the local 02:00 hour.

Required protected secrets:

- `PO_FINDER_BACKUP_SOURCE_DB_URL`: read-capable Supabase Postgres URL.
- `PO_FINDER_BACKUP_AGE_RECIPIENTS`: comma-separated age public recipients;
  at least two recipients are required.
- `PO_FINDER_BACKUP_DESTINATION_RCLONE`: rclone destination prefix for encrypted
  recovery sets and `latest-success.json`.
- `PO_FINDER_STORAGE_RCLONE_SOURCE`: rclone source for Supabase Storage objects.

Each successful export:

1. Captures before/after row counts and deterministic row checksums for all
   public base tables plus `auth.users`, `auth.identities`, `storage.buckets`,
   and `storage.objects`.
2. Refuses to publish if the before/after manifests differ.
3. Runs Supabase's documented role, schema, and data dump sequence.
4. Copies Storage objects separately through rclone.
5. Packages the recovery set, verifies the archive, encrypts it with age, and
   uploads only ciphertext plus a non-sensitive success marker.
6. Writes `latest-success.json` with run id, completion time, manifest hash,
   ciphertext hash, size, source region, commit, RPO, and retention.
7. Deletes encrypted recovery archives older than 35 days at the destination.

The scheduled workflow also checks `latest-success.json` every six hours outside
the export window. It fails when the latest completed marker is older than 36
hours; GitHub Actions failure notifications for the protected environment are
the alert path for Atlas/Rivet until a separately approved incident channel is
configured.

## Restore drill workflow

Script: `scripts/backup/restore-drill.sh`

Run restore drills only by manual dispatch after approval. The operator supplies
the approved disposable target ref in the workflow input; the same ref is used
as the explicit confirmation value. The script refuses known production target
strings.

Required protected secrets:

- `PO_FINDER_RESTORE_TARGET_DB_URL`: disposable target Postgres URL.
- `PO_FINDER_RESTORE_AGE_IDENTITY`: age private identity material for the
  approved restore operator. The workflow writes it to a temporary file.
- `PO_FINDER_BACKUP_DESTINATION_RCLONE`: read path for encrypted recovery sets.
- `PO_FINDER_RESTORE_STORAGE_RCLONE_DESTINATION`: disposable target Storage
  destination.

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
- age encryption: https://github.com/FiloSottile/age
- Relevant Supabase changelog checks on 2026-08-28:
  https://supabase.com/changelog/bulk-prepare-retry-on-transient-failure and
  https://supabase.com/changelog/restore-credential-resync
