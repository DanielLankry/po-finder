import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCreditGuardResponseMac,
  verifyCreditGuardResponseMac,
} from "../lib/hyp-verification.ts";

test("CreditGuard response MAC is calculated from documented redirect fields", () => {
  const params = new URLSearchParams({
    txId: "tx-1",
    errorCode: "",
    cardToken: "token",
    cardExp: "1229",
    personalId: "",
    uniqueID: "attempt-1",
    responseMac: "2/oDHQ4rew5x+6SBZ7wrAnAymaKvxHUloYK9xyIaNgI=",
  });

  assert.equal(
    buildCreditGuardResponseMac(params, "secret"),
    "2/oDHQ4rew5x+6SBZ7wrAnAymaKvxHUloYK9xyIaNgI=",
  );
  assert.equal(verifyCreditGuardResponseMac(params, "secret"), true);

  params.set("uniqueID", "attempt-2");
  assert.equal(verifyCreditGuardResponseMac(params, "secret"), false);
});
