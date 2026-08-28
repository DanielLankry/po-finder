import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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
  for (const command of ["age", "psql"]) {
    writeMock(binDir, command, "exit 0");
  }
  writeMock(
    binDir,
    "jq",
    `case "\${2:-}" in
  .count) printf '%s\n' "\${MOCK_STORAGE_OBJECT_COUNT:-0}" ;;
  *) exit 0 ;;
esac`,
  );
  writeMock(
    binDir,
    "rclone",
    `printf '%s\\n' "$*" >> "$MOCK_RCLONE_LOG"
case "\${1:-}" in
  listremotes) printf 'source:\\ntarget:\\n' ;;
  lsf) exit 0 ;;
  size) printf '{"count":%s,"bytes":0}\n' "\${MOCK_STORAGE_OBJECT_COUNT:-0}" ;;
  config) printf '[target]\\ntype = %s\\nendpoint = %s\\nsecret_access_key = XXX\\n' "\${MOCK_STORAGE_TYPE:-s3}" "$MOCK_STORAGE_ENDPOINT" ;;
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
  assert.match(exportScript, /-x "storage\.objects"/);
  assert.match(exportScript, /json_build_object\('bucket_id', bucket_id, 'name', name\)/);
  assert.match(restoreScript, /json_build_object\('bucket_id', bucket_id, 'name', name\)/);
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
  assert.match(restoreScript, /verify_storage_manifest/);
  assert.match(restoreScript, /rclone check/);
  assert.match(restoreScript, /--download/);
  assert.match(restoreScript, /allowed only for a zero-object recovery set/);
  assert.doesNotMatch(restoreScript, /Shift_Database/);
});

test("workflow uses protected environment, pinned actions, and no production restore trigger", () => {
  assert.match(workflow, /environment: backup-recovery/);
  assert.match(workflow, /actions\/checkout@[0-9a-f]{40}/);
  assert.match(workflow, /node_modules\/\.bin/);
  assert.match(workflow, /workflow_dispatch/);
  assert.match(workflow, /schedule:/);
  assert.doesNotMatch(workflow, /TZ=Asia\/Jerusalem/);
  assert.doesNotMatch(workflow, /schedule_gate/);
  assert.match(workflow, /Check latest success marker freshness/);
  assert.match(workflow, /PO_FINDER_RESTORE_AGE_IDENTITY/);
  assert.match(workflow, /PO_FINDER_BACKUP_RCLONE_CONFIG/);
  assert.match(workflow, /aa2804e08f48250e71009c727124b6341cd0288465804a9a09d14663cabafbaa/);
  assert.match(workflow, /concurrency:/);
  assert.doesNotMatch(workflow, /pull_request/);
  assert.doesNotMatch(workflow, /PO_FINDER_PRODUCTION_DB_URL/);
  const identityStep = workflow.indexOf("- name: Write restore identity");
  const identityUmask = workflow.indexOf("umask 077", identityStep);
  const identityWrite = workflow.indexOf('printf \'%s\\n\' "$PO_FINDER_RESTORE_AGE_IDENTITY"', identityStep);
  assert.ok(identityStep >= 0 && identityUmask > identityStep && identityUmask < identityWrite);
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

test("restore rejects libpq hostaddr overrides before any rclone access or write", () => {
  const root = mkdtempSync(join(tmpdir(), "po-finder-restore-hostaddr-binding-"));
  try {
    const { binDir, log, storageEndpoint } = setupRestoreMocks(root);
    const result = spawnSync("bash", ["scripts/backup/restore-drill.sh"], {
      env: restoreEnvironment(binDir, {
        TARGET_DB_URL:
          "postgresql://postgres@db.aaaaaaaaaaaaaaaaaaaa.supabase.co:5432/postgres?hostaddr=127.0.0.1&sslmode=disable",
        MOCK_RCLONE_LOG: log,
        MOCK_STORAGE_ENDPOINT: storageEndpoint,
      }),
      encoding: "utf8",
    });
    assert.equal(result.status, 11, result.stderr);
    assert.match(result.stderr, /unsupported connection parameter/);
    assert.equal(existsSync(log), false, "rclone must not run for a hostaddr-overridden target");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("restore rejects inherited libpq target overrides before any rclone access or write", () => {
  const root = mkdtempSync(join(tmpdir(), "po-finder-restore-libpq-env-binding-"));
  try {
    const endpoint = "https://aaaaaaaaaaaaaaaaaaaa.storage.supabase.co/storage/v1/s3";
    const { binDir, log } = setupRestoreMocks(root, endpoint);
    const result = spawnSync("bash", ["scripts/backup/restore-drill.sh"], {
      env: restoreEnvironment(binDir, {
        PGHOSTADDR: "127.0.0.1",
        MOCK_RCLONE_LOG: log,
        MOCK_STORAGE_ENDPOINT: endpoint,
      }),
      encoding: "utf8",
    });
    assert.equal(result.status, 11, result.stderr);
    assert.match(result.stderr, /Refusing inherited libpq target override: PGHOSTADDR/);
    assert.equal(existsSync(log), false, "rclone must not run for an inherited libpq target override");
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

test("restore rejects non-S3 Storage remotes with misleading approved endpoints", () => {
  for (const storageType of ["alias", "local"]) {
    const root = mkdtempSync(join(tmpdir(), `po-finder-restore-${storageType}-binding-`));
    try {
      const endpoint = "https://aaaaaaaaaaaaaaaaaaaa.storage.supabase.co/storage/v1/s3";
      const { binDir, log } = setupRestoreMocks(root, endpoint);
      const result = spawnSync("bash", ["scripts/backup/restore-drill.sh"], {
        env: restoreEnvironment(binDir, {
          MOCK_RCLONE_LOG: log,
          MOCK_STORAGE_ENDPOINT: endpoint,
          MOCK_STORAGE_TYPE: storageType,
        }),
        encoding: "utf8",
      });
      assert.equal(result.status, 11, `${storageType}: ${result.stderr}`);
      assert.match(result.stderr, /must use the rclone s3 backend/);
      const calls = readFileSync(log, "utf8");
      assert.doesNotMatch(calls, /(^|\n)copy(to)? /, "no recovery set or Storage object may be copied");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
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

test("restore rejects a non-empty disposable Storage target before downloading the recovery set", () => {
  const root = mkdtempSync(join(tmpdir(), "po-finder-restore-nonempty-storage-"));
  try {
    const endpoint = "https://aaaaaaaaaaaaaaaaaaaa.storage.supabase.co/storage/v1/s3";
    const { binDir, log } = setupRestoreMocks(root, endpoint);
    const result = spawnSync("bash", ["scripts/backup/restore-drill.sh"], {
      env: restoreEnvironment(binDir, {
        MOCK_RCLONE_LOG: log,
        MOCK_STORAGE_ENDPOINT: endpoint,
        MOCK_STORAGE_OBJECT_COUNT: "1",
      }),
      encoding: "utf8",
    });
    assert.equal(result.status, 11, result.stderr);
    assert.match(result.stderr, /Storage must be empty/);
    const calls = readFileSync(log, "utf8");
    assert.doesNotMatch(calls, /(^|\n)copy(to)? /, "no recovery set or Storage object may be copied");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("non-empty Storage restore succeeds only when the disposable target matches", () => {
  const root = mkdtempSync(join(tmpdir(), "po-finder-restore-storage-completeness-"));
  try {
    const binDir = join(root, "bin");
    const fixtureRoot = join(root, "fixture");
    const sourceRun = "20260828T031500Z";
    const recoveryDir = join(fixtureRoot, `po-finder-recovery-${sourceRun}`);
    const storageDir = join(recoveryDir, "storage");
    const archive = join(root, "po-finder-recovery.tar.gz.age");
    const marker = join(root, "latest-success.json");
    const workDir = join(root, "work");
    const log = join(root, "rclone.log");
    mkdirForTest(binDir);
    mkdirForTest(join(recoveryDir, "database"));
    mkdirForTest(storageDir);
    const objectNames = ["five", "four", "one", "seven", "six", "three", "two"];
    for (const name of objectNames) {
      writeFileSync(join(storageDir, `${name}.txt`), name);
    }
    for (const name of ["roles.sql", "schema.sql", "data.sql"]) {
      writeFileSync(join(recoveryDir, "database", name), "");
    }
    const emptyTableChecksum = createHash("sha256").update("").digest("hex");
    const logicalStorageRows = objectNames
      .map((name) => JSON.stringify({ bucket_id: "photos", name: `${name}.txt` }))
      .sort()
      .join("\n");
    const logicalStorageChecksum = createHash("sha256")
      .update(`${logicalStorageRows}\n`)
      .digest("hex");
    writeFileSync(
      join(recoveryDir, "manifest-after.txt"),
      `label=after\n[tables]\npublic.fixture count=0 sha256=${emptyTableChecksum}\n` +
        `storage.objects count=7 sha256=${logicalStorageChecksum}\n`,
    );
    const storageEntries = objectNames.map((name) => {
      const contents = readFileSync(join(storageDir, `${name}.txt`));
      return `${createHash("sha256").update(contents).digest("hex")}  ./${name}.txt`;
    });
    writeFileSync(
      join(recoveryDir, "storage-manifest.txt"),
      `${storageEntries.join("\n")}\nobject_count=7\ntotal_bytes=27\n`,
    );
    const tarResult = spawnSync(
      "tar",
      ["-C", fixtureRoot, "-czf", archive, `po-finder-recovery-${sourceRun}`],
      { encoding: "utf8" },
    );
    assert.equal(tarResult.status, 0, tarResult.stderr);
    const sourceManifest = readFileSync(join(recoveryDir, "manifest-after.txt"));
    const encrypted = readFileSync(archive);
    writeFileSync(
      marker,
      JSON.stringify({
        runId: sourceRun,
        ciphertextSha256: createHash("sha256").update(encrypted).digest("hex"),
        manifestSha256: createHash("sha256").update(sourceManifest).digest("hex"),
      }),
    );

    writeMock(
      binDir,
      "age",
      `output=''
input=''
while [ "$#" -gt 0 ]; do
  case "$1" in
    -o) shift; output="$1" ;;
    -i) shift ;;
    -d) ;;
    *) input="$1" ;;
  esac
  shift || true
