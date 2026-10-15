import { execFileSync, spawnSync } from "node:child_process";

const shaPattern = /^[0-9a-f]{40}$/;

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

const requestedArgs = process.argv.slice(2);
const dryRunIndex = requestedArgs.indexOf("--dry-run");
const dryRun = dryRunIndex !== -1;
if (dryRun) requestedArgs.splice(dryRunIndex, 1);

const status = git(["status", "--porcelain=v1", "--untracked-files=all"]);
if (status) {
  console.error("Refusing to deploy: the Git worktree is not clean.");
  process.exit(1);
}

const gitSha = git(["rev-parse", "HEAD"]);
if (!shaPattern.test(gitSha)) {
  console.error("Refusing to deploy: HEAD did not resolve to a 40-character Git SHA.");
  process.exit(1);
}

if (requestedArgs.includes("--prod")) {
  const remoteMaster = git(["ls-remote", "origin", "refs/heads/master"]);
  const [remoteSha, remoteRef, ...extra] = remoteMaster.split(/\s+/);
  if (extra.length > 0 || remoteRef !== "refs/heads/master" || !shaPattern.test(remoteSha ?? "")) {
    console.error("Refusing production deploy: origin/master did not resolve exactly once.");
    process.exit(1);
  }
  if (remoteSha !== gitSha) {
    console.error(`Refusing production deploy: HEAD ${gitSha} does not match origin/master ${remoteSha}.`);
    process.exit(1);
  }
}

const vercelArgs = [
  "deploy",
  ...requestedArgs,
  "--build-env",
  `PO_DEPLOY_GIT_SHA=${gitSha}`,
  "--meta",
  `gitSha=${gitSha}`,
];

if (dryRun) {
  console.log(JSON.stringify({ gitSha, command: "vercel", args: vercelArgs }));
  process.exit(0);
}

const result = spawnSync("vercel", vercelArgs, { stdio: "inherit" });
if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
