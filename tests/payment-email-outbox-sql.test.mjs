import test, { after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

// Actual PostgreSQL functions run entirely in memory. No credentials or production data.
const db = new PGlite();
await db.exec(`
  CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
  CREATE SCHEMA auth; CREATE SCHEMA private;
  CREATE TABLE auth.users(id uuid PRIMARY KEY,email text);
  CREATE TABLE public.businesses(id uuid PRIMARY KEY,owner_id uuid,name text,
    is_verified boolean DEFAULT true,is_active boolean DEFAULT false,is_legacy_public boolean DEFAULT false,
    expires_at timestamptz,boost_expires_at timestamptz);
  CREATE TABLE public.payment_attempts(id uuid PRIMARY KEY,user_id uuid,business_id uuid,
    status text DEFAULT 'pending',kind text DEFAULT 'listing',product_code text DEFAULT 'listing_1m',
    amount_agorot int DEFAULT 4000,plan_days int DEFAULT 30,duration_months int DEFAULT 1,
    bonus_boost_days int DEFAULT 0,hyp_transaction_id text,hyp_auth_code text,hyp_card_mask text,
    hyp_response_code text,raw_return jsonb,completed_at timestamptz,service_status text,
    entitlement_base_at timestamptz,entitlement_expires_at timestamptz,
    entitlement_previous_is_active boolean,entitlement_previous_is_legacy_public boolean);
`);
const settlement = readFileSync(new URL("../supabase/migrations/20260716045924_add_day_week_listing_plans.sql", import.meta.url), "utf8");
await db.exec(settlement.slice(settlement.indexOf("CREATE OR REPLACE FUNCTION public.settle_payment_attempt")));
await db.exec(readFileSync(new URL("../supabase/migrations/20260909122231_payment_email_outbox.sql", import.meta.url), "utf8"));
const owner = "10000000-0000-4000-8000-000000000001";
const business = "20000000-0000-4000-8000-000000000001";
const payment = "30000000-0000-4000-8000-000000000001";
const renewal = "30000000-0000-4000-8000-000000000002";
beforeEach(async () => {
  await db.exec("RESET ROLE; TRUNCATE public.payment_email_outbox,public.payment_attempts,public.businesses,auth.users CASCADE;");
  await db.query("INSERT INTO auth.users VALUES ($1,'owner@example.test')", [owner]);
  await db.query("INSERT INTO public.businesses(id,owner_id,name) VALUES ($1,$2,'בית הקפה')", [business,owner]);
  await db.query("INSERT INTO public.payment_attempts(id,user_id,business_id) VALUES ($1,$2,$3)", [payment,owner,business]);
});
after(() => db.close());
const settle = (id = payment) => db.query("SELECT public.settle_payment_attempt($1,'provider','','','0','{}')", [id]);
const rows = async () => (await db.query("SELECT * FROM public.payment_email_outbox ORDER BY created_at,id")).rows;

test("committed settlement creates one email with actual expiry and immutable amount", async () => {
  assert.equal((await rows()).length, 0);
  await settle(); await settle();
  const [job] = await rows();
  assert.equal((await rows()).length, 1);
  assert.equal(job.event_type, "payment_succeeded");
  assert.equal(job.recipient, "owner@example.test");
  assert.equal(job.payload.amountAgorot, 4000);
  assert.equal(job.payload.listingState, "active");
  const [{ expires_at }] = (await db.query("SELECT expires_at FROM businesses WHERE id=$1", [business])).rows;
  assert.equal(new Date(job.payload.expiresAt).getTime(), expires_at.getTime());
});
test("purchase without a business accurately asks for the profile", async () => {
  await db.query("UPDATE payment_attempts SET business_id=NULL WHERE id=$1", [payment]);
  await settle();
  const [job] = await rows();
  assert.equal(job.payload.listingState, "awaiting_profile");
  assert.equal(job.payload.expiresAt, null);
});
test("declines and rolled-back settlements send nothing", async () => {
  await db.exec("BEGIN"); await settle(); await db.exec("ROLLBACK");
  assert.equal((await rows()).length, 0);
  await db.query("UPDATE payment_attempts SET status='failed' WHERE id=$1", [payment]);
  assert.equal((await rows()).length, 0);
});
test("renewal and newest-first refund use exact resulting expiry", async () => {
  await settle();
  const original = (await rows())[0].payload.expiresAt;
  await db.query("INSERT INTO payment_attempts(id,user_id,business_id,plan_days,duration_months) VALUES ($1,$2,$3,2,NULL)", [renewal,owner,business]);
  await settle(renewal);
  assert.ok((await rows()).some(row => row.event_type === "listing_renewed"));
  await assert.rejects(db.query("SELECT refund_payment_entitlement($1)", [payment]), /newer listing/);
  assert.equal((await rows()).length, 2);
  await db.query("SELECT refund_payment_entitlement($1)", [renewal]);
  const refund = (await rows()).find(row => row.event_type === "payment_refunded");
  assert.equal(new Date(refund.payload.expiresAt).getTime(), new Date(original).getTime());
  assert.equal(refund.payload.listingState, "active");
});
test("leases exclude other workers and block uncertain retries past retention", async () => {
  await settle();
  const claim = (await db.query("SELECT claim_payment_emails(5,NULL) AS job")).rows;
  assert.equal(claim.length, 1);
  assert.equal(claim[0].job.previous_uncertain, false);
  assert.equal((await db.query("SELECT claim_payment_emails(5,NULL)")).rows.length, 0);
  await db.exec("UPDATE payment_email_outbox SET lease_until=now()-interval '1 minute',uncertain_since=now()-interval '24 hours'");
  assert.equal((await db.query("SELECT claim_payment_emails(5,NULL)")).rows.length, 0);
  assert.equal((await rows())[0].status, "needs_attention");
});
test("known rejected requests remain safe to retry the next day", async () => {
  await settle();
  await db.exec("UPDATE payment_email_outbox SET created_at=now()-interval '2 days',uncertain_since=NULL");
  assert.equal((await db.query("SELECT claim_payment_emails(5,NULL)")).rows.length, 1);
});
test("browser roles cannot inspect queue or claim/send messages", async () => {
  await settle();
  for (const role of ["anon", "authenticated"]) {
    await db.exec(`SET ROLE ${role}`);
    await assert.rejects(db.query("SELECT * FROM public.payment_email_outbox"), /permission denied/);
    await assert.rejects(db.query("SELECT public.claim_payment_emails(5,NULL)"), /permission denied/);
    await db.exec("RESET ROLE");
  }
});
