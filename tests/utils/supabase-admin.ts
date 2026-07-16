import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PRODUCTION_PROJECT_REF = 'ymqlqdhelsocibhnanjy';

if (!URL || !KEY) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local — required for destructive tests'
  );
}

/** Prevents destructive Playwright helpers from ever targeting the live project. */
function assertSafeDestructiveTarget(): void {
  if (process.env.RUN_DESTRUCTIVE !== '1') return;

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? '';
  if (URL!.includes(PRODUCTION_PROJECT_REF) || /pokarov\.co\.il/i.test(baseUrl)) {
    throw new Error(
      'Destructive tests are blocked against the production Supabase project and pokarov.co.il. Configure a dedicated test project first.'
    );
  }
}

assertSafeDestructiveTarget();

export const TEST_EMAIL_PREFIX = 'qa+';
export const TEST_EMAIL_DOMAIN = 'pokarov.test';
export const TEST_PASSWORD = 'TestPass!2026';

export function admin(): SupabaseClient {
  return createClient(URL!, KEY!, { auth: { persistSession: false } });
}

export function uniqEmail(tag: string): string {
  return `${TEST_EMAIL_PREFIX}${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@${TEST_EMAIL_DOMAIN}`;
}

export type CreatedUser = {
  id: string;
  email: string;
  password: string;
};

export async function createConfirmedUser(opts: {
  email: string;
  password?: string;
  name: string;
  role: 'business_owner' | 'customer';
}): Promise<CreatedUser> {
  const sb = admin();
  const password = opts.password ?? TEST_PASSWORD;

  const { data, error } = await sb.auth.admin.createUser({
    email: opts.email,
    password,
    email_confirm: true,
    user_metadata: { name: opts.name, role: opts.role },
  });
  if (error) throw new Error(`createUser failed: ${error.message}`);
  if (!data.user) throw new Error('createUser returned no user');

  const { error: insErr } = await sb.from('users').upsert({
    id: data.user.id,
    email: opts.email,
    role: opts.role,
    name: opts.name,
  });
  if (insErr) throw new Error(`users insert failed: ${insErr.message}`);

  // Try to mark onboarding complete — column may not exist on older DBs;
  // we also disable the tour client-side via localStorage in loginViaUI.
  await sb
    .from('users')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('id', data.user.id)
    .then(() => undefined, () => undefined);

  return { id: data.user.id, email: opts.email, password };
}

/**
 * Simulates the successful server-side settlement of a listing payment.
 * This never calls HYP: the succeeded ledger row is the durable entitlement
 * consumed by the business INSERT trigger.
 */
export type DurationPlanCode =
  | 'listing_1d'
  | 'listing_2d'
  | 'listing_3d'
  | 'listing_7d'
  | 'listing_1m'
  | 'listing_2m'
  | 'listing_3m'
  | 'listing_4m'
  | 'listing_5m'
  | 'listing_6m'
  | 'listing_7m'
  | 'listing_8m'
  | 'listing_9m'
  | 'listing_10m'
  | 'listing_11m'
  | 'listing_12m';

export async function grantDurationPlan(opts: {
  ownerId: string;
  businessId: string;
  productCode?: DurationPlanCode;
}): Promise<{ id: string }> {
  const sb = admin();
  const productCode = opts.productCode ?? 'listing_6m';

  const { data, error } = await sb
    .from('payment_attempts')
    .insert({
      user_id: opts.ownerId,
      business_id: opts.businessId,
      product_code: productCode,
      plan_days: 1,
      duration_months: 1,
      amount_agorot: 1,
      kind: 'listing',
      status: 'pending',
    })
    .select('id')
    .single();
  if (error) throw new Error(`grantDurationPlan failed: ${error.message}`);

  const { error: settleError } = await sb.rpc('settle_payment_attempt', {
    p_attempt_id: data.id,
    p_hyp_transaction_id: `QA-${data.id}`,
    p_hyp_auth_code: 'QA_AUTH',
    p_hyp_card_mask: '0000',
    p_hyp_response_code: '0',
    p_raw_return: {
      qa: true,
      provider_called: false,
      purpose: 'paid-lifecycle-regression',
    },
  });
  if (settleError) throw new Error(`settle_payment_attempt failed: ${settleError.message}`);

  return { id: data.id };
}

