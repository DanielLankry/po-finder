import { cleanupOrphanedTestUsers } from '../utils/supabase-admin';

export default async function globalTeardown() {
  if (process.env.RUN_DESTRUCTIVE !== '1') return;
  try {
    const removed = await cleanupOrphanedTestUsers();
    console.log(`[teardown] cleaned up ${removed} test users`);
  } catch (err) {
    console.warn('[teardown] cleanup error:', err);
  }
}
