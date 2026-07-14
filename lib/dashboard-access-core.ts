export interface DashboardAccessSignals {
  isBusinessOwner: boolean;
  hasActiveBusiness: boolean;
  hasUnconsumedPayment: boolean;
  hasAnyBusiness: boolean;
}

/**
 * Business-owner accounts enter the dashboard to create and preview their free
 * private draft. Public visibility remains controlled by verification and the
 * paid business expiry, not dashboard access.
 */
export function computeDashboardAccess(signals: DashboardAccessSignals): boolean {
  return (
    signals.isBusinessOwner ||
    signals.hasActiveBusiness ||
    signals.hasUnconsumedPayment ||
    signals.hasAnyBusiness
  );
}
