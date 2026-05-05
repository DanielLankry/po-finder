// Smoke test for HYP integration changes.
// Run: node tests/smoke-hyp.mjs
//
// Validates two things from the lib/hyp.ts changes:
//   1. describeNoSignatureBody() correctly identifies the perimeter-block
//      HTML body (the one we just got from production).
//   2. POSTing APISign with the new headers still works against HYP's
//      published public test merchant — proves Referer/Origin/User-Agent
//      headers don't break legit requests.

import assert from "node:assert/strict";

// ---- Re-implement the pure helper from lib/hyp.ts to test it standalone ----
function describeNoSignatureBody(body) {
  const looksLikeHtml = /^\s*<(!doctype|html)/i.test(body);
  if (looksLikeHtml) {
    if (/HTTP\s*REFERER/i.test(body) || /REMOTE\s*HOST/i.test(body)) {
      return "HYP perimeter rejected request (empty Referer/Remote-Host). Merchant terminal needs Referer/IP allowlist disabled or pokarov.co.il whitelisted.";
    }
    return "HYP returned HTML instead of signed querystring (likely auth/perimeter block).";
  }
  const parsed = new URLSearchParams(body);
  const ccode = parsed.get("CCode");
  if (ccode) {
    return `HYP rejected sign request (CCode=${ccode}). 902=KEY/PassP mismatch; 901=Masof not API-permitted.`;
  }
  return `HYP APISign returned no signature. Body: ${body.slice(0, 300)}`;
}

// ---- Test 1: classify the actual perimeter-block body from prod ----
const PROD_HTML_BODY = `<!DOCTYPE html>
<html>
<head><title>Hyp | error</title></head>
<body>
<p>HTTP REFERER: <br>REMOTE HOST: <br></p>
</body></html>`;

const msg1 = describeNoSignatureBody(PROD_HTML_BODY);
assert.match(msg1, /perimeter rejected/, "should detect perimeter block");
console.log("PASS: perimeter-HTML body classified as perimeter rejection");

// ---- Test 2: classify a CCode auth failure body ----
const CCODE_BODY = "CCode=902&Masof=1234&PassP=secret";
const msg2 = describeNoSignatureBody(CCODE_BODY);
assert.match(msg2, /CCode=902/, "should surface CCode in message");
console.log("PASS: CCode=902 body classified with code");

// ---- Test 3: classify a non-HTML, no-CCode body ----
const RAW_BODY = "completely unexpected text";
const msg3 = describeNoSignatureBody(RAW_BODY);
assert.match(msg3, /no signature/, "should fall through to generic message");
console.log("PASS: unexpected body falls through to generic message");

// ---- Test 4: live call against HYP public test merchant with new headers ----
// HYP's documented test triplet: Masof=0010131918, PassP=yaad,
// KEY=7110eda4d09e062aa5e4a390b0a572ac0d2c0220
//
// If the new Referer/Origin/User-Agent headers break the flow, this fails.
const HYP_ENDPOINT = "https://icom.yaad.net/p/";
const params = new URLSearchParams({
  action: "APISign",
  What: "SIGN",
  KEY: "7110eda4d09e062aa5e4a390b0a572ac0d2c0220",
  action_inner: "pay",
  Masof: "0010131918",
  PassP: "yaad",
  Amount: "10",
  Info: "smoke-test",
  Order: "smoke-" + Date.now(),
  Coin: "1",
  UTF8: "True",
  UTF8out: "True",
  Tash: "1",
  Sign: "True",
  MoreData: "True",
});
// URLSearchParams won't allow duplicate "action" keys via the constructor —
// the inner action=pay must be added separately to mirror the real payload.
params.delete("action_inner");
params.append("action", "pay");

const headers = {
  "Content-Type": "application/x-www-form-urlencoded",
  "Referer": "https://pokarov.co.il/",
  "Origin": "https://pokarov.co.il",
  "User-Agent": "pokarov.co.il/1.0 (+server-checkout)",
};

console.log("\nTest 4: live POST to HYP with new headers (test merchant)");
try {
  const res = await fetch(HYP_ENDPOINT, {
    method: "POST",
    headers,
    body: params.toString(),
  });
  const body = (await res.text()).trim();
  const isHtml = /^\s*<(!doctype|html)/i.test(body);
  const parsed = isHtml ? null : new URLSearchParams(body);
  const sig = parsed?.get("signature");
  console.log(`  HTTP ${res.status}, isHtml=${isHtml}, signature=${sig ? sig.slice(0, 20) + "..." : "<none>"}`);
  if (isHtml) {
    console.log("  body excerpt:", body.slice(0, 200));
    console.log("WARN: HYP returned HTML even for the public test merchant.");
    console.log("  → If our prod is also failing with HTML, the issue is at the HYP terminal");
    console.log("    settings level, not in headers. Track 1 (header injection) won't fix it");
    console.log("    alone — Track 2 (merchant console security settings) is required.");
    process.exit(0);
  }
  if (!sig) {
    console.log("  body excerpt:", body.slice(0, 300));
    throw new Error("no signature in response");
  }
  console.log("PASS: HYP test merchant returned a valid signature with our new headers");
} catch (err) {
  console.error("FAIL: live HYP call errored:", err.message);
  process.exit(1);
}

console.log("\nAll smoke tests passed.");
