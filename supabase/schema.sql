-- ============================================================
--  EcoPaper — Supabase Schema
--  Run this in: Supabase → SQL Editor → New query
-- ============================================================

-- ── EXTENSIONS ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── ENUMS ──────────────────────────────────────────────────
create type user_role     as enum ('department_user', 'facility_staff', 'facility_manager');
create type paper_type    as enum ('mixed', 'shredded', 'cardboard', 'confidential');
create type priority_level as enum ('normal', 'urgent');
create type request_status as enum ('pending', 'assigned', 'in_progress', 'completed', 'cancelled');

-- ── DEPARTMENTS ────────────────────────────────────────────
create table departments (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  building    text not null,
  created_at  timestamptz default now()
);

-- ── PROFILES (extends auth.users) ─────────────────────────
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  role          user_role not null default 'department_user',
  department_id uuid references departments(id),
  avatar_url    text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── PICKUP REQUESTS ────────────────────────────────────────
create table pickup_requests (
  id               uuid primary key default uuid_generate_v4(),
  department_id    uuid not null references departments(id),
  building         text not null,
  floor            text,
  paper_type       paper_type not null default 'mixed',
  estimated_weight numeric(8,2) not null check (estimated_weight > 0),
  actual_weight    numeric(8,2) check (actual_weight >= 0),
  priority         priority_level not null default 'normal',
  secure_disposal  boolean not null default false,
  status           request_status not null default 'pending',
  notes            text,
  proof_image_url  text,
  completion_notes text,
  created_by       uuid not null references profiles(id),
  assigned_to      uuid references profiles(id),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  completed_at     timestamptz
);

-- ── REQUEST LOGS (audit trail) ─────────────────────────────
create table request_logs (
  id           uuid primary key default uuid_generate_v4(),
  request_id   uuid not null references pickup_requests(id) on delete cascade,
  action       text not null,
  old_status   request_status,
  new_status   request_status,
  performed_by uuid references profiles(id),
  notes        text,
  created_at   timestamptz default now()
);

-- ── UPDATED_AT TRIGGER ─────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

create trigger trg_requests_updated_at
  before update on pickup_requests
  for each row execute function update_updated_at();

-- ── AUTO LOG ON STATUS CHANGE ──────────────────────────────
create or replace function log_status_change()
returns trigger language plpgsql security definer as $$
begin
  if old.status is distinct from new.status then
    insert into request_logs (request_id, action, old_status, new_status, performed_by)
    values (new.id, 'status_changed', old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger trg_log_status
  after update on pickup_requests
  for each row execute function log_status_change();

-- ── AUTO CREATE PROFILE ON SIGNUP ─────────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'department_user')
  );
  return new;
end;
$$;

create trigger trg_new_user
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── ROW LEVEL SECURITY ─────────────────────────────────────
alter table profiles         enable row level security;
alter table departments      enable row level security;
alter table pickup_requests  enable row level security;
alter table request_logs     enable row level security;

-- helper: current user role
create or replace function current_role_is(r user_role)
returns boolean language sql security definer as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = r
  );
$$;

-- PROFILES policies
create policy "Users read own profile"
  on profiles for select using (id = auth.uid());

create policy "Managers read all profiles"
  on profiles for select using (current_role_is('facility_manager'));

create policy "Staff read all profiles"
  on profiles for select using (current_role_is('facility_staff'));

create policy "Users update own profile"
  on profiles for update using (id = auth.uid());

-- DEPARTMENTS policies (all authenticated can read)
create policy "Authenticated read departments"
  on departments for select using (auth.role() = 'authenticated');

-- PICKUP REQUESTS policies
create policy "Department users read own requests"
  on pickup_requests for select
  using (created_by = auth.uid());

create policy "Staff read all requests"
  on pickup_requests for select
  using (current_role_is('facility_staff') or current_role_is('facility_manager'));

create policy "Department users create requests"
  on pickup_requests for insert
  with check (auth.role() = 'authenticated');

create policy "Creator can update own pending request"
  on pickup_requests for update
  using (created_by = auth.uid() and status = 'pending');

create policy "Staff can update any request"
  on pickup_requests for update
  using (current_role_is('facility_staff') or current_role_is('facility_manager'));

-- REQUEST LOGS policies
create policy "Read own request logs"
  on request_logs for select
  using (
    exists (select 1 from pickup_requests r where r.id = request_id and r.created_by = auth.uid())
    or current_role_is('facility_staff')
    or current_role_is('facility_manager')
  );

-- ── STORAGE BUCKET ─────────────────────────────────────────
-- Run this separately in Supabase Dashboard → Storage
-- insert into storage.buckets (id, name, public) values ('proof-images', 'proof-images', false);

-- ── INDEXES ────────────────────────────────────────────────
create index idx_requests_status      on pickup_requests(status);
create index idx_requests_department  on pickup_requests(department_id);
create index idx_requests_created_by  on pickup_requests(created_by);
create index idx_requests_assigned_to on pickup_requests(assigned_to);
create index idx_logs_request_id      on request_logs(request_id);

