import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const migrationsDir = join(root, "supabase/migrations");
const history = JSON.parse(
  readFileSync(join(root, "supabase/migration-history.json"), "utf8"),
);

function migrationFilename(migration) {
  return `${migration.version}_${migration.name}.sql`;
}

function normalizedSha256(contents) {
  const normalized = contents
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .trimEnd();
  return createHash("sha256").update(normalized).digest("hex");
}

function gitBlobSha(contents) {
  const header = Buffer.from(`blob ${contents.length}\0`);
  return createHash("sha1").update(Buffer.concat([header, contents])).digest("hex");
}

test("active migrations are exactly the 20 production ledger versions", () => {
  const activeFiles = readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  const ledgerFiles = history.migrations.map(migrationFilename).sort();

  assert.equal(history.productionLedger.migrationCount, 20);
  assert.equal(history.migrations.length, 20);
  assert.deepEqual(activeFiles, ledgerFiles);
});

test("all production ledger files match their normalized statement hashes", () => {
  for (const migration of history.migrations) {
    const contents = readFileSync(join(migrationsDir, migrationFilename(migration)), "utf8");
    assert.equal(
      normalizedSha256(contents),
      migration.normalizedSha256,
      migrationFilename(migration),
    );
  }
});

test("all 34 exact-master baseline files have an auditable disposition", () => {
  const tree = execFileSync(
    "git",
    ["ls-tree", "-r", history.baseline.commit, "--", "supabase/migrations"],
    { cwd: root, encoding: "utf8" },
  ).trim().split("\n");
  const baseline = new Map(
    tree.map((line) => {
      const match = line.match(/^\d+ blob ([0-9a-f]{40})\t(.+)$/);
      assert.ok(match, line);
      return [match[2], match[1]];
    }),
  );

  assert.equal(history.baseline.migrationFileCount, 34);
  assert.equal(history.localSources.length, 34);
  assert.equal(baseline.size, 34);
  assert.equal(history.localSources.filter(({ disposition }) => disposition === "mapped").length, 13);
  assert.equal(history.localSources.filter(({ disposition }) => disposition === "pre_ledger").length, 21);

  const remoteVersions = new Set(history.migrations.map(({ version }) => version));
  for (const source of history.localSources) {
    assert.equal(baseline.get(source.path), source.blobSha, source.path);
    assert.match(source.disposition, /^(mapped|pre_ledger)$/);
    if (source.disposition === "mapped") {
      assert.ok(remoteVersions.has(source.remoteVersion), source.path);
    } else {
      assert.equal(source.remoteVersion, undefined, source.path);
    }
  }
});

test("PR 7 source migrations remain byte-for-byte identical to their blobs", () => {
  const sourcedMigrations = history.migrations.filter(({ sourceBlob }) => sourceBlob);
  assert.deepEqual(sourcedMigrations.map(({ version }) => version), [
    "20260716091547",
    "20260716091648",
    "20260811100008",
  ]);

  for (const migration of sourcedMigrations) {
    const contents = readFileSync(join(migrationsDir, migrationFilename(migration)));
    assert.equal(gitBlobSha(contents), migration.sourceBlob, migrationFilename(migration));
  }
});
