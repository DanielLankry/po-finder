import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const pageSource = await readFile(
  new URL("../app/vendors/page.tsx", import.meta.url),
  "utf8",
);

test("vendor acquisition always routes through current pricing", () => {
  assert.match(pageSource, /href="\/pricing"/);
  assert.match(pageSource, /LAUNCH_OFFER\.primaryButtonText/);
  assert.doesNotMatch(pageSource, /launch-promotion|campaignOpen|FIRST_BUSINESSES/);
  assert.doesNotMatch(pageSource, /3 חודשים|20 העסקים/);
});