done
cp "$input" "$output"`,
    );
    writeMock(
      binDir,
      "jq",
      `case "\${2:-}" in
  .runId) printf '%s\n' "$MOCK_SOURCE_RUN" ;;
  .ciphertextSha256) sha256sum "$MOCK_ARCHIVE" | awk '{print $1}' ;;
  .manifestSha256) sha256sum "$MOCK_SOURCE_MANIFEST" | awk '{print $1}' ;;
  .count) printf '0\n' ;;
  .) cat ;;
  *) exit 98 ;;
esac`,
    );
    writeMock(
      binDir,
      "psql",
      `if [[ "$*" == *--single-transaction* ]]; then
  exit 0
fi
if [[ "$*" == *"select count(*)"* ]]; then
  if [[ "$*" == *storage*objects* ]]; then printf '7\n'; else printf '0\n'; fi
  exit 0
fi
if [[ "$*" == *json_build_object* ]]; then
  printf '%s\n' "$MOCK_STORAGE_OBJECT_ROWS"
  exit 0
fi
if [[ "$*" == *"copy (select row_to_json"* ]]; then
  exit 0
fi
printf 'public.fixture\nstorage.objects\n'`,
    );
    writeMock(
      binDir,
      "rclone",
      `printf '%s\n' "$*" >> "$MOCK_RCLONE_LOG"
