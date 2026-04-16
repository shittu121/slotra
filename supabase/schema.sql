-- Run this in your Supabase SQL editor

-- businesses table
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  slug text unique not null,
  available_days text[] not null default '{}',
  start_time text not null default '09:00',
  end_time text not null default '17:00',
  duration integer not null default 60,
  price text,
  created_at timestamptz default now()
);

alter table public.businesses enable row level security;

create policy "owners_all_businesses"
  on public.businesses for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "anyone_view_businesses"
  on public.businesses for select
  to anon, authenticated
  using (true);

-- bookings table
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  date text not null,
  time_slot text not null,
  status text not null default 'upcoming' check (status in ('upcoming', 'completed', 'no-show')),
  created_at timestamptz default now(),
  unique(business_id, date, time_slot)
);

alter table public.bookings enable row level security;

create policy "anyone_create_bookings"
  on public.bookings for insert
  to anon, authenticated
  with check (true);

create policy "owners_view_bookings"
  on public.bookings for select
  to authenticated
  using (
    exists (
      select 1 from public.businesses
      where businesses.id = bookings.business_id
      and businesses.user_id = auth.uid()
    )
  );

create policy "owners_update_bookings"
  on public.bookings for update
  to authenticated
  using (
    exists (
      select 1 from public.businesses
      where businesses.id = bookings.business_id
      and businesses.user_id = auth.uid()
    )
  )
  with check (true);

-- Security-definer function to get taken slots without exposing customer PII
create or replace function public.get_taken_slots(p_business_id uuid, p_date text)
returns text[]
language sql
security definer
set search_path = public
as $$
  select coalesce(array_agg(time_slot), '{}')
  from public.bookings
  where business_id = p_business_id and date = p_date;
$$;

-- If you already ran the schema and need to add the status column:
-- alter table public.bookings add column if not exists status text not null default 'upcoming' check (status in ('upcoming', 'completed', 'no-show'));
-- alter table public.bookings add constraint bookings_status_check check (status in ('upcoming', 'completed', 'no-show'));
-- create policy "owners_update_bookings" on public.bookings for update to authenticated using (exists (select 1 from public.businesses where businesses.id = bookings.business_id and businesses.user_id = auth.uid())) with check (true);
