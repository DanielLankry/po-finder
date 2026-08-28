import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
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
  *)
    printf '%s\n' "\${MOCK_SENSITIVE_OUTPUT:-}"
    printf '%s\n' "\${MOCK_SENSITIVE_OUTPUT:-}" >&2
    exit 97
    ;;
esac`,
  );
  return { binDir, log, storageEndpoint };
}

function mkdirForTest(path) {
  mkdirSync(path, { recursive: true });
}

function assertSensitiveOutputWithheld(result, sensitiveValue) {
  assert.equal(
    result.stdout.includes(sensitiveValue),
    false,
    "stdout must not expose sensitive output",
  );
  assert.equal(
    result.stderr.includes(sensitiveValue),
    false,
    "stderr must not expose sensitive output",
  );
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
  assert.match(exportScript, /umask 077/);
  assert.match(restoreScript, /umask 077/);
  assert.match(exportScript, /trap cleanup_export_artifacts EXIT/);
  assert.match(restoreScript, /trap cleanup_restore_artifacts EXIT/);
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
  assert.match(exportScript, /validate_database_source_binding/);
  assert.match(exportScript, /validate_storage_source_binding/);
  assert.match(exportScript, /validate_backup_destination_binding/);
  assert.match(exportScript, /Backup destination must not use a Supabase Storage endpoint/);
  assert.match(exportScript, /Uploaded ciphertext hash mismatch/);
  assert.match(exportScript, /rclone cat/);
  assert.match(exportScript, /security-state-after\.jsonl/);
  assert.match(exportScript, /managed-schema\.sql/);
  const remoteHashVerification = exportScript.indexOf("remote_ciphertext_hash=");
  const immutableRunMarker = exportScript.indexOf(
    "$BACKUP_DESTINATION_RCLONE/$run_id/latest-success.json",
  );
  assert.ok(remoteHashVerification >= 0 && immutableRunMarker > remoteHashVerification);
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
  assert.match(
    restoreScript,
    /ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated/,
  );
  assert.match(restoreScript, /managed-schema\.sql/);
  assert.match(restoreScript, /Security-state hash mismatch/);
  assert.match(restoreScript, /Restored policies, RLS, ACLs, or critical routine state/);
  assert.doesNotMatch(restoreScript, /Shift_Database/);
});

test("export rejects database and Storage sources not bound to production before upload", () => {
  const root = mkdtempSync(join(tmpdir(), "po-finder-export-source-binding-"));
  try {
    const binDir = join(root, "bin");
    const log = join(root, "rclone.log");
    mkdirForTest(binDir);
    for (const command of ["age", "jq", "psql", "supabase"]) {
      writeMock(binDir, command, "exit 0");
    }
    writeMock(
      binDir,
      "rclone",
      `printf '%s\n' "$*" >> "$MOCK_RCLONE_LOG"
case "\${1:-}" in
  config) printf '[storage]\ntype = s3\nendpoint = %s\n' "$MOCK_STORAGE_ENDPOINT" ;;
  *) exit 97 ;;
