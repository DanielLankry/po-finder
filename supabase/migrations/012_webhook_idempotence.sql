-- Migration: Stripe webhook idempotence tracking
-- Prevents duplicate processing of Stripe webhook events

CREATE TABLE IF NOT EXISTS processed_webhook_events (
  event_id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for auto-cleanup of old events (> 30 days)
CREATE INDEX IF NOT EXISTS idx_webhook_events_created
  ON processed_webhook_events(created_at);
