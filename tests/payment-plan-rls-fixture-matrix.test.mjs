import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PLAN_CODES, PLANS } from "../lib/plans.ts";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const matrixPath = resolve(repositoryRoot, "docs/quality/payment-plan-rls-fixture-matrix.md");
const matrix = readFileSync(matrixPath, "utf8");

function takeSection(name) {
  const heading = `## ${name}`;
  const start = matrix.indexOf(heading);
  if (start === -1) {
    return null;
  }
  const next = matrix.indexOf("\n## ", start + heading.length);
  return matrix.slice(start, next === -1 ? undefined : next);
}

function extractPlanRows(sectionText) {
  const rows = [];
  const rowPattern = /^\|\s*(\d+)\s*\|\s*`([^`]+)`\s*\|\s*(\d+)\s*\|\s*(null|\d+)\s*\|\s*(\d+)\s*\|/gm;

  for (const match of sectionText.matchAll(rowPattern)) {
    rows.push({
      order: Number(match[1]),
      code: match[2],
      planDays: Number(match[3]),
      durationMonths: match[4] === "null" ? null : Number(match[4]),
      priceAgorot: Number(match[5]),
    });
  }
  return rows;
}

test("payment-plan matrix lists every supported listing plan exactly once and in exact PLAN_CODES order", () => {
  const section = takeSection("Payment-Plan Matrix");
  assert.ok(section, "missing Payment-Plan Matrix section");
  const rows = extractPlanRows(section);

  const expected = PLANS.map((plan, index) => ({
    order: index + 1,
    code: plan.code,
    planDays: plan.days,
    durationMonths: plan.months,
    priceAgorot: plan.price,
  }));

  assert.deepEqual(
    rows,
    expected,
    "plan rows differ from canonical PLAN/PLANS contract or are out of order",
  );
  assert.deepEqual(
    rows.map((row) => row.code),
    PLAN_CODES,
    "plan code list does not match PLAN_CODES",
  );
});

test("fixture matrix names required scenario IDs and safety boundaries", () => {
  assert.ok(!matrix.includes("npm run docs:links"), "remove stale docs:links command");
  assert.ok(matrix.includes("PLAYWRIGHT_BASE_URL"), "missing PLAYWRIGHT_BASE_URL guard text");
  assert.ok(matrix.includes("ymqlqdhelsocibhnanjy"), "missing production Supabase safeguard");
  assert.ok(matrix.includes("pokarov.co.il"), "missing production site safeguard");

  for (const requiredText of [
    "RUN_DESTRUCTIVE=1",
    "qa+*@pokarov.test",
    "APPROVED_DISPOSABLE_BASE_URL",
    "supabase db push",
    "supabase db reset",
    "production migrations",
  ]) {
    assert.ok(matrix.includes(requiredText), `missing safety boundary text: ${requiredText}`);
  }

  for (const fixture of [
    "free-draft-owner",
    "paid-active-owner",
    "paid-lifecycle-owner",
    "verified-inactive-owner",
    "expired-paid-owner",
    "renewal-owner",
    "legacy-public-owner",
    "payment-state-owner",
    "catalog-admin",
  ]) {
    assert.ok(matrix.includes(`\`${fixture}\``), `missing fixture role: ${fixture}`);
  }

  for (const id of [
    "rls-private-draft",
    "rls-unauth-mine-401",
    "rls-verified-inactive-private",
    "rls-paid-public",
    "rls-expired-non-legacy-hidden",
    "rls-legacy-public",
    "rls-owner-continuity",
    "rls-owner-cannot-tamper-lifecycle",
    "rls-stale-profile-status",
    "rls-renewal-refund-lifo",
    "rls-owner-public-surface",
    "payment-pending",
    "payment-cancelled",
    "payment-verification-failed",
    "payment-transport-failure",
    "payment-lost-return",
    "payment-succeeded",
    "payment-renewal-refund-lifo",
  ]) {
    assert.ok(matrix.includes(`\`${id}\``), `missing matrix scenario id: ${id}`);
  }
});

test("fixture matrix references canonical files and local links resolve", () => {
  const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g;
  const links = [...matrix.matchAll(linkPattern)]
    .map((match) => match[1])
    .filter((href) => !href.startsWith("http://") && !href.startsWith("https://"))
    .filter((href) => !href.startsWith("mailto:"))
    .filter((href) => !href.startsWith("/"))
    .map((href) => href.split("#")[0]);

  assert.ok(links.length > 0, "expected at least one canonical local markdown link");
  for (const href of links) {
    const target = resolve(resolve(dirname(matrixPath), href));
    assert.ok(
      existsSync(target),
      `missing linked file from matrix: ${href} (${target})`,
    );
  }
});