esac`,
    );
    const baseEnvironment = {
      ...process.env,
      PATH: `${binDir}:${process.env.PATH}`,
      AGE_RECIPIENTS: "age1recipient-one,age1recipient-two",
      BACKUP_DESTINATION_RCLONE: "destination:po-finder",
      SUPABASE_STORAGE_RCLONE_SOURCE: "storage:photos",
      MOCK_RCLONE_LOG: log,
      MOCK_STORAGE_ENDPOINT:
        "https://ymqlqdhelsocibhnanjy.storage.supabase.co/storage/v1/s3",
    };

    const wrongDatabase = spawnSync("bash", ["scripts/backup/export-recovery-set.sh"], {
      env: {
        ...baseEnvironment,
        SOURCE_DB_URL: "postgresql://postgres@db.aaaaaaaaaaaaaaaaaaaa.supabase.co:5432/postgres",
      },
      encoding: "utf8",
    });
    assert.equal(wrongDatabase.status, 3, wrongDatabase.stderr);
    assert.match(wrongDatabase.stderr, /does not identify the known production project/);
    assert.equal(existsSync(log), false, "rclone must not run for a mismatched database source");

    const wrongStorage = spawnSync("bash", ["scripts/backup/export-recovery-set.sh"], {
      env: {
        ...baseEnvironment,
        SOURCE_DB_URL:
          "postgresql://postgres@db.ymqlqdhelsocibhnanjy.supabase.co:5432/postgres",
        MOCK_STORAGE_ENDPOINT:
          "https://aaaaaaaaaaaaaaaaaaaa.storage.supabase.co/storage/v1/s3",
      },
      encoding: "utf8",
    });
    assert.equal(wrongStorage.status, 3, wrongStorage.stderr);
    assert.match(wrongStorage.stderr, /Source Storage remote does not identify/);
    const calls = readFileSync(log, "utf8");
    assert.match(calls, /^config redacted storage$/m);
    assert.doesNotMatch(calls, /(^|\n)(copy|copyto|cat|delete) /, "mismatched sources must not upload");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("export rejects the Production Storage backend as its backup destination before remote access", () => {
  const root = mkdtempSync(join(tmpdir(), "po-finder-export-destination-binding-"));
  try {
    const binDir = join(root, "bin");
    const log = join(root, "rclone.log");
    mkdirForTest(binDir);
    for (const command of ["age", "jq", "psql", "supabase"]) {
      writeMock(binDir, command, "exit 0");
    }
    writeMock(
      binDir,
      "rclone",
      `printf '%s\n' "$*" >> "$MOCK_RCLONE_LOG"
case "\${1:-}" in
  config) printf '[production]\ntype = s3\nendpoint = https://ymqlqdhelsocibhnanjy.storage.supabase.co/storage/v1/s3\nsecret_access_key = XXX\n' ;;
  *) exit 97 ;;
esac`,
    );

    const result = spawnSync("bash", ["scripts/backup/export-recovery-set.sh"], {
      env: {
        ...process.env,
        PATH: `${binDir}:${process.env.PATH}`,
        SOURCE_DB_URL:
          "postgresql://postgres@db.ymqlqdhelsocibhnanjy.supabase.co:5432/postgres",
        AGE_RECIPIENTS: "age1recipient-one,age1recipient-two",
        BACKUP_DESTINATION_RCLONE: "production:photos/recovery",
        BACKUP_SKIP_STORAGE: "1",
        MOCK_RCLONE_LOG: log,
      },
      encoding: "utf8",
    });
    assert.equal(result.status, 3, result.stderr);
    assert.match(result.stderr, /must not use a Supabase Storage endpoint/);
    const calls = readFileSync(log, "utf8");
    assert.match(calls, /^config redacted production$/m);
    assert.doesNotMatch(
      calls,
      /(^|\n)(lsf|copy|copyto|cat|delete) /,
      "Production-bound destination must fail before remote access or write",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("export rejects reuse of the production Storage source remote as its destination", () => {
  const root = mkdtempSync(join(tmpdir(), "po-finder-export-shared-remote-"));
  try {
    const binDir = join(root, "bin");
    const log = join(root, "rclone.log");
    mkdirForTest(binDir);
    for (const command of ["age", "jq", "psql", "supabase"]) {
      writeMock(binDir, command, "exit 0");
    }
    writeMock(
      binDir,
      "rclone",
      `printf '%s\n' "$*" >> "$MOCK_RCLONE_LOG"
case "\${1:-}" in
  config) printf '[production]\ntype = s3\nendpoint = https://ymqlqdhelsocibhnanjy.storage.supabase.co/storage/v1/s3\n' ;;
  *) exit 97 ;;
