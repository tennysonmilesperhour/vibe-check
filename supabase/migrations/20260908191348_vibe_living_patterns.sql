-- Additive Vibe Check changes; existing account history remains intact.
alter table public.daily_check_ins add column if not exists stress_context jsonb not null default '{}'::jsonb;

create table public.vibe_journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  occurred_at timestamptz,
  kind text not null default 'reflection' check (kind in ('reflection', 'interaction')),
  notes text not null default '',
  mood_score numeric check (mood_score between 1 and 10),
  emotions text[] not null default '{}',
  activities text[] not null default '{}',
  person_ids uuid[] not null default '{}',
  stress_context jsonb not null default '{}'::jsonb check (jsonb_typeof(stress_context) = 'object'),
  interaction_feeling text check (interaction_feeling in ('supportive','strained','unsafe','mixed','unsure')),
  boundary_respected text check (boundary_respected in ('yes','no','unsure')),
  is_draft boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vibe_practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  practice_id text not null,
  state_id text not null,
  status text not null default 'completed' check (status in ('completed','stopped')),
  intention text not null default '',
  before_notes text not null default '',
  after_notes text not null default '',
  outcome text check (outcome in ('Clearer','More connected','More able to begin','More settled','About the same','More uncomfortable')),
  alignment text check (alignment in ('aligned','mixed','not-aligned','unsure')),
  source_pattern text,
  source_entry_keys text[] not null default '{}',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vibe_report_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_type text not null check (period_type in ('weekly','monthly')),
  period_key date not null,
  notes text not null default '',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, period_type, period_key)
);

create table public.vibe_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  values jsonb not null default '{}'::jsonb check (jsonb_typeof(values) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vibe_checkin_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create index vibe_journal_user_date on public.vibe_journal_entries(user_id, date desc, id);
create index vibe_sessions_user_date on public.vibe_practice_sessions(user_id, date desc, id);

do $$
declare t text;
begin
  foreach t in array array['vibe_journal_entries','vibe_practice_sessions','vibe_report_reflections','vibe_preferences','vibe_checkin_drafts'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
    execute format('create policy "owner select" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "owner insert" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "owner update" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "owner delete" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;
