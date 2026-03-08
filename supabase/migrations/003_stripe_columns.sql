-- Add Stripe-related columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none'
  CHECK (subscription_status IN ('none', 'active', 'past_due', 'canceled', 'incomplete'));
