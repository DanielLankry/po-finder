import test from "node:test";
import assert from "node:assert/strict";
import { serializeJsonLd } from "../lib/json-ld.ts";

test("JSON-LD serialization cannot terminate its script element", () => {
  const payload = "</script><script>globalThis.pwned = true</script>&\u2028\u2029";
  const serialized = serializeJsonLd({ name: payload });

  assert.doesNotMatch(serialized, /<|>|&|\u2028|\u2029/);
  assert.match(serialized, /\\u003c\/script\\u003e/);
  assert.deepEqual(JSON.parse(serialized), { name: payload });
});
