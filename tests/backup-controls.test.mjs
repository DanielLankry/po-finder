import assert from "node:assert/strict";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const exportScript = readFileSync("scripts/backup/export-recovery-set.sh", "utf8");
const restoreScript = readFileSync("scripts/backup/restore-drill.sh", "utf8");
const markerCheckScript = readFileSync("scripts/backup/check-latest-success.sh", "utf8");
const workflow = readFileSync(".github/workflows/backup-recovery.yml", "utf8");
const runbook = readFileSync("docs/operations/backup-recovery.md", "utf8");

function writeMock(binDir, name, body) {
  const path = join(binDir, name);
  writeFileSync(path, `#!/usr/bin/env bash\nset -euo pipefail\n${body}\n`);
  chmodSync(path, 0o755);
}

function restoreEnvironment(binDir, overrides = {}) {
  return {
    ...process.env,
    PATH: `${binDir}:${process.env.PATH}`,
    TARGET_DB_URL: "postgresql://postgres@db.aaaaaaaaaaaaaaaaaaaa.supabase.co:5432/postgres",
    APPROVED_DISPOSABLE_TARGET_REF: "aaaaaaaaaaaaaaaaaaaa",
    CONFIGURED_DISPOSABLE_TARGET_REF: "aaaaaaaaaaaaaaaaaaaa",
    CONFIRM_DISPOSABLE_RESTORE: "RESTORE:aaaaaaaaaaaaaaaaaaaa",
    AGE_IDENTITY_FILE: join(binDir, "identity.txt"),
    RESTORE_SOURCE_RCLONE: "source:backups",
    TARGET_STORAGE_RCLONE_DESTINATION: "target:storage",
    ...overrides,
  };
}

function setupRestoreMocks(root, storageEndpoint = "https://wrongwrongwrongwrongwr.storage.supabase.co/storage/v1/s3") {
  const binDir = join(root, "bin");
  const log = join(root, "rclone.log");
  mkdirForTest(binDir);
  for (const command of ["age", "jq", "psql"]) {
    writeMock(binDir, command, "exit 0");
  }
  writeMock(
    binDir,
    "rclone",
    `printf '%s\\n' "$*" >> "$MOCK_RCLONE_LOG"
case "\${1:-}" in
  listremotes) printf 'source:\\ntarget:\\n' ;;
  lsf) exit 0 ;;
  config) printf '[target]\\ntype = s3\\nendpoint = %s\\nsecret_access_key = XXX\\n' "$MOCK_STORAGE_ENDPOINT" ;;
  *) exit 97 ;;
esac`,
  );
  return { binDir, log, storageEndpoint };
}

function mkdirForTest(path) {
  mkdirSync(path, { recursive: true });
}

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
  const globalMarkerPublish = exportScript.lastIndexOf("$BACKUP_DESTINATION_RCLONE/latest-success.json");
  assert.ok(globalMarkerPublish > exportScript.lastIndexOf("rclone delete"));
  assert.ok(globalMarkerPublish > exportScript.lastIndexOf('rm -rf "$set_dir" "$archive"'));
});

test("restore drill refuses production and requires disposable confirmation", () => {
  assert.match(restoreScript, /ymqlqdhelsocibhnanjy/);
  assert.match(restoreScript, /pokarov\.co\.il/);
  assert.match(restoreScript, /CONFIGURED_DISPOSABLE_TARGET_REF/);
  assert.match(restoreScript, /CONFIRM_DISPOSABLE_RESTORE must exactly equal/);
  assert.match(restoreScript, /validate_database_target_binding/);
  assert.match(restoreScript, /validate_storage_target_binding/);
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
  assert.match(workflow, /PO_FINDER_BACKUP_RCLONE_CONFIG/);
  assert.match(workflow, /aa2804e08f48250e71009c727124b6341cd0288465804a9a09d14663cabafbaa/);
  assert.match(workflow, /concurrency:/);
  assert.doesNotMatch(workflow, /pull_request/);
  assert.doesNotMatch(workflow, /PO_FINDER_PRODUCTION_DB_URL/);
});

