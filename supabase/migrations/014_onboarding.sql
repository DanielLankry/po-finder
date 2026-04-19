-- Track whether a user has completed the dashboard onboarding tour.
-- NULL = not yet completed. Once set, tour never auto-runs again.
-- Existing "Users can update own row" RLS policy on public.users already covers writes.

alter table public.users
  add column if not exists onboarding_completed_at timestamptz;
