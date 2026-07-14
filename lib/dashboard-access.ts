import { computeDashboardAccess, type DashboardAccessSignals } from "./dashboard-access-core";
import { adminClient } from "./supabase/admin";

export async function getDashboardAccessForUser(userId: string): Promise<{
  hasAccess: boolean;
  signals: DashboardAccessSignals;
}> {
  const admin = adminClient();
  const nowIso = new Date().toISOString();

  const [activeBusinessResult, unconsumedPaymentResult, anyBusinessResult] =
    await Promise.all([
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
    activeBusinessResult.error ??
    unconsumedPaymentResult.error ??
    anyBusinessResult.error;
  if (firstError) {
    throw new Error(firstError.message);
  }

  const signals = {
    hasActiveBusiness: !!activeBusinessResult.data,
    hasUnconsumedPayment: !!unconsumedPaymentResult.data,
    hasAnyBusiness: !!anyBusinessResult.data,
  };

  return {
    hasAccess: computeDashboardAccess(signals),
    signals,
  };
}