esac`,
    );

    const result = spawnSync("bash", ["scripts/backup/export-recovery-set.sh"], {
      env: {
        ...process.env,
        PATH: `${binDir}:${process.env.PATH}`,
        SOURCE_DB_URL:
          "postgresql://postgres@db.ymqlqdhelsocibhnanjy.supabase.co:5432/postgres",
        AGE_RECIPIENTS: "age1recipient-one,age1recipient-two",
        BACKUP_DESTINATION_RCLONE: "production:recovery",
        SUPABASE_STORAGE_RCLONE_SOURCE: "production:photos",
        MOCK_RCLONE_LOG: log,
      },
      encoding: "utf8",
    });
    assert.equal(result.status, 3, result.stderr);
    assert.match(result.stderr, /must not reuse the production Storage source remote/);
    const calls = readFileSync(log, "utf8");
    assert.equal(
      [...calls.matchAll(/^config redacted production$/gm)].length,
      1,
      "source binding may be inspected, but destination validation must reject before remote access",
    );
    assert.doesNotMatch(calls, /(^|\n)(lsf|copy|copyto|cat|delete) /);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("export rejects proxy and local destination backends before remote access", () => {
  for (const backendType of ["alias", "crypt", "local"]) {
    const root = mkdtempSync(join(tmpdir(), `po-finder-export-${backendType}-destination-`));
    try {
      const binDir = join(root, "bin");
      const log = join(root, "rclone.log");
      mkdirForTest(binDir);
      for (const command of ["age", "jq", "psql", "supabase"]) {
        writeMock(binDir, command, "exit 0");
      }
      writeMock(
        binDir,
        "rclone",
        `printf '%s\n' "$*" >> "$MOCK_RCLONE_LOG"
case "\${1:-}" in
  config) printf '[destination]\ntype = %s\nremote = production:photos\n' "$MOCK_DESTINATION_TYPE" ;;
  *) exit 97 ;;
esac`,
      );

      const result = spawnSync("bash", ["scripts/backup/export-recovery-set.sh"], {
        env: {
          ...process.env,
          PATH: `${binDir}:${process.env.PATH}`,
          SOURCE_DB_URL:
            "postgresql://postgres@db.ymqlqdhelsocibhnanjy.supabase.co:5432/postgres",
          AGE_RECIPIENTS: "age1recipient-one,age1recipient-two",
          BACKUP_DESTINATION_RCLONE: "destination:recovery",
          BACKUP_SKIP_STORAGE: "1",
          MOCK_DESTINATION_TYPE: backendType,
          MOCK_RCLONE_LOG: log,
        },
        encoding: "utf8",
      });
      assert.equal(result.status, 3, `${backendType}: ${result.stderr}`);
      assert.match(result.stderr, /must use an approved off-site object-storage backend/);
      assert.doesNotMatch(readFileSync(log, "utf8"), /(^|\n)(lsf|copy|copyto|cat|delete) /);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
});

test("export withholds source database failure output", () => {
  const root = mkdtempSync(join(tmpdir(), "po-finder-export-psql-redaction-"));
  try {
    const binDir = join(root, "bin");
    const workDir = join(root, "work");
    const sensitiveValue = "customer@example.com row=(private customer context)";
    mkdirForTest(binDir);
    for (const command of ["age", "jq", "supabase"]) {
      writeMock(binDir, command, "exit 0");
    }
    writeMock(
      binDir,
      "psql",
      `printf '%s\n' "$MOCK_SENSITIVE_OUTPUT"
