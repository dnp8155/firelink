-- 0001_extensions_and_helpers.sql
-- Core auth/profile layer + helper functions used by the RLS policies.
create extension if not exists "pgcrypto";

-- Mirror of the app's user record. Replaces the Base44 "User" entity
-- (built-ins + custom user fields such as vendor_id / organization_id).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user',
  vendor_id uuid,
  organization_id uuid,
  data jsonb not null default '{}'::jsonb,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
comment on table public.profiles is 'App user profile; "data" holds any extra Base44 user.data fields.';

alter table public.profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- keeps updated_date fresh on every write
create or replace function public.set_updated_date()
returns trigger language plpgsql as $$
begin
  new.updated_date = now();
  return new;
end $$;

-- ---------- RLS helper functions ----------
create or replace function public.current_role_name()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid()) in ('admin','platform_admin','super_admin'), false)
$$;

create or replace function public.current_vendor_id()
returns uuid language sql stable security definer set search_path = public as $$
  select vendor_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_organization_id()
returns uuid language sql stable security definer set search_path = public as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_user_data(field text)
returns text language sql stable security definer set search_path = public as $$
  select data ->> field from public.profiles where id = auth.uid()
$$;

-- profiles access rules
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
