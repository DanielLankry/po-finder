import { computeDashboardAccess, type DashboardAccessSignals } from "./dashboard-access-core";
import { adminClient } from "./supabase/admin";

export async function getDashboardAccessForUser(userId: string): Promise<{
  hasAccess: boolean;
  signals: DashboardAccessSignals;
}> {
  const admin = adminClient();
  const nowIso = new Date().toISOString();

  const [profileResult, activeBusinessResult, unconsumedPaymentResult, anyBusinessResult] =
    await Promise.all([
      admin
        .from("users")
        .select("subscription_status")
        .eq("id", userId)
        .maybeSingle(),
      admin
        .from("businesses")
        .select("id")
        .eq("owner_id", userId)
        .gt("expires_at", nowIso)
        .limit(1)
        .maybeSingle(),
      admin
        .from("payment_attempts")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "succeeded")
        .is("business_id", null)
        .limit(1)
        .maybeSingle(),
      admin
        .from("businesses")
        .select("id")
        .eq("owner_id", userId)
        .limit(1)
        .maybeSingle(),
    ]);

  const firstError =
    profileResult.error ??
    activeBusinessResult.error ??
    unconsumedPaymentResult.error ??
    anyBusinessResult.error;
  if (firstError) {
    throw new Error(firstError.message);
  }

  const signals = {
    subscriptionStatus: profileResult.data?.subscription_status,
    hasActiveBusiness: !!activeBusinessResult.data,
    hasUnconsumedPayment: !!unconsumedPaymentResult.data,
    hasAnyBusiness: !!anyBusinessResult.data,
  };

  return {
    hasAccess: computeDashboardAccess(signals),
    signals,
  };
}
