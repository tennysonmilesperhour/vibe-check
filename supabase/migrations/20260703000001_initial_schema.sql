-- VibeCheck initial schema: one table per former Base44 entity,
-- per-user row-level security throughout.
-- Conventions: snake_case, uuid PKs, user_id -> auth.users, timestamptz audit columns.

create extension if not exists "pgcrypto";
-- ── profiles: the former Base44 user object's app-owned fields ──
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  cosmic_profile jsonb,
  boundary_settings jsonb,
  people_migrated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- ── daily_check_ins ──
create table public.daily_check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  mood_score numeric check (mood_score between 1 and 10),
  energy_level numeric check (energy_level between 1 and 10),
  sleep_quality numeric check (sleep_quality between 1 and 10),
  emotions text[] not null default '{}',
  activities text[] not null default '{}',
  high_moment jsonb,
  low_moment jsonb,
  gratitude text,
  notes text,
  moon_phase text,
  personal_day numeric,
  person_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);
-- ── people (merged Relationship + Connection) ──
create table public.people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  person_type text not null default 'friend',
  linked_user_email text,
  cosmic_snapshot jsonb,
  snapshot_updated_at timestamptz,
  qualities text[] not null default '{}',
  concerns text[] not null default '{}',
  boundary_notes text,
  synergy_reading text,
  synergy_generated_at timestamptz,
  legacy_names text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- ── readings (tarot / oracle) ──
create table public.readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  deck text not null check (deck in ('tarot', 'oracle')),
  spread text not null,
  question text,
  cards jsonb not null default '[]',
  interpretation text,
  linked_checkin_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- ── boundary_alerts ──
create table public.boundary_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  alert_type text not null,
  date date,
  severity text,
  message text,
  is_acknowledged boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- ── healing_progress ──
create table public.healing_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text,
  title text,
  description text,
  progress_level numeric not null default 0,
  reflection_notes text,
  milestones jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- ── cosmic_wisdom (AI wisdom + weather cache) ──
create table public.cosmic_wisdom (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  period_type text not null check (period_type in ('daily','weekly','monthly','yearly','weather')),
  period_key text not null,
  systems_key text,
  wisdom text,
  theme text,
  contemplation text,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, period_type, period_key, systems_key)
);
-- ── indexes for the app's access patterns ──
create index daily_check_ins_user_date on public.daily_check_ins (user_id, date desc);
create index people_user on public.people (user_id);
create index readings_user_date on public.readings (user_id, date desc);
create index boundary_alerts_user_created on public.boundary_alerts (user_id, created_at desc);
create index healing_progress_user on public.healing_progress (user_id);
create index cosmic_wisdom_lookup on public.cosmic_wisdom (user_id, period_type, period_key);
-- ── updated_at maintenance ──
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
do $$
declare t text;
begin
  foreach t in array array['profiles','daily_check_ins','people','readings','boundary_alerts','healing_progress','cosmic_wisdom']
  loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;
-- ── auto-create a profile row on signup ──
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
-- ── row-level security: every row belongs to its user ──
do $$
declare t text;
begin
  foreach t in array array['daily_check_ins','people','readings','boundary_alerts','healing_progress','cosmic_wisdom']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows select" on public.%I for select using (auth.uid() = user_id)', t);
    execute format('create policy "own rows insert" on public.%I for insert with check (auth.uid() = user_id)', t);
    execute format('create policy "own rows update" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format('create policy "own rows delete" on public.%I for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select using (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
