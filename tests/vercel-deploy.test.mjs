import test from "node:test";
import assert from "node:assert/strict";

import {
  canonicalRepositoryUrl,
  parseDeploymentArgs,
  validateGitCheckout,
} from "../scripts/vercel-deploy.mjs";

const fixtureSha = "1111111111111111111111111111111111111111";
const remoteSha = "2222222222222222222222222222222222222222";

function mismatchedCleanCheckout() {
  const calls = [];
  const gitCommand = (args) => {
    calls.push(args);
    if (args[0] === "status") return "";
    if (args[0] === "rev-parse") return fixtureSha;
    if (args[0] === "ls-remote") {
      return `${remoteSha}\trefs/heads/master`;
    }
    throw new Error(`Unexpected Git command: ${args.join(" ")}`);
  };
  return { calls, gitCommand };
}

for (const productionArgs of [
  ["--prod"],
  ["--target", "production"],
  ["--target=production"],
]) {
  test(`protects the production selector ${productionArgs.join(" ")}`, () => {
    const parsed = parseDeploymentArgs(productionArgs);
    const fixture = mismatchedCleanCheckout();

    assert.equal(parsed.isProduction, true);
    assert.throws(
      () => validateGitCheckout({ isProduction: parsed.isProduction, gitCommand: fixture.gitCommand }),
      /does not match canonical master/,
    );
    assert.deepEqual(fixture.calls.at(-1), [
      "ls-remote",
      canonicalRepositoryUrl,
      "refs/heads/master",
    ]);
  });
}

test("rejects an alternate Vercel project path", () => {
  assert.throws(
    () => parseDeploymentArgs(["--prod", "../other-project"]),
    /alternate project paths are not supported/,
  );
});

test("rejects a missing production target value", () => {
  assert.throws(
    () => parseDeploymentArgs(["--target", "--prod"]),
    /--target requires a value/,
  );
});

test("rejects a Vercel cwd override", () => {
  assert.throws(
    () => parseDeploymentArgs(["--target=production", "--cwd", "../other-project"]),
    /project directory cannot be overridden/,
  );
  assert.throws(
    () => parseDeploymentArgs(["--cwd=../other-project"]),
    /project directory cannot be overridden/,
  );
});

for (const localConfigArgs of [
  ["--local-config", "/outside/untracked-vercel.json"],
  ["--local-config=/outside/untracked-vercel.json"],
  ["-A", "/outside/untracked-vercel.json"],
  ["-A/outside/untracked-vercel.json"],
]) {
  test(`rejects a local Vercel config override via ${localConfigArgs[0]}`, () => {
    assert.throws(
      () => parseDeploymentArgs(["--prod", ...localConfigArgs]),
      /local Vercel config cannot be overridden/,
    );
  });
}

test("rejects prebuilt artifacts", () => {
  assert.throws(
    () => parseDeploymentArgs(["--prod", "--prebuilt"]),
    /prebuilt artifacts are not provenance-attested/,
  );
});

test("preserves supported option values without treating them as project paths", () => {
  assert.deepEqual(parseDeploymentArgs(["--target", "preview", "--scope", "daniel-labs"]), {
    dryRun: false,
    isProduction: false,
    vercelArgs: ["--target", "preview", "--scope", "daniel-labs"],
  });
});
