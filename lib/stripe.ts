import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Missing STRIPE_SECRET_KEY environment variable");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
      timeout: 30000,   // 30s timeout (default is 80s but serverless cuts it)
      maxNetworkRetries: 0, // disable retries — fail fast and show real error
    });
  }
  return _stripe;
}

export { PLANS } from "./plans";