/** Signs a disposable QA user into a non-persistent client for real RLS checks. */
export async function signInTestUser(user: CreatedUser): Promise<SupabaseClient> {
  if (!ANON_KEY) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local — required for authenticated RLS tests'
    );
  }

  const sb = createClient(URL!, ANON_KEY, { auth: { persistSession: false } });
  const { error } = await sb.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });
  if (error) throw new Error(`signInTestUser failed: ${error.message}`);
  return sb;
}

/**
 * Creates an owner-controlled inactive business through the authenticated Data API.
 * The insert deliberately omits plan fields so the database must consume one listing credit.
 */
export async function createPendingBusinessAsOwner(
  ownerClient: SupabaseClient,
  opts: { ownerId: string; name: string }
): Promise<{ id: string }> {
  const { data, error } = await ownerClient
    .from('businesses')
    .insert({
      owner_id: opts.ownerId,
      name: opts.name,
      description: 'QA paid lifecycle regression business',
      category: 'coffee',
      address: 'QA Test Address, Tel Aviv',
      lat: 32.0853,
      lng: 34.7818,
      kashrut: 'none',
      is_active: false,
    })
    .select('id')
    .single();
  if (error) throw new Error(`createPendingBusinessAsOwner failed: ${error.message}`);
  return { id: data.id };
}

/** Simulates admin verification without granting free public listing time. */
export async function approveBusiness(businessId: string): Promise<void> {
  const { error } = await admin()
    .from('businesses')
    .update({ is_verified: true, is_active: false })
    .eq('id', businessId);
  if (error) throw new Error(`approveBusiness failed: ${error.message}`);
}

/** Forces a paid listing into the past so public and owner-side expiry behavior can be tested. */
export async function expireBusinessListing(businessId: string): Promise<string> {
  const expiredAt = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { error } = await admin()
    .from('businesses')
    .update({ expires_at: expiredAt })
    .eq('id', businessId);
  if (error) throw new Error(`expireBusinessListing failed: ${error.message}`);
  return expiredAt;
}

export async function seedPaidActiveBusiness(opts: {
  ownerId: string;
  name?: string;
  monthsValid?: number;
}): Promise<{ id: string }> {
  const sb = admin();
  const expires = new Date();
  expires.setMonth(expires.getMonth() + (opts.monthsValid ?? 3));

  const { data, error } = await sb
    .from('businesses')
    .insert({
      owner_id: opts.ownerId,
      name: opts.name ?? 'QA Paid Coffee',
      description: 'QA seeded paid business',
      category: 'coffee',
      kashrut: 'none',
      address: 'Tel Aviv',
      lat: 32.0853,
      lng: 34.7818,
      is_verified: true,
      is_active: true,
      expires_at: expires.toISOString(),
    })
    .select('id')
    .single();
  if (error) throw new Error(`seedPaidActiveBusiness failed: ${error.message}`);
  return { id: data.id };
}

export async function getOwnerBusinesses(ownerId: string) {
  const sb = admin();
  const { data, error } = await sb
    .from('businesses')
    .select('id, name, is_verified, is_active, expires_at, owner_id')
    .eq('owner_id', ownerId);
  if (error) throw error;
  return data ?? [];
}

export async function cleanupTestUser(userId: string): Promise<void> {
  const sb = admin();
  await sb.from('businesses').delete().eq('owner_id', userId);
  await sb.from('users').delete().eq('id', userId);
  const { error } = await sb.auth.admin.deleteUser(userId);
  if (error && !/not.*found/i.test(error.message)) {
    console.warn(`cleanupTestUser warning for ${userId}:`, error.message);
  }
}

export async function cleanupOrphanedTestUsers(): Promise<number> {
  const sb = admin();
  let removed = 0;
  let page = 1;
  while (true) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    if (!data.users.length) break;
    for (const u of data.users) {
      if (u.email && u.email.startsWith(TEST_EMAIL_PREFIX) && u.email.endsWith(`@${TEST_EMAIL_DOMAIN}`)) {
        await cleanupTestUser(u.id);
        removed++;
      }
    }
    if (data.users.length < 1000) break;
    page++;
  }
  return removed;
}
