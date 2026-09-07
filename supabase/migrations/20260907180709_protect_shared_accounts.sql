-- Run after Campground's shared_campground migration on the shared project.
create schema if not exists vibe_private;
revoke all on schema vibe_private from public, anon;
grant usage on schema vibe_private to authenticated;

create function vibe_private.has_campground_data(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.camp_agents where user_id = p_user)
    or exists(select 1 from public.camp_skills where user_id = p_user)
    or exists(select 1 from public.camp_trades where offerer_user_id = p_user or receiver_user_id = p_user)
    or exists(select 1 from public.camp_reports where user_id = p_user)
$$;
revoke all on function vibe_private.has_campground_data(uuid) from public, anon, authenticated;

-- A concurrent Campground save must never be lost to account deletion.
create function vibe_private.protect_shared_identity() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if vibe_private.has_campground_data(old.id) then
    raise exception 'This sign-in still owns Campground data. Delete only the requesting app data.';
  end if;
  return old;
end;
$$;
revoke all on function vibe_private.protect_shared_identity() from public, anon, authenticated;
create trigger protect_shared_identity before delete on auth.users
  for each row execute function vibe_private.protect_shared_identity();

create function vibe_private.delete_vibe_data() returns boolean
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Sign in first'; end if;
  perform 1 from auth.users where id = uid for update;
  delete from public.daily_check_ins where user_id = uid;
  delete from public.people where user_id = uid;
  delete from public.readings where user_id = uid;
  delete from public.boundary_alerts where user_id = uid;
  delete from public.healing_progress where user_id = uid;
  delete from public.cosmic_wisdom where user_id = uid;
  delete from public.ai_usage where user_id = uid;
  delete from public.profiles where id = uid;
  return vibe_private.has_campground_data(uid);
end;
$$;
revoke all on function vibe_private.delete_vibe_data() from public, anon;
grant execute on function vibe_private.delete_vibe_data() to authenticated;
create function public.vibe_delete_data() returns boolean
language sql security invoker set search_path = '' as $$
  select vibe_private.delete_vibe_data()
$$;
revoke all on function public.vibe_delete_data() from public, anon;
grant execute on function public.vibe_delete_data() to authenticated;
