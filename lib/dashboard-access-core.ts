export interface DashboardAccessSignals {
  subscriptionStatus: string | null | undefined;
  hasActiveBusiness: boolean;
  hasUnconsumedPayment: boolean;
  hasAnyBusiness: boolean;
}

const PAID_SUBSCRIPTION_STATUSES = new Set(["active", "past_due"]);

/**
 * Computes the paid-side access decision shared by dashboard guards and navbar
 * UI. Admin approval is deliberately not part of this decision.
 */
export function computeDashboardAccess(signals: DashboardAccessSignals): boolean {
  return (
    PAID_SUBSCRIPTION_STATUSES.has(signals.subscriptionStatus ?? "") ||
    signals.hasActiveBusiness ||
    signals.hasUnconsumedPayment ||
    signals.hasAnyBusiness
  );
}
