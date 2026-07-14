/**
 * Payment-provider seam.
 *
 * Plans are day-based (lib/plans.ts). One-shot charges only — no recurring,
 * no card vault. A successful unconsumed listing payment is the database
 * credit that authorizes exactly one business INSERT.
 *
 * The trigger consume_payment_for_business() (migration 017) bumps
 * businesses.expires_at by plan_days when a paid user creates a business.
 * For renewals, the return handler bumps expires_at directly on the
 * payment_attempt's business_id.
 */

export type SubscriptionStatus = 'none' | 'active' | 'past_due' | 'canceled' | 'incomplete';

export interface CheckoutRequest {
  planDays: number;
  userId: string;
  /** Optional — set when renewing an existing business. */
  businessId?: string;
}

export interface CheckoutSession {
  /** Provider transaction reference (our payment_attempts.id). */
  id: string;
  /** Hosted-page URL to redirect the user to. */
  url: string;
}
