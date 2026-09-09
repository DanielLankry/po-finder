import "./utils/source-loader.mjs";
import test, { mock } from "node:test";
import assert from "node:assert/strict";
let signedIn = false; let calls = 0;
mock.module("../lib/admin-session.ts", { namedExports: { isAdminRequest: async () => signedIn } });
mock.module("../lib/supabase/admin.ts", { namedExports: { adminClient: () => { calls++; throw new Error("Should not access DB"); } } });
mock.module("../lib/payment-email-outbox.ts", { namedExports: { dispatchPaymentEmails: async () => { calls++; return {accepted:0,failed:0}; } } });
const admin = await import("../app/api/admin/payment-emails/route.ts");
const cron = await import("../app/api/cron/payment-emails/route.ts");
const { NextRequest } = await import("next/server.js");
test("queue reads and writes require a signed administrator", async () => {
  const req = new NextRequest("https://pokarov.co.il/api/admin/payment-emails");
  assert.equal((await admin.GET(req)).status,401);
  assert.equal((await admin.POST(req)).status,401);
  assert.equal(calls,0);
});
test("signed admin send rejects cross-site origin", async () => {
  signedIn=true;
  const req=new NextRequest("https://pokarov.co.il/api/admin/payment-emails",{method:"POST",headers:{origin:"https://evil.example"}});
  assert.equal((await admin.POST(req)).status,403);
  assert.equal(calls,0);
});
test("cron requires the configured bearer token", async () => {
  process.env.CRON_SECRET="fixture-secret";
  assert.equal((await cron.GET(new NextRequest("https://pokarov.co.il/api/cron/payment-emails"))).status,401);
  assert.equal(calls,0);
  const result=await cron.GET(new NextRequest("https://pokarov.co.il/api/cron/payment-emails",{headers:{authorization:"Bearer fixture-secret"}}));
  assert.equal(result.status,200);
  assert.equal(calls,1);
});
