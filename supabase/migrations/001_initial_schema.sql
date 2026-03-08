-- Enable UUID generation
create extension if not exists "pgcrypto";

-- =====================
-- USERS
-- =====================
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  role text not null check (role in ('customer', 'business_owner')),
  name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can read own row" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own row" on public.users
  for update using (auth.uid() = id);

create policy "Allow insert on signup" on public.users
  for insert with check (auth.uid() = id);

-- =====================
-- BUSINESSES
-- =====================
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  description text,
  category text not null check (category in ('coffee', 'sweets', 'meat', 'pasta', 'pizza')),
  address text,
  lat float,
  lng float,
  weekly_hours jsonb,
  phone text,
  whatsapp text,
  website text,
  instagram text,
  kashrut text not null default 'none' check (kashrut in ('kosher', 'kosher_mehadrin', 'none')),
  business_number text,
  avg_rating float not null default 0,
  review_count int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.businesses enable row level security;

create policy "Anyone can read active businesses" on public.businesses
  for select using (is_active = true);

create policy "Owners can insert own business" on public.businesses
  for insert with check (auth.uid() = owner_id);

create policy "Owners can update own business" on public.businesses
  for update using (auth.uid() = owner_id);

create policy "Owners can delete own business" on public.businesses
  for delete using (auth.uid() = owner_id);

-- =====================
-- BUSINESS SCHEDULES
-- =====================
create table if not exists public.business_schedules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  date date not null,
  address text,
  lat float,
  lng float,
  open_time time,
  close_time time,
  note text,
  created_at timestamptz not null default now(),
  unique (business_id, date)
);

alter table public.business_schedules enable row level security;

create policy "Anyone can read schedules" on public.business_schedules
  for select using (true);

create policy "Owners can insert schedule for own business" on public.business_schedules
  for insert with check (
    auth.uid() = (select owner_id from public.businesses where id = business_id)
  );

create policy "Owners can update own schedule" on public.business_schedules
  for update using (
    auth.uid() = (select owner_id from public.businesses where id = business_id)
  );

create policy "Owners can delete own schedule" on public.business_schedules
  for delete using (
    auth.uid() = (select owner_id from public.businesses where id = business_id)
  );

-- =====================
-- REVIEWS
-- =====================
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

alter table public.reviews enable row level security;

create policy "Anyone can read reviews" on public.reviews
  for select using (true);

create policy "Authenticated users can insert one review per business" on public.reviews
  for insert with check (auth.uid() = user_id);

create policy "Users can update own review" on public.reviews
  for update using (auth.uid() = user_id);

create policy "Users can delete own review" on public.reviews
  for delete using (auth.uid() = user_id);

-- Trigger to recompute avg_rating and review_count on businesses
create or replace function update_business_rating()
returns trigger as $$
begin
  update public.businesses
  set
    avg_rating = (
      select coalesce(avg(rating), 0) from public.reviews
      where business_id = coalesce(new.business_id, old.business_id)
    ),
    review_count = (
      select count(*) from public.reviews
      where business_id = coalesce(new.business_id, old.business_id)
    )
  where id = coalesce(new.business_id, old.business_id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_review_change
  after insert or update or delete on public.reviews
  for each row execute function update_business_rating();

-- =====================
-- PHOTOS
-- =====================
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  url text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.photos enable row level security;

create policy "Anyone can read photos" on public.photos
  for select using (true);

create policy "Owners can insert photos for own business" on public.photos
  for insert with check (
    auth.uid() = (select owner_id from public.businesses where id = business_id)
  );

create policy "Owners can delete own photos" on public.photos
  for delete using (
    auth.uid() = (select owner_id from public.businesses where id = business_id)
  );

create policy "Owners can update own photos" on public.photos
  for update using (
    auth.uid() = (select owner_id from public.businesses where id = business_id)
  );
