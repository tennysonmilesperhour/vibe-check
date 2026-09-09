-- Transactional verification using generated fixtures only. Never commit these rows.
do $$
declare
  camp_uid uuid := gen_random_uuid();
  digest_uid uuid := gen_random_uuid();
  single_uid uuid := gen_random_uuid();
  other_uid uuid := gen_random_uuid();
  uid uuid;
  retained boolean;
  n bigint;
  t text;
begin
  begin
  foreach uid in array array[camp_uid,digest_uid,single_uid,other_uid] loop
    insert into auth.users(id,aud,role,email,created_at,updated_at)
      values(uid,'authenticated','authenticated',uid::text || '@deletion-test.example.invalid',now(),now());
    insert into public.profiles(id,full_name) values(uid,'Deletion verification') on conflict(id) do nothing;
    insert into public.vibe_journal_entries(user_id,date,notes) values(uid,current_date,'Temporary verification');
    insert into public.vibe_practice_sessions(user_id,date,practice_id,state_id) values(uid,current_date,'orient','on-edge');
    insert into public.vibe_report_reflections(user_id,period_type,period_key) values(uid,'weekly',current_date);
    insert into public.vibe_preferences(user_id) values(uid);
    insert into public.vibe_checkin_drafts(user_id,date) values(uid,current_date);
    insert into public.daily_check_ins(user_id,date,mood_score) values(uid,current_date,5);
    insert into public.people(user_id,name) values(uid,'Verification person');
  end loop;
  insert into public.camp_agents(user_id,name,current_project) values(camp_uid,'Verification','Temporary');
  insert into public.digest_profiles(id,byline) values(digest_uid,'Verification');

  if has_function_privilege('anon','public.vibe_delete_data()','execute') then
    raise exception 'Anonymous role can execute deletion';
  end if;
  foreach uid in array array[camp_uid,digest_uid,single_uid] loop
    perform set_config('request.jwt.claim.sub',uid::text,true);
    perform set_config('request.jwt.claims',jsonb_build_object('sub',uid,'role','authenticated')::text,true);
    set local role authenticated;
    retained := public.vibe_delete_data();
    reset role;
    if retained is distinct from (uid <> single_uid) then raise exception 'Wrong shared-identity result'; end if;
    foreach t in array array['vibe_journal_entries','vibe_practice_sessions','vibe_report_reflections','vibe_preferences','vibe_checkin_drafts','daily_check_ins','people'] loop
      execute format('select count(*) from public.%I where user_id=$1',t) into n using uid;
      if n <> 0 then raise exception 'Caller rows remain in %',t; end if;
      execute format('select count(*) from public.%I where user_id=$1',t) into n using other_uid;
      if n <> 1 then raise exception 'Other user rows changed in %',t; end if;
    end loop;
    if exists(select 1 from public.profiles where id=uid) then raise exception 'Caller profile remains'; end if;
  end loop;
  if not exists(select 1 from public.camp_agents where user_id=camp_uid) then raise exception 'Campground data lost'; end if;
  if not exists(select 1 from public.digest_profiles where id=digest_uid) then raise exception 'Daily Digest data lost'; end if;
  foreach uid in array array[camp_uid,digest_uid] loop
    begin
      delete from auth.users where id=uid;
      raise exception 'Shared identity was deleted';
    exception when raise_exception then
      if sqlerrm <> 'This sign-in still owns data in another app. Delete only the requesting app data.' then raise; end if;
    end;
  end loop;
  -- A stale token with no auth identity must not run privileged deletion.
  perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
  set local role authenticated;
  begin
    perform public.vibe_delete_data();
    raise exception 'Missing auth identity was accepted';
  exception when raise_exception then
    if sqlerrm <> 'Sign in first' then raise; end if;
  end;
  reset role;
  raise exception 'verification_passed_rollback';
  exception when raise_exception then
    if sqlerrm <> 'verification_passed_rollback' then raise; end if;
  end;
end;
$$;
select 'Caller deletion, cross-account isolation, shared identity guards, and stale-token rejection passed; fixtures rolled back.' as verification;