case "\${1:-}" in
  listremotes) printf 'source:\ntarget:\n' ;;
  lsf) exit 0 ;;
  size) printf '{"count":0,"bytes":0}\n' ;;
  config) printf '[target]\ntype = s3\nendpoint = %s\n' "$MOCK_STORAGE_ENDPOINT" ;;
  copyto)
    case "$2" in
      *latest-success.json) cp "$MOCK_MARKER" "$3" ;;
      *po-finder-recovery.tar.gz.age) cp "$MOCK_ARCHIVE" "$3" ;;
      *) exit 97 ;;
    esac
    ;;
  copy) exit 0 ;;
  check) exit "\${MOCK_STORAGE_CHECK_EXIT:-0}" ;;
  *) exit 96 ;;
esac`,
    );

    const endpoint = "https://aaaaaaaaaaaaaaaaaaaa.storage.supabase.co/storage/v1/s3";
    const result = spawnSync("bash", ["scripts/backup/restore-drill.sh"], {
      env: restoreEnvironment(binDir, {
        RESTORE_WORK_DIR: workDir,
        MOCK_ARCHIVE: archive,
        MOCK_MARKER: marker,
        MOCK_RCLONE_LOG: log,
        MOCK_SOURCE_MANIFEST: join(recoveryDir, "manifest-after.txt"),
        MOCK_SOURCE_RUN: sourceRun,
        MOCK_STORAGE_ENDPOINT: endpoint,
        MOCK_STORAGE_CHECK_EXIT: "44",
        MOCK_STORAGE_OBJECT_ROWS: logicalStorageRows,
      }),
      encoding: "utf8",
    });
    assert.equal(result.status, 16, result.stderr);
    assert.match(result.stderr, /Disposable target Storage objects do not match/);
    const calls = readFileSync(log, "utf8");
    assert.match(calls, /size target:storage --json/);
    assert.match(calls, /copy .*target:storage --metadata/);
    assert.doesNotMatch(calls, /copy .*target:storage --immutable/);
    assert.match(calls, /check .*target:storage --download/);

    const successLog = join(root, "rclone-success.log");
    const successWorkDir = join(root, "work-success");
    const success = spawnSync("bash", ["scripts/backup/restore-drill.sh"], {
      env: restoreEnvironment(binDir, {
        RESTORE_WORK_DIR: successWorkDir,
        MOCK_ARCHIVE: archive,
        MOCK_MARKER: marker,
        MOCK_RCLONE_LOG: successLog,
        MOCK_SOURCE_MANIFEST: join(recoveryDir, "manifest-after.txt"),
        MOCK_SOURCE_RUN: sourceRun,
        MOCK_STORAGE_ENDPOINT: endpoint,
        MOCK_STORAGE_CHECK_EXIT: "0",
        MOCK_STORAGE_OBJECT_ROWS: logicalStorageRows,
      }),
      encoding: "utf8",
    });
    assert.equal(success.status, 0, success.stderr);
    const reportPath = success.stdout.trim();
    assert.equal(existsSync(reportPath), true, "successful non-empty restore must emit a report");
    const report = JSON.parse(readFileSync(reportPath, "utf8"));
    assert.equal(report.storageObjectCount, 7);
    assert.equal(report.storageObjectsMatch, true);
    const successCalls = readFileSync(successLog, "utf8");
    assert.match(successCalls, /copy .*target:storage --metadata/);
    assert.match(successCalls, /check .*target:storage --download/);
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
  assert.deepEqual(crons, ["15 0 * * *", "45 5,11,17 * * *"]);
  assert.equal(new Set(crons).size, crons.length);
  assert.match(workflow, /github\.event\.schedule == '15 0 \* \* \*'/);
  assert.match(workflow, /github\.event\.schedule == '45 5,11,17 \* \* \*'/);
});

test("fixed UTC export schedule stays at 24-hour intervals across Israel spring-forward", () => {
  const scheduledRuns = [
    new Date("2027-03-25T00:15:00Z"),
    new Date("2027-03-26T00:15:00Z"),
    new Date("2027-03-27T00:15:00Z"),
  ];
  assert.equal(scheduledRuns[1].getTime() - scheduledRuns[0].getTime(), 24 * 60 * 60 * 1000);
  assert.equal(scheduledRuns[2].getTime() - scheduledRuns[1].getTime(), 24 * 60 * 60 * 1000);

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jerusalem",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  assert.deepEqual(scheduledRuns.map((run) => formatter.format(run)), ["02:15", "03:15", "03:15"]);
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
  assert.match(runbook, /Daniel approval is not recorded/);
  assert.doesNotMatch(runbook, /recorded by Atlas from Daniel approval/);
  assert.match(runbook, /https:\/\/supabase.com\/docs\/guides\/platform\/backups/);
  assert.match(runbook, /https:\/\/supabase.com\/docs\/guides\/platform\/migrating-within-supabase\/backup-restore/);
});
