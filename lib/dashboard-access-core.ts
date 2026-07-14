export interface DashboardAccessSignals {
  hasActiveBusiness: boolean;
  hasUnconsumedPayment: boolean;
  hasAnyBusiness: boolean;
}

/**
 * Computes the paid-side access decision shared by dashboard guards and navbar
 * UI. The legacy profile subscription flag is deliberately excluded because
 * one-shot listing entitlement lives in payment credits and business expiry.
 */
export function computeDashboardAccess(signals: DashboardAccessSignals): boolean {
  return (
    signals.hasActiveBusiness ||
    signals.hasUnconsumedPayment ||
    signals.hasAnyBusiness
  );
}
