import { test, expect, request as pwRequest } from '@playwright/test';
import {
  createConfirmedUser,
  cleanupTestUser,
  uniqEmail,
  TEST_PASSWORD,
  getOwnerBusinesses,
  signInTestUser,
} from '../utils/supabase-admin';
import { loginViaUI } from '../utils/login';

test.skip(process.env.RUN_DESTRUCTIVE !== '1', 'destructive flow — set RUN_DESTRUCTIVE=1 to run');
test.describe.configure({ mode: 'serial' });

test('unpaid business owner can create one private draft but cannot publish it', async ({ page, baseURL }) => {
  const email = uniqEmail('free-draft');
  const user = await createConfirmedUser({
    email,
    password: TEST_PASSWORD,
    name: 'QA Free Draft Owner',
    role: 'business_owner',
  });

  try {
    await loginViaUI(page, user.email, user.password);
    await page.goto('/dashboard/profile');
    await expect(page).toHaveURL(/\/dashboard\/profile/, { timeout: 15_000 });
    await expect(page.locator('body')).toContainText('טיוטה פרטית');

    const ownerClient = await signInTestUser(user);
    const businessName = `QA Free Draft ${Date.now()}`;
    const insert = await ownerClient.from('businesses').insert({
      owner_id: user.id,
      name: businessName,
      description: 'QA private free draft',
      category: 'coffee',
      kashrut: 'none',
      is_active: false,
    }).select('id, is_verified, is_active, expires_at').single();
    expect(insert.error).toBeNull();
    if (!insert.data) throw new Error('free draft insert returned no row');
    expect(insert.data).toMatchObject({ is_verified: false, is_active: false, expires_at: null });

    const secondInsert = await ownerClient.from('businesses').insert({
      owner_id: user.id,
      name: `QA Second Draft ${Date.now()}`,
      category: 'coffee',
      kashrut: 'none',
      is_active: false,
    }).select('id');
    expect(secondInsert.error, 'one owner must not create unlimited free drafts').not.toBeNull();

    const owned = await getOwnerBusinesses(user.id);
    expect(owned).toHaveLength(1);

    const ctx = await pwRequest.newContext({ baseURL });
    const publicList = await ctx.get(`/api/businesses?qa=${Date.now()}`);
    const publicJson = await publicList.json();
    expect((publicJson.businesses ?? []).some((item: { id: string }) => item.id === insert.data.id)).toBe(false);
    const publicDetail = await ctx.get(`/businesses/${insert.data.id}`);
    expect(publicDetail.status()).toBe(404);
    await ctx.dispose();
  } finally {
    await cleanupTestUser(user.id);
  }
});
