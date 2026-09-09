import "./utils/source-loader.mjs";
import test, { mock, beforeEach } from "node:test";
import assert from "node:assert/strict";
let callbacks, verification, rpcError, providerRefund, status;
const id="30000000-0000-4000-8000-000000000001";
mock.module("next/server.js",{namedExports:{NextRequest:class {},NextResponse:{json:(body,opts)=>Response.json(body,opts),redirect:url=>new Response(null,{status:307,headers:{location:url.toString()}})},after:fn=>callbacks.push(fn)}});
mock.module("@sentry/nextjs",{namedExports:{captureException:()=>{},captureMessage:()=>{}}});
mock.module("../lib/admin-session.ts",{namedExports:{isAdminRequest:async()=>true}});
mock.module("../lib/payment-email-outbox.ts",{namedExports:{dispatchPaymentEmails:async()=>({accepted:1,failed:0})}});
mock.module("../lib/hyp.ts",{namedExports:{verifyReturnSignature:async()=>{if(verification instanceof Error)throw verification;return verification;},refundTransaction:async()=>({ok:providerRefund,raw:"fixture"})}});
const chain={select:()=>chain,eq:()=>chain,single:async()=>({data:{id,status,business_id:null,kind:"listing",product_code:"listing_1m",amount_agorot:4000,hyp_transaction_id:"provider"}}),update:()=>chain,then:resolve=>Promise.resolve({error:null}).then(resolve)};
mock.module("../lib/supabase/admin.ts",{namedExports:{adminClient:()=>({from:()=>chain,rpc:async(name)=>({error:name==='preflight_refund_payment_entitlement'?null:rpcError})})}});
const paymentReturn=await import("../app/api/payments/return/route.ts");
const refund=await import("../app/api/admin/payments/[id]/refund/route.ts");
beforeEach(()=>{callbacks=[];verification=true;rpcError=null;providerRefund=true;status="pending";});
const request=()=>({nextUrl:new URL(`https://pokarov.co.il/api/payments/return?Order=${id}&CCode=0&Id=provider`)});
test("verified persisted settlement schedules mail after response",async()=>{
  const response=await paymentReturn.GET(request());
  assert.match(response.headers.get("location"),/payment=success/);
  assert.equal(callbacks.length,1);
});
test("verification failure, transport uncertainty and database failure never schedule success mail",async()=>{
  verification=false; await paymentReturn.GET(request()); assert.equal(callbacks.length,0);
  verification=new Error("fixture verifier unavailable"); await paymentReturn.GET(request()); assert.equal(callbacks.length,0);
  verification=true;rpcError={message:"fixture database unavailable"};await paymentReturn.GET(request());assert.equal(callbacks.length,0);
});
test("refund requires both provider success and committed entitlement rollback",async()=>{
  status="succeeded";providerRefund=false;
  await refund.POST({}, {params:Promise.resolve({id})});assert.equal(callbacks.length,0);
  providerRefund=true;rpcError={message:"fixture rollback failed"};
  await refund.POST({}, {params:Promise.resolve({id})});assert.equal(callbacks.length,0);
  rpcError=null;
  await refund.POST({}, {params:Promise.resolve({id})});assert.equal(callbacks.length,1);
});
