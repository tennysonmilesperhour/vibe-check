-- Extend the deployed app-scoped deletion without changing shared identity guards.
-- Requires the shared-account migrations and vibe_living_patterns.
create or replace function vibe_private.delete_vibe_data() returns boolean
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Sign in first'; end if;
  perform 1 from auth.users where id = uid for update;
  if not found then raise exception 'Sign in first'; end if;
  delete from public.vibe_checkin_drafts where user_id = uid;
  delete from public.vibe_journal_entries where user_id = uid;
  delete from public.vibe_practice_sessions where user_id = uid;
  delete from public.vibe_report_reflections where user_id = uid;
  delete from public.vibe_preferences where user_id = uid;
  delete from public.daily_check_ins where user_id = uid;
  delete from public.people where user_id = uid;
  delete from public.readings where user_id = uid;
  delete from public.boundary_alerts where user_id = uid;
  delete from public.healing_progress where user_id = uid;
  delete from public.cosmic_wisdom where user_id = uid;
  delete from public.ai_usage where user_id = uid;
  delete from public.profiles where id = uid;
  -- This existing guard includes both Campground and Daily Digest ownership.
  return vibe_private.has_campground_data(uid);
end;
$$;
revoke all on function vibe_private.delete_vibe_data() from public, anon;
grant execute on function vibe_private.delete_vibe_data() to authenticated;
