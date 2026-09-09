-- Server-side quota shared by every AI-backed feature. The ledger is not
-- directly writable through PostgREST; authenticated users can only claim a
-- slot through the SECURITY DEFINER function below.
create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  feature text not null check (char_length(feature) between 1 and 64),
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_user_created
  on public.ai_usage (user_id, created_at desc);

alter table public.ai_usage enable row level security;

create or replace function public.claim_ai_request(p_feature text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  requesting_user uuid := auth.uid();
  used_today integer;
begin
  if requesting_user is null then
    return false;
  end if;

  if p_feature is null or char_length(p_feature) not between 1 and 64 then
    raise exception 'Invalid AI feature name';
  end if;

  -- Serialize claims per user and UTC day so concurrent requests cannot step
  -- past the shared daily allowance.
  perform pg_advisory_xact_lock(
    hashtextextended(requesting_user::text || current_date::text, 0)
  );

  select count(*)
    into used_today
    from public.ai_usage
   where user_id = requesting_user
     and created_at >= date_trunc('day', now());

  if used_today >= 25 then
    return false;
  end if;

  insert into public.ai_usage (user_id, feature)
  values (requesting_user, p_feature);

  return true;
end;
$$;

revoke all on table public.ai_usage from public, anon, authenticated;
revoke execute on function public.claim_ai_request(text) from public, anon;
grant execute on function public.claim_ai_request(text) to authenticated;
