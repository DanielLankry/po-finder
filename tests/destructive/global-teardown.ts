/**
 * Cleans orphaned destructive-test users only when destructive mode is explicit.
 * The helper is imported lazily so public/auth-only runs never load production-capable credentials.
 */
export default async function globalTeardown() {
  if (process.env.RUN_DESTRUCTIVE !== '1') return;
  try {
    const { cleanupOrphanedTestUsers } = await import('../utils/supabase-admin');
    const removed = await cleanupOrphanedTestUsers();
    console.log(`[teardown] cleaned up ${removed} test users`);
  } catch (err) {
    console.warn('[teardown] cleanup error:', err);
  }
}
