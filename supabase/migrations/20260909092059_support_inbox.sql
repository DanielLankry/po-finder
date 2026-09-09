-- Store contact-form conversations for the server-only admin support inbox.
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 254),
  subject text not null check (subject in ('general', 'business', 'bug', 'privacy', 'billing', 'other')),
  subject_label text not null check (char_length(subject_label) between 1 and 100),
  message text not null check (char_length(message) between 1 and 2000),
  status text not null default 'new' check (status in ('new', 'replied')),
  created_at timestamptz not null default now(),
  last_replied_at timestamptz
);

create table public.contact_replies (
  id uuid primary key default gen_random_uuid(),
  contact_message_id uuid not null references public.contact_messages(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  delivery_status text not null default 'sending' check (delivery_status in ('sending', 'sent', 'failed')),
  resend_email_id text,
  error_message text check (error_message is null or char_length(error_message) <= 500),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index contact_messages_status_created_at_idx
  on public.contact_messages (status, created_at desc);

create index contact_replies_message_created_at_idx
  on public.contact_replies (contact_message_id, created_at);

alter table public.contact_messages enable row level security;
alter table public.contact_replies enable row level security;

-- These records contain private customer correspondence. The browser has no
-- direct table access; only authenticated admin route handlers use service_role.
revoke all on table public.contact_messages from anon, authenticated;
revoke all on table public.contact_replies from anon, authenticated;
grant select, insert, update, delete on table public.contact_messages to service_role;
grant select, insert, update, delete on table public.contact_replies to service_role;

comment on table public.contact_messages is
  'Private contact-form messages, accessible only through signed admin routes.';
comment on table public.contact_replies is
  'Outbound support replies and Resend delivery audit state.';
