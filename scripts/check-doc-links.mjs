import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const markdownFiles = execFileSync(
  "git",
  [
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
    "--",
    "*.md",
    "*.mdx",
  ],
  { cwd: repositoryRoot, encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter(
    (markdownFile) =>
      markdownFile && existsSync(resolve(repositoryRoot, markdownFile)),
  );

const inlineLink = /!?\[[^\]]*\]\((?:<([^>]+)>|([^\s)]+))(?:\s+["'][^"']*["'])?\)/g;
const referenceLink = /^\s*\[[^\]]+\]:\s*(?:<([^>]+)>|(\S+))/gm;
const failures = [];
let checkedLinks = 0;

function checkTarget(markdownFile, rawTarget) {
  const target = rawTarget.trim();

  if (
    target.startsWith("#") ||
    /^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(target)
  ) {
    return;
  }

  const pathOnly = target.split("#", 1)[0].split("?", 1)[0];
  if (!pathOnly) {
    return;
  }

  checkedLinks += 1;
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathOnly);
  } catch {
    failures.push(`${markdownFile}: invalid URL encoding in ${target}`);
    return;
  }

  const absolutePath = decodedPath.startsWith("/")
    ? resolve(repositoryRoot, `.${decodedPath}`)
    : resolve(repositoryRoot, dirname(markdownFile), decodedPath);

  if (!existsSync(absolutePath)) {
    failures.push(`${markdownFile}: missing ${target}`);
    return;
  }

  if (decodedPath.endsWith("/") && !statSync(absolutePath).isDirectory()) {
    failures.push(`${markdownFile}: expected directory ${target}`);
  }
}

for (const markdownFile of markdownFiles) {
  const body = readFileSync(resolve(repositoryRoot, markdownFile), "utf8");

  for (const match of body.matchAll(inlineLink)) {
    checkTarget(markdownFile, match[1] ?? match[2]);
  }
  for (const match of body.matchAll(referenceLink)) {
    checkTarget(markdownFile, match[1] ?? match[2]);
  }
}

if (failures.length > 0) {
  console.error("Broken local documentation links:\n");
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(
  `Checked ${checkedLinks} local links across ${markdownFiles.length} Markdown files.`,
);
