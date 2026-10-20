-- 0006_engineering_project.sql
-- Adds the engineering suite table (design / audit / installation / retrofit / maintenance projects).
-- The base bundle 0001-0005 stays untouched so it can be run on its own and this file simply runs after it.

create table if not exists public."engineering_project" (
  "id" uuid primary key default gen_random_uuid(),
  "name" text not null,
  "client_name" text,
  "site_name" text,
  "city" text,
  "project_type" text default 'design' check ("project_type" is null or "project_type" in ('design', 'audit', 'installation', 'retrofit', 'maintenance')) not null,
  "scope" text,
  "status" text default 'planning' check ("status" is null or "status" in ('planning', 'in_progress', 'on_hold', 'completed', 'cancelled')) not null,
  "priority" text default 'medium' check ("priority" is null or "priority" in ('low', 'medium', 'high')) not null,
  "start_date" date,
  "target_date" date,
  "engineer_name" text,
  "project_value" numeric default 0,
  "description" text,
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create index if not exists "engineering_project_created_date_idx" on public."engineering_project" ("created_date" desc);
create index if not exists "engineering_project_status_idx" on public."engineering_project" ("status");
create index if not exists "engineering_project_created_by_id_idx" on public."engineering_project" ("created_by_id");

-- Same rules as the Base44 entity: the engineer who created the project, or a platform admin.
alter table public."engineering_project" enable row level security;
drop policy if exists "engineering_project_select" on public."engineering_project";
create policy "engineering_project_select" on public."engineering_project" for select to authenticated using ((("created_by_id" = auth.uid()) or public.is_admin()));
drop policy if exists "engineering_project_insert" on public."engineering_project";
create policy "engineering_project_insert" on public."engineering_project" for insert to authenticated with check (("created_by_id" = auth.uid()));
drop policy if exists "engineering_project_update" on public."engineering_project";
create policy "engineering_project_update" on public."engineering_project" for update to authenticated using ((("created_by_id" = auth.uid()) or public.is_admin())) with check ((("created_by_id" = auth.uid()) or public.is_admin()));
drop policy if exists "engineering_project_delete" on public."engineering_project";
create policy "engineering_project_delete" on public."engineering_project" for delete to authenticated using ((("created_by_id" = auth.uid()) or public.is_admin()));

alter table public."engineering_project" add constraint "engineering_project_created_by_id_fkey" foreign key ("created_by_id") references public."profiles" (id) on delete set null;

drop trigger if exists "engineering_project_set_updated_date" on public."engineering_project";
create trigger "engineering_project_set_updated_date" before update on public."engineering_project" for each row execute function public.set_updated_date();