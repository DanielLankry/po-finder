import "./utils/source-loader.mjs";
import test, { mock, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
let jobs, writes, sends, sendResult, failAck;
const payload = { attemptId: "30000000-0000-4000-8000-000000000001", eventType: "payment_succeeded", businessName: "עסק", amountAgorot: 2000, durationMonths: null, planDays: 1, expiresAt: null, listingState: "awaiting_profile", occurredAt: "2026-09-09T12:00:00+00:00" };
const db = {
  rpc: async () => ({ data: jobs, error: null }),
  from: (table) => ({ update: (value) => {
    const entry = { table, value, filters: {} }; writes.push(entry);
    const chain = { eq: (key,v) => { entry.filters[key]=v; return chain; }, select: () => chain,
      single: async () => value.status === "accepted" && failAck ? {error:{message:"offline"},data:null} : {data:{id:"job"},error:null},
      then: (resolve) => Promise.resolve({error:null}).then(resolve),
    }; return chain;
  } }),
};
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") return { url: "data:text/javascript,export {};", shortCircuit: true };
  return nextResolve(specifier, context);
} });
mock.module("../lib/supabase/admin.ts", { namedExports: { adminClient: () => db } });
mock.module("resend", { namedExports: { Resend: class { emails = { send: async (request,options) => {
  sends.push({request,options}); if (sendResult instanceof Error) throw sendResult; return sendResult;
} }; } } });
const { dispatchPaymentEmails } = await import("../lib/payment-email-outbox.ts");
beforeEach(() => {
  process.env.RESEND_API_KEY = "test-not-a-real-key";
  jobs = [{ id: "job", lease_token: "lease", recipient: "owner@example.test", payload, attempts: 1, email_request: null, previous_uncertain: false }];
  writes=[]; sends=[]; failAck=false; sendResult={data:{id:"provider-id"},error:null};
});
test("send persists the stable request before provider acceptance and records message ID", async () => {
  assert.deepEqual(await dispatchPaymentEmails(payload.attemptId), { accepted: 1, failed: 0 });
  assert.ok(writes[0].value.email_request);
  assert.equal(sends[0].request.replyTo, "support@pokarov.co.il");
  assert.equal(sends[0].options.idempotencyKey, "payment-mail/job");
  assert.equal(writes.at(-1).value.provider_message_id,"provider-id");
  for (const write of writes) assert.deepEqual(write.filters,{ id:"job",lease_token:"lease",status:"sending" });
});
test("rate-limit rejection is retryable next day when no prior send is uncertain", async () => {
  sendResult={data:null,error:{statusCode:429,name:"rate_limit_exceeded"}};
  assert.deepEqual(await dispatchPaymentEmails(),{accepted:0,failed:1});
  assert.equal(writes.at(-1).value.status,"pending");
  assert.equal(writes.at(-1).value.uncertain_since,null);
});
test("network failure preserves uncertainty and does not leak raw errors", async () => {
  sendResult=new Error("SECRET provider payload");
  await dispatchPaymentEmails();
  assert.equal(writes.at(-1).value.last_error,"delivery_uncertain");
  assert.ok(!("uncertain_since" in writes.at(-1).value));
  assert.doesNotMatch(JSON.stringify(writes),/SECRET/);
});
test("failed acknowledgement retries byte-identical persisted content and same key", async () => {
  failAck=true; await dispatchPaymentEmails();
  const first = sends[0];
  jobs[0].email_request=first.request; jobs[0].previous_uncertain=true; jobs[0].attempts=2;
  jobs[0].payload={}; failAck=false;
  assert.deepEqual(await dispatchPaymentEmails(),{accepted:1,failed:0});
  assert.deepEqual(sends[1], first);
});
test("a later 429 cannot erase uncertainty from an earlier attempt", async () => {
  jobs[0].previous_uncertain=true;
  sendResult={data:null,error:{statusCode:429}};
  await dispatchPaymentEmails();
  assert.ok(!("uncertain_since" in writes.at(-1).value));
});
test("invalid recipient and terminal provider errors require admin attention", async () => {
  jobs[0].recipient=null;
  await dispatchPaymentEmails();
  assert.equal(sends.length,0);
  assert.equal(writes.at(-1).value.status,"needs_attention");
  assert.equal(writes.at(-1).value.last_error,"recipient_missing");
});
