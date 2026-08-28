import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { test } from "node:test";

const exportScript = readFileSync("scripts/backup/export-recovery-set.sh", "utf8");
const restoreScript = readFileSync("scripts/backup/restore-drill.sh", "utf8");
const markerCheckScript = readFileSync("scripts/backup/check-latest-success.sh", "utf8");
const workflow = readFileSync(".github/workflows/backup-recovery.yml", "utf8");
const runbook = readFileSync("docs/operations/backup-recovery.md", "utf8");

test("backup scripts are executable and fail closed on secrets", () => {
  assert.equal(statSync("scripts/backup/export-recovery-set.sh").mode & 0o111, 0o111);
  assert.equal(statSync("scripts/backup/restore-drill.sh").mode & 0o111, 0o111);
  assert.equal(statSync("scripts/backup/check-latest-success.sh").mode & 0o111, 0o111);
  assert.match(exportScript, /Refusing to run with shell xtrace enabled/);
  assert.match(restoreScript, /Refusing to run with shell xtrace enabled/);
  assert.match(markerCheckScript, /Refusing to run with shell xtrace enabled/);
  assert.match(exportScript, /require_env SOURCE_DB_URL/);
  assert.match(exportScript, /require_env AGE_RECIPIENTS/);
  assert.match(restoreScript, /require_env CONFIRM_DISPOSABLE_RESTORE/);
});

test("export controls enforce encrypted off-site recovery markers", () => {
  assert.match(exportScript, /At least two age recipients are required/);
  assert.match(exportScript, /manifest-before\.txt/);
  assert.match(exportScript, /manifest-after\.txt/);
  assert.match(exportScript, /stable_manifest_lines/);
  assert.match(exportScript, /Source changed during backup; refusing to publish/);
  assert.match(exportScript, /latest-success\.json/);
  assert.match(exportScript, /BACKUP_RETENTION_DAYS:-35/);
  assert.match(exportScript, /storage-manifest\.txt/);
});

test("restore drill refuses production and requires disposable confirmation", () => {
  assert.match(restoreScript, /ymqlqdhelsocibhnanjy/);
  assert.match(restoreScript, /pokarov\.co\.il/);
  assert.match(restoreScript, /CONFIRM_DISPOSABLE_RESTORE must exactly match/);
  assert.match(restoreScript, /Ciphertext hash mismatch/);
  assert.match(restoreScript, /Manifest hash mismatch/);
  assert.match(restoreScript, /Restored table counts\/checksums do not match/);
  assert.doesNotMatch(restoreScript, /Shift_Database/);
});

test("workflow uses protected environment, pinned actions, and no production restore trigger", () => {
  assert.match(workflow, /environment: backup-recovery/);
  assert.match(workflow, /actions\/checkout@[0-9a-f]{40}/);
  assert.match(workflow, /node_modules\/\.bin/);
  assert.match(workflow, /workflow_dispatch/);
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /TZ=Asia\/Jerusalem/);
  assert.match(workflow, /run_export=true/);
  assert.match(workflow, /Check latest success marker freshness/);
  assert.match(workflow, /PO_FINDER_RESTORE_AGE_IDENTITY/);
  assert.doesNotMatch(workflow, /pull_request/);
  assert.doesNotMatch(workflow, /PO_FINDER_PRODUCTION_DB_URL/);
});

test("marker monitor enforces the 36-hour alert threshold", () => {
  assert.match(markerCheckScript, /BACKUP_MAX_SUCCESS_AGE_HOURS:-36/);
  assert.match(markerCheckScript, /completedAtUtc/);
  assert.match(markerCheckScript, /older than/);
  assert.match(runbook, /36\s+hours/);
});

test("runbook records gates, source links, and Sentinel review requirement", () => {
  assert.match(runbook, /Lead: Forge/);
  assert.match(runbook, /Reviewer: Sentinel/);
  assert.match(runbook, /ymqlqdhelsocibhnanjy/);
  assert.match(runbook, /Shift_Database/);
  assert.match(runbook, /Sentinel review is mandatory/);
  assert.match(runbook, /https:\/\/supabase.com\/docs\/guides\/platform\/backups/);
  assert.match(runbook, /https:\/\/supabase.com\/docs\/guides\/platform\/migrating-within-supabase\/backup-restore/);
});
