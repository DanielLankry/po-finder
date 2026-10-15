import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const canonicalRepositoryUrl = "https://github.com/DanielLankry/po-finder.git";

const shaPattern = /^[0-9a-f]{40}$/;
const projectDirectory = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const optionsWithSeparateValues = new Set([
  "--archive",
  "--build-env",
  "-b",
  "--env",
  "-e",
  "--format",
  "-F",
  "--global-config",
  "-Q",
  "--local-config",
  "-A",
  "--meta",
  "-m",
  "--regions",
  "--scope",
  "-S",
  "--token",
  "-t",
]);

function git(args, cwd = projectDirectory) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function recordTarget(currentTarget, nextTarget) {
  if (!nextTarget || nextTarget.startsWith("-")) {
    throw new Error("Refusing to deploy: --target requires a value.");
  }
  if (currentTarget && currentTarget !== nextTarget) {
    throw new Error("Refusing to deploy: conflicting deployment targets were provided.");
  }
  return nextTarget;
}

export function parseDeploymentArgs(args) {
  const vercelArgs = [];
  let dryRun = false;
  let target = null;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (argument === "--") {
      throw new Error("Refusing to deploy: alternate project paths are not supported.");
    }

    if (argument === "--cwd" || argument.startsWith("--cwd=")) {
      throw new Error("Refusing to deploy: the project directory cannot be overridden.");
    }

    if (argument === "--prebuilt" || argument.startsWith("--prebuilt=")) {
      throw new Error("Refusing to deploy: prebuilt artifacts are not provenance-attested.");
    }

    if (argument === "--prod") {
      target = recordTarget(target, "production");
      vercelArgs.push(argument);
      continue;
    }

    if (argument.startsWith("--prod=")) {
      throw new Error("Refusing to deploy: unsupported --prod syntax.");
    }

    if (argument === "--target") {
      const value = args[index + 1];
      target = recordTarget(target, value);
      vercelArgs.push(argument, value);
      index += 1;
      continue;
    }

    if (argument.startsWith("--target=")) {
      target = recordTarget(target, argument.slice("--target=".length));
      vercelArgs.push(argument);
      continue;
    }

    if (!argument.startsWith("-")) {
      throw new Error("Refusing to deploy: alternate project paths are not supported.");
    }

    vercelArgs.push(argument);
    if (optionsWithSeparateValues.has(argument)) {
      const value = args[index + 1];
      if (!value || value.startsWith("-")) {
        throw new Error(`Refusing to deploy: ${argument} requires a value.`);
      }
      vercelArgs.push(value);
      index += 1;
    }
  }

  return {
    dryRun,
    isProduction: target === "production",
    vercelArgs,
  };
}

export function validateGitCheckout({ isProduction, gitCommand = git }) {
  const status = gitCommand(["status", "--porcelain=v1", "--untracked-files=all"]);
  if (status) {
    throw new Error("Refusing to deploy: the Git worktree is not clean.");
  }

  const gitSha = gitCommand(["rev-parse", "HEAD"]);
  if (!shaPattern.test(gitSha)) {
    throw new Error("Refusing to deploy: HEAD did not resolve to a 40-character Git SHA.");
  }

  if (isProduction) {
    const remoteMaster = gitCommand([
      "ls-remote",
      canonicalRepositoryUrl,
      "refs/heads/master",
    ]);
    const match = remoteMaster.match(/^([0-9a-f]{40})\trefs\/heads\/master$/);
    if (!match) {
      throw new Error("Refusing production deploy: canonical master did not resolve exactly once.");
    }

    const remoteSha = match[1];
    if (remoteSha !== gitSha) {
      throw new Error(
        `Refusing production deploy: HEAD ${gitSha} does not match canonical master ${remoteSha}.`,
      );
    }
  }

  return gitSha;
}

export function runDeployment(requestedArgs = process.argv.slice(2)) {
  const parsed = parseDeploymentArgs(requestedArgs);
  const gitSha = validateGitCheckout({ isProduction: parsed.isProduction });
  const vercelArgs = [
    "deploy",
    ...parsed.vercelArgs,
    "--build-env",
    `PO_DEPLOY_GIT_SHA=${gitSha}`,
    "--meta",
    `gitSha=${gitSha}`,
  ];

  if (parsed.dryRun) {
    console.log(
      JSON.stringify({
        gitSha,
        projectDirectory,
        command: "vercel",
        args: vercelArgs,
      }),
    );
    return 0;
  }

  const result = spawnSync("vercel", vercelArgs, {
    cwd: projectDirectory,
    stdio: "inherit",
  });
  if (result.error) {
    throw result.error;
  }
  return result.status ?? 1;
}

function main() {
  try {
    process.exitCode = runDeployment();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
