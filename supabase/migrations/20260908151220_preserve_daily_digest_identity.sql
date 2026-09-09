-- Apply Daily Digest's daily_digest_shared_backend migration first.
-- Keep the existing helper name so deployed deletion RPCs continue to work.
create or replace function vibe_private.has_campground_data(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.camp_agents where user_id = p_user)
    or exists(select 1 from public.camp_skills where user_id = p_user)
    or exists(select 1 from public.camp_trades where offerer_user_id = p_user or receiver_user_id = p_user)
    or exists(select 1 from public.camp_reports where user_id = p_user)
    or exists(select 1 from public.digest_profiles where id = p_user)
    or exists(select 1 from storage.objects
      where bucket_id = 'digest-evidence' and (storage.foldername(name))[1] = p_user::text)
$$;
revoke all on function vibe_private.has_campground_data(uuid) from public, anon, authenticated;

create or replace function vibe_private.protect_shared_identity() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if vibe_private.has_campground_data(old.id) then
    raise exception 'This sign-in still owns data in another app. Delete only the requesting app data.';
  end if;
  return old;
end;
$$;
revoke all on function vibe_private.protect_shared_identity() from public, anon, authenticated;