test("restore rejects an aliased database before any rclone access or write", () => {
  const root = mkdtempSync(join(tmpdir(), "po-finder-restore-db-binding-"));
  try {
    const { binDir, log, storageEndpoint } = setupRestoreMocks(root);
    const result = spawnSync("bash", ["scripts/backup/restore-drill.sh"], {
      env: restoreEnvironment(binDir, {
        TARGET_DB_URL: "postgresql://postgres@production-db.internal:5432/postgres",
        MOCK_RCLONE_LOG: log,
        MOCK_STORAGE_ENDPOINT: storageEndpoint,
      }),
      encoding: "utf8",
    });
    assert.equal(result.status, 11, result.stderr);
    assert.match(result.stderr, /does not identify the approved Supabase project/);
    assert.equal(existsSync(log), false, "rclone must not run for an unbound database target");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("restore rejects a Storage endpoint not bound to the approved project before download or write", () => {
  const root = mkdtempSync(join(tmpdir(), "po-finder-restore-storage-binding-"));
  try {
    const { binDir, log, storageEndpoint } = setupRestoreMocks(root);
    const result = spawnSync("bash", ["scripts/backup/restore-drill.sh"], {
      env: restoreEnvironment(binDir, {
        MOCK_RCLONE_LOG: log,
        MOCK_STORAGE_ENDPOINT: storageEndpoint,
      }),
      encoding: "utf8",
    });
    assert.equal(result.status, 11, result.stderr);
    assert.match(result.stderr, /Target Storage remote does not identify/);
    const calls = readFileSync(log, "utf8");
    assert.doesNotMatch(calls, /(^|\n)copy(to)? /, "no recovery set or Storage object may be copied");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("restore accepts matching database and Storage identities before downloading the recovery set", () => {
  const root = mkdtempSync(join(tmpdir(), "po-finder-restore-bound-target-"));
  try {
    const endpoint = "https://aaaaaaaaaaaaaaaaaaaa.storage.supabase.co/storage/v1/s3";
    const { binDir, log } = setupRestoreMocks(root, endpoint);
    const result = spawnSync("bash", ["scripts/backup/restore-drill.sh"], {
      env: restoreEnvironment(binDir, {
        MOCK_RCLONE_LOG: log,
        MOCK_STORAGE_ENDPOINT: endpoint,
      }),
      encoding: "utf8",
    });
    assert.equal(result.status, 97, result.stderr);
    assert.match(readFileSync(log, "utf8"), /copyto source:backups\/latest-success\.json/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("failed remote retention cannot publish the global latest-success marker", () => {
  const root = mkdtempSync(join(tmpdir(), "po-finder-export-marker-order-"));
  try {
    const binDir = join(root, "bin");
    const workDir = join(root, "work");
    const log = join(root, "rclone.log");
    mkdirForTest(binDir);
    writeMock(binDir, "psql", "exit 0");
    writeMock(binDir, "jq", "exit 0");
    writeMock(
      binDir,
      "supabase",
      `if [ "\${1:-}" = "--version" ]; then
  echo '2.83.4'
  exit 0
fi
output=''
while [ "$#" -gt 0 ]; do
  if [ "$1" = '-f' ]; then
    shift
    output="$1"
  fi
  shift || true
done
mkdir -p "$(dirname "$output")"
: > "$output"`,
    );
    writeMock(
      binDir,
      "age",
      `output=''
input=''
while [ "$#" -gt 0 ]; do
  case "$1" in
    -o) shift; output="$1" ;;
    -r) shift ;;
    *) input="$1" ;;
  esac
  shift || true
done
cp "$input" "$output"`,
    );
    writeMock(
      binDir,
      "rclone",
      `printf '%s\\n' "$*" >> "$MOCK_RCLONE_LOG"
case "\${1:-}" in
  listremotes) printf 'destination:\\n' ;;
  lsf|copyto) exit 0 ;;
  lsl) printf '%s recovery.age\\n' "$(wc -c < "$MOCK_ENCRYPTED_FILE" | tr -d ' ')" ;;
  delete) exit 42 ;;
  *) exit 98 ;;
esac`,
    );

    const runId = "20260828T030000Z";
    const result = spawnSync("bash", ["scripts/backup/export-recovery-set.sh"], {
      env: {
        ...process.env,
        PATH: `${binDir}:${process.env.PATH}`,
        SOURCE_DB_URL: "postgresql://read-only@source.invalid:5432/postgres",
        AGE_RECIPIENTS: "age1recipient-one,age1recipient-two",
        BACKUP_DESTINATION_RCLONE: "destination:po-finder",
        BACKUP_SKIP_STORAGE: "1",
        BACKUP_WORK_DIR: workDir,
        BACKUP_RUN_ID: runId,
        MOCK_RCLONE_LOG: log,
        MOCK_ENCRYPTED_FILE: join(workDir, `po-finder-recovery-${runId}.tar.gz.age`),
      },
      encoding: "utf8",
    });
    assert.equal(result.status, 42, result.stderr);
    const calls = readFileSync(log, "utf8");
    assert.match(calls, /delete destination:po-finder/);
    assert.doesNotMatch(
      calls,
      /copyto .* destination:po-finder\/latest-success\.json(?:\n|$)/,
      "global success marker must be the final remote operation",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("export and monitor cron expressions are disjoint", () => {
  const crons = [...workflow.matchAll(/- cron: "([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(crons, ["15 23 * * *", "15 0 * * *", "45 5,11,17 * * *"]);
  assert.equal(new Set(crons).size, crons.length);
  assert.match(workflow, /github\.event\.schedule == '45 5,11,17 \* \* \*'/);
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
