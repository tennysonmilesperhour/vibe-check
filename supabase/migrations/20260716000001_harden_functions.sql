-- Security-advisor hardening (2026-07-16):
--  1. set_updated_at ran with a role-mutable search_path.
--  2. handle_new_user is SECURITY DEFINER but was executable by anon and
--     authenticated via PostgREST RPC; it only ever runs from the
--     on_auth_user_created trigger, so nobody else needs EXECUTE.

create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end $$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