printf '%s\n' "$MOCK_SENSITIVE_OUTPUT" >&2
exit 55`,
    );

    const result = spawnSync("bash", ["scripts/backup/export-recovery-set.sh"], {
      env: {
        ...process.env,
        PATH: `${binDir}:${process.env.PATH}`,
        SOURCE_DB_URL:
          "postgresql://postgres@db.ymqlqdhelsocibhnanjy.supabase.co:5432/postgres",
        AGE_RECIPIENTS: "age1recipient-one,age1recipient-two",
        BACKUP_SKIP_STORAGE: "1",
        BACKUP_SKIP_UPLOAD: "1",
        BACKUP_WORK_DIR: workDir,
        MOCK_SENSITIVE_OUTPUT: sensitiveValue,
      },
      encoding: "utf8",
    });
    assert.equal(result.status, 55, result.stderr);
    assert.match(result.stderr, /Source database command failed; command output withheld/);
    assertSensitiveOutputWithheld(result, sensitiveValue);
    assert.equal(
      readdirSync(workDir).some((entry) => entry.startsWith(".po-finder-export.")),
      false,
      "failed export must remove its private cleartext staging directory",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
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
  assert.doesNotMatch(workflow, /\$\{\{\s*runner\.temp\s*\}\}/);
  assert.match(workflow, /BACKUP_WORK_DIR=\$\{RUNNER_TEMP\}\/po-finder-backup/);
  assert.match(workflow, /RESTORE_WORK_DIR=\$\{RUNNER_TEMP\}\/po-finder-restore/);
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

test("restore rejects rclone Storage endpoint and backend overrides before any rclone access", () => {
  const endpoint = "https://aaaaaaaaaaaaaaaaaaaa.storage.supabase.co/storage/v1/s3";
  for (const [name, value] of [
    ["RCLONE_S3_ENDPOINT", "https://attacker.invalid/storage/v1/s3"],
    ["RCLONE_CONFIG_TARGET_ENDPOINT", "https://attacker.invalid/storage/v1/s3"],
    ["RCLONE_CONFIG_TARGET_TYPE", "local"],
  ]) {
    const root = mkdtempSync(join(tmpdir(), "po-finder-restore-rclone-env-"));
    try {
      const { binDir, log } = setupRestoreMocks(root, endpoint);
      const result = spawnSync("bash", ["scripts/backup/restore-drill.sh"], {
        env: restoreEnvironment(binDir, {
          MOCK_RCLONE_LOG: log,
          MOCK_STORAGE_ENDPOINT: endpoint,
          [name]: value,
        }),
        encoding: "utf8",
      });
      assert.equal(result.status, 11, `${name}: ${result.stderr}`);
      assert.match(result.stderr, new RegExp(name));
      assert.equal(existsSync(log), false, `${name}: rclone must not run before override rejection`);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
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
    const sensitiveValue = "photos/private/customer-upload.jpg";
    const result = spawnSync("bash", ["scripts/backup/restore-drill.sh"], {
      env: restoreEnvironment(binDir, {
        MOCK_RCLONE_LOG: log,
        MOCK_STORAGE_ENDPOINT: endpoint,
        MOCK_SENSITIVE_OUTPUT: sensitiveValue,
      }),
      encoding: "utf8",
    });
    assert.equal(result.status, 97, result.stderr);
    assert.match(result.stderr, /Recovery-set marker download failed; command output withheld/);
    assertSensitiveOutputWithheld(result, sensitiveValue);
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
    for (const name of ["roles.sql", "schema.sql", "data.sql", "managed-schema.sql"]) {
      writeFileSync(join(recoveryDir, "database", name), "");
    }
    const securityState = "public.fixture\nstorage.objects\n";
    writeFileSync(join(recoveryDir, "security-state-after.jsonl"), securityState);
    const securityStateHash = createHash("sha256").update(securityState).digest("hex");
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
      `label=after\nsecurity_state_sha256=${securityStateHash}\n[tables]\n` +
        `public.fixture count=0 sha256=${emptyTableChecksum}\n` +
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
        sourceProjectRef: "ymqlqdhelsocibhnanjy",
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
  .sourceProjectRef) printf 'ymqlqdhelsocibhnanjy\n' ;;
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
  for argument in "$@"; do
    if [[ "$argument" == *.sql ]]; then
      printf '%s %s\n' "$(stat -c '%a' "$argument")" "$(stat -c '%a' "$(dirname "$argument")")" >> "$MOCK_RESTORE_MODE_LOG"
    fi
  done
  if [ -n "\${MOCK_PSQL_FAILURE_OUTPUT:-}" ]; then
    printf '%s\n' "$MOCK_PSQL_FAILURE_OUTPUT"
    printf '%s\n' "$MOCK_PSQL_FAILURE_OUTPUT" >&2
    exit "\${MOCK_PSQL_RESTORE_EXIT:-47}"
  fi
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
  check)
    if [ -n "\${MOCK_STORAGE_CHECK_FAILURE_OUTPUT:-}" ]; then
      printf '%s\n' "$MOCK_STORAGE_CHECK_FAILURE_OUTPUT"
      printf '%s\n' "$MOCK_STORAGE_CHECK_FAILURE_OUTPUT" >&2
    fi
    exit "\${MOCK_STORAGE_CHECK_EXIT:-0}"
    ;;
  *) exit 96 ;;
esac`,
    );

    const endpoint = "https://aaaaaaaaaaaaaaaaaaaa.storage.supabase.co/storage/v1/s3";
    const databaseFailureSecret = "row=(customer@example.com,private address)";
    const databaseFailureLog = join(root, "rclone-database-failure.log");
    const databaseFailureWorkDir = join(root, "work-database-failure");
    const databaseFailure = spawnSync("bash", ["scripts/backup/restore-drill.sh"], {
      env: restoreEnvironment(binDir, {
        RESTORE_WORK_DIR: databaseFailureWorkDir,
        MOCK_ARCHIVE: archive,
        MOCK_MARKER: marker,
        MOCK_RCLONE_LOG: databaseFailureLog,
        MOCK_RESTORE_MODE_LOG: join(root, "restore-database-failure-modes.log"),
        MOCK_SOURCE_MANIFEST: join(recoveryDir, "manifest-after.txt"),
        MOCK_SOURCE_RUN: sourceRun,
        MOCK_STORAGE_ENDPOINT: endpoint,
        MOCK_STORAGE_OBJECT_ROWS: logicalStorageRows,
        MOCK_PSQL_FAILURE_OUTPUT: databaseFailureSecret,
        MOCK_PSQL_RESTORE_EXIT: "47",
      }),
      encoding: "utf8",
    });
    assert.equal(databaseFailure.status, 47, databaseFailure.stderr);
    assert.match(databaseFailure.stderr, /Disposable database restore failed; command output withheld/);
    assertSensitiveOutputWithheld(databaseFailure, databaseFailureSecret);
    assert.doesNotMatch(
      readFileSync(databaseFailureLog, "utf8"),
      /copy .*target:storage --metadata/,
      "Storage must not be written after a failed database restore",
    );
    assert.equal(
      readdirSync(databaseFailureWorkDir).some((entry) => entry.startsWith(".po-finder-restore.")),
      false,
      "failed database restore must remove its private cleartext staging directory",
    );

    const storageFailureSecret = "photos/private/customer-storage-object.jpg";
    const result = spawnSync("bash", ["scripts/backup/restore-drill.sh"], {
      env: restoreEnvironment(binDir, {
        RESTORE_WORK_DIR: workDir,
        MOCK_ARCHIVE: archive,
        MOCK_MARKER: marker,
        MOCK_RCLONE_LOG: log,
        MOCK_RESTORE_MODE_LOG: join(root, "restore-modes.log"),
        MOCK_SOURCE_MANIFEST: join(recoveryDir, "manifest-after.txt"),
        MOCK_SOURCE_RUN: sourceRun,
        MOCK_STORAGE_ENDPOINT: endpoint,
        MOCK_STORAGE_CHECK_EXIT: "44",
        MOCK_STORAGE_CHECK_FAILURE_OUTPUT: storageFailureSecret,
        MOCK_STORAGE_OBJECT_ROWS: logicalStorageRows,
      }),
      encoding: "utf8",
    });
    assert.equal(result.status, 16, result.stderr);
    assert.match(result.stderr, /Disposable target Storage objects do not match/);
    assertSensitiveOutputWithheld(result, storageFailureSecret);
    const calls = readFileSync(log, "utf8");
    assert.match(calls, /size target:storage --json/);
    assert.match(calls, /copy .*target:storage --metadata/);
    assert.doesNotMatch(calls, /copy .*target:storage --immutable/);
    assert.match(calls, /check .*target:storage --download/);
    assert.deepEqual(
      readFileSync(join(root, "restore-modes.log"), "utf8").trim().split("\n"),
      ["600 700", "600 700", "600 700", "600 700"],
    );
    assert.equal(
      readdirSync(workDir).some((entry) => entry.startsWith(".po-finder-restore.")),
      false,
      "failed restore must remove its private cleartext staging directory",
    );

    const successLog = join(root, "rclone-success.log");
    const successWorkDir = join(root, "work-success");
    const success = spawnSync("bash", ["scripts/backup/restore-drill.sh"], {
      env: restoreEnvironment(binDir, {
        RESTORE_WORK_DIR: successWorkDir,
        MOCK_ARCHIVE: archive,
        MOCK_MARKER: marker,
        MOCK_RCLONE_LOG: successLog,
        MOCK_RESTORE_MODE_LOG: join(root, "restore-success-modes.log"),
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
    assert.equal(report.securityStateMatches, true);
    const successCalls = readFileSync(successLog, "utf8");
    assert.match(successCalls, /copy .*target:storage --metadata/);
    assert.match(successCalls, /check .*target:storage --download/);
    assert.equal(
      readdirSync(successWorkDir).some((entry) => entry.startsWith(".po-finder-restore.")),
      false,
      "successful restore must remove its private cleartext staging directory",
    );
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
    const modeLog = join(root, "export-modes.log");
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
: > "$output"
printf '%s %s\n' "$(stat -c '%a' "$output")" "$(stat -c '%a' "$(dirname "$output")")" >> "$MOCK_EXPORT_MODE_LOG"`,
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
  config) printf '[destination]\\ntype = b2\\naccount = XXX\\nkey = XXX\\n' ;;
  listremotes) printf 'destination:\\n' ;;
  lsf|copyto) exit 0 ;;
  cat)
    if [ "\${MOCK_CORRUPT_REMOTE:-0}" = "1" ]; then
      printf 'corrupted remote ciphertext'
    else
      cat "$MOCK_ENCRYPTED_FILE"
    fi
    ;;
  delete)
    printf '%s\n' "\${MOCK_RCLONE_FAILURE_OUTPUT:-}"
    printf '%s\n' "\${MOCK_RCLONE_FAILURE_OUTPUT:-}" >&2
    exit 42
    ;;
  *) exit 98 ;;
esac`,
    );

    const runId = "20260828T030000Z";
    const retentionFailureSecret = "photos/private/retention-customer-object.jpg";
    const result = spawnSync("bash", ["scripts/backup/export-recovery-set.sh"], {
      env: {
        ...process.env,
        PATH: `${binDir}:${process.env.PATH}`,
        SOURCE_DB_URL:
          "postgresql://postgres@db.ymqlqdhelsocibhnanjy.supabase.co:5432/postgres",
        AGE_RECIPIENTS: "age1recipient-one,age1recipient-two",
        BACKUP_DESTINATION_RCLONE: "destination:po-finder",
        BACKUP_SKIP_STORAGE: "1",
        BACKUP_WORK_DIR: workDir,
        BACKUP_RUN_ID: runId,
        MOCK_RCLONE_LOG: log,
        MOCK_EXPORT_MODE_LOG: modeLog,
        MOCK_ENCRYPTED_FILE: join(workDir, `po-finder-recovery-${runId}.tar.gz.age`),
        MOCK_RCLONE_FAILURE_OUTPUT: retentionFailureSecret,
      },
      encoding: "utf8",
    });
    assert.equal(result.status, 42, result.stderr);
    assert.match(result.stderr, /Encrypted recovery-set retention failed; command output withheld/);
    assertSensitiveOutputWithheld(result, retentionFailureSecret);
    const calls = readFileSync(log, "utf8");
    assert.match(calls, /delete destination:po-finder/);
    assert.doesNotMatch(
      calls,
      /copyto .* destination:po-finder\/latest-success\.json(?:\n|$)/,
      "global success marker must be the final remote operation",
    );
    assert.deepEqual(readFileSync(modeLog, "utf8").trim().split("\n"), [
      "600 700",
      "600 700",
      "600 700",
    ]);
    assert.equal(
      readdirSync(workDir).some((entry) => entry.startsWith(".po-finder-export.")),
      false,
      "failed export must remove its private cleartext staging directory",
    );

    const corruptWorkDir = join(root, "work-corrupt");
    const corruptLog = join(root, "rclone-corrupt.log");
    const corruptRunId = "20260828T030100Z";
    const corrupted = spawnSync("bash", ["scripts/backup/export-recovery-set.sh"], {
      env: {
        ...process.env,
        PATH: `${binDir}:${process.env.PATH}`,
        SOURCE_DB_URL:
          "postgresql://postgres@db.ymqlqdhelsocibhnanjy.supabase.co:5432/postgres",
        AGE_RECIPIENTS: "age1recipient-one,age1recipient-two",
        BACKUP_DESTINATION_RCLONE: "destination:po-finder",
        BACKUP_SKIP_STORAGE: "1",
        BACKUP_WORK_DIR: corruptWorkDir,
        BACKUP_RUN_ID: corruptRunId,
        MOCK_RCLONE_LOG: corruptLog,
        MOCK_EXPORT_MODE_LOG: modeLog,
        MOCK_ENCRYPTED_FILE: join(
          corruptWorkDir,
          `po-finder-recovery-${corruptRunId}.tar.gz.age`,
        ),
        MOCK_CORRUPT_REMOTE: "1",
      },
      encoding: "utf8",
    });
    assert.equal(corrupted.status, 4, corrupted.stderr);
    assert.match(corrupted.stderr, /Uploaded ciphertext hash mismatch/);
    const corruptCalls = readFileSync(corruptLog, "utf8");
    assert.match(corruptCalls, /cat destination:po-finder/);
    assert.doesNotMatch(corruptCalls, /latest-success\.json/);
    assert.doesNotMatch(corruptCalls, /(^|\n)delete /);
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

test("marker monitor rejects a success timestamp in the future", () => {
  const root = mkdtempSync(join(tmpdir(), "po-finder-marker-future-"));
  try {
    const binDir = join(root, "bin");
    const workDir = join(root, "work");
    mkdirForTest(binDir);
    writeMock(
      binDir,
      "rclone",
      `case "\${1:-}" in
  listremotes) printf 'destination:\n' ;;
  lsf) exit 0 ;;
  copyto) printf '{"completedAtUtc":"2999-01-01T00:00:00Z"}\n' > "$3" ;;
  *) exit 98 ;;
esac`,
    );
    const result = spawnSync("bash", ["scripts/backup/check-latest-success.sh"], {
      env: {
        ...process.env,
        PATH: `${binDir}:${process.env.PATH}`,
        BACKUP_DESTINATION_RCLONE: "destination:po-finder",
        BACKUP_WORK_DIR: workDir,
      },
      encoding: "utf8",
    });
    assert.equal(result.status, 22, result.stderr);
    assert.match(result.stderr, /dated in the future/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("marker monitor withholds rclone failure output", () => {
  const root = mkdtempSync(join(tmpdir(), "po-finder-marker-rclone-redaction-"));
  try {
    const binDir = join(root, "bin");
    const workDir = join(root, "work");
    const sensitiveValue = "photos/private/customer-marker-object.jpg";
    mkdirForTest(binDir);
    writeMock(
      binDir,
      "rclone",
      `case "\${1:-}" in
  listremotes) printf 'destination:\n' ;;
  lsf) exit 0 ;;
  copyto)
    printf '%s\n' "$MOCK_SENSITIVE_OUTPUT"
    printf '%s\n' "$MOCK_SENSITIVE_OUTPUT" >&2
    exit 51
    ;;
  *) exit 98 ;;
esac`,
    );
    const result = spawnSync("bash", ["scripts/backup/check-latest-success.sh"], {
      env: {
        ...process.env,
        PATH: `${binDir}:${process.env.PATH}`,
        BACKUP_DESTINATION_RCLONE: "destination:po-finder",
        BACKUP_WORK_DIR: workDir,
        MOCK_SENSITIVE_OUTPUT: sensitiveValue,
      },
      encoding: "utf8",
    });
    assert.equal(result.status, 51, result.stderr);
    assert.match(result.stderr, /Latest recovery-set marker download failed; command output withheld/);
    assertSensitiveOutputWithheld(result, sensitiveValue);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
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
