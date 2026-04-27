/**
 * Payment-provider seam.
 *
 * HOW THE PAYWALL WORKS NOW:
 *   - RLS (migration 015) requires `user_is_subscribed()` = true to INSERT/UPDATE
 *     a business. The function reads `users.subscription_status`.
 *   - Until a payment provider (HYP) is wired, the only way to grant access is
 *     to manually set `subscription_status = 'active'` via the Supabase SQL
 *     editor or admin UI.
 *
 * WIRING HYP LATER:
 *   1. Create `app/api/payments/checkout/route.ts` — accepts `{ months }`,
 *      creates a HYP payment session, returns the redirect URL.
 *   2. Create `app/api/payments/webhook/route.ts` — verifies HYP signature,
 *      on successful payment:
 *        a. Set `users.subscription_status = 'active'`
 *        b. Set the user's pending business `expires_at = now + months`
 *        c. Persist event_id for idempotence (recreate the events table or use
 *           an existing log)
 *   3. Replace the placeholder CTA in `app/pricing/page.tsx` (currently routes
 *      to `/contact`) with a fetch to your new checkout route.
 *   4. Add `app/dashboard/payment-success/page.tsx` if you want a confirmation
 *      page after redirect-back.
 *
 * The TypeScript shapes below are guidance, not contracts — replace freely.
 */

export type SubscriptionStatus = 'none' | 'active' | 'past_due' | 'canceled' | 'incomplete';

export interface CheckoutRequest {
  /** Number of months the listing should remain active after payment. */
  months: number;
  /** Supabase auth user ID making the purchase. */
  userId: string;
  /** Where HYP should redirect after success. */
  successUrl: string;
  /** Where HYP should redirect on cancellation. */
  cancelUrl: string;
}

export interface CheckoutSession {
  /** Provider-issued session/payment ID. */
  id: string;
  /** Hosted-page URL to redirect the user to. */
  url: string;
}

export interface PaymentProvider {
  createCheckout(req: CheckoutRequest): Promise<CheckoutSession>;
  verifyWebhook(rawBody: string, signature: string): { eventId: string; userId: string; months: number } | null;
}
