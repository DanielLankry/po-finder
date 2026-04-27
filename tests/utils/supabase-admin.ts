import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !KEY) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local — required for destructive tests'
  );
}

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
    .select('id, name, is_active, expires_at, owner_id')
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
