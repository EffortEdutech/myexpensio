begin;

create extension if not exists pgcrypto;

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1) organizations
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now()
);

-- 2) profiles (id = auth.users.id)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'USER',
  created_at timestamptz not null default now()
);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, created_at)
  values (new.id, new.email, now())
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 3) org_members
create table if not exists public.org_members (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  org_role text not null,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id),
  constraint org_members_org_role_check check (org_role in ('OWNER','MANAGER','MEMBER')),
  constraint org_members_status_check check (status in ('ACTIVE','REMOVED'))
);

create index if not exists org_members_user_id_idx on public.org_members(user_id);
create index if not exists org_members_org_id_idx on public.org_members(org_id);

-- security definer membership check (for RLS)
create or replace function public.is_org_member(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.org_members m
    where m.org_id = p_org_id
      and m.user_id = auth.uid()
      and m.status = 'ACTIVE'
  );
$$;

-- 4) rate_versions (simple)
create table if not exists public.rate_versions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  effective_from date not null,
  currency text not null default 'MYR',
  mileage_rate_per_km numeric(12,4) not null,
  created_by_user_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint rate_versions_unique unique (org_id, effective_from)
);

-- 5) trips (minimal)
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'DRAFT',
  calculation_mode text not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  origin_text text,
  destination_text text,
  final_distance_m numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trips_status_check check (status in ('DRAFT','FINAL')),
  constraint trips_calc_mode_check check (calculation_mode in ('GPS_TRACKING','SELECTED_ROUTE'))
);

drop trigger if exists trips_set_updated_at on public.trips;
create trigger trips_set_updated_at
before update on public.trips
for each row execute procedure public.set_updated_at();

-- 6) claims + claim_items (minimal)
create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'DRAFT',
  title text,
  total_amount numeric(14,2) not null default 0,
  currency text not null default 'MYR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint claims_status_check check (status in ('DRAFT','SUBMITTED'))
);

drop trigger if exists claims_set_updated_at on public.claims;
create trigger claims_set_updated_at
before update on public.claims
for each row execute procedure public.set_updated_at();

create table if not exists public.claim_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  claim_id uuid not null references public.claims(id) on delete cascade,
  type text not null,
  amount numeric(14,2) not null default 0,
  currency text not null default 'MYR',
  created_at timestamptz not null default now(),
  constraint claim_items_type_check check (type in ('MILEAGE','MEAL','LODGING'))
);

-- 7) routes_cache (global)
create table if not exists public.routes_cache (
  id uuid primary key default gen_random_uuid(),
  origin_hash text not null,
  destination_hash text not null,
  travel_mode text not null,
  request_payload jsonb,
  response_payload jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- ------------------------
-- RLS (basic)  ✅ FIXED HERE
-- ------------------------

alter table public.organizations enable row level security;
drop policy if exists organizations_read on public.organizations;
create policy organizations_read
on public.organizations for select
using (public.is_org_member(id));

alter table public.profiles enable row level security;
drop policy if exists profiles_read_own on public.profiles;
create policy profiles_read_own
on public.profiles for select
using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

alter table public.org_members enable row level security;
drop policy if exists org_members_read on public.org_members;
create policy org_members_read
on public.org_members for select
using (public.is_org_member(org_id));

alter table public.rate_versions enable row level security;
drop policy if exists rate_versions_rw on public.rate_versions;
create policy rate_versions_rw
on public.rate_versions for all
using (public.is_org_member(org_id))
with check (public.is_org_member(org_id));

alter table public.trips enable row level security;
drop policy if exists trips_rw on public.trips;
create policy trips_rw
on public.trips for all
using (public.is_org_member(org_id))
with check (public.is_org_member(org_id));

alter table public.claims enable row level security;
drop policy if exists claims_rw on public.claims;
create policy claims_rw
on public.claims for all
using (public.is_org_member(org_id))
with check (public.is_org_member(org_id));

alter table public.claim_items enable row level security;
drop policy if exists claim_items_rw on public.claim_items;
create policy claim_items_rw
on public.claim_items for all
using (public.is_org_member(org_id))
with check (public.is_org_member(org_id));

alter table public.routes_cache enable row level security;
drop policy if exists routes_cache_auth_only on public.routes_cache;
create policy routes_cache_auth_only
on public.routes_cache for all
using (auth.uid() is not null)
with check (auth.uid() is not null);

commit;