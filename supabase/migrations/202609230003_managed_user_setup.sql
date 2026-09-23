begin;
-- One transaction prevents profiles, club assignments and permissions diverging.
-- Only the server's service role may call this after its HOO check.
create or replace function public.configure_managed_user(
  p_user_id uuid, p_full_name text, p_email text, p_is_hoo boolean,
  p_club_ids uuid[], p_permissions text[]
) returns void language plpgsql security invoker set search_path = '' as $$
begin
  insert into public.profiles(id, full_name, email, is_hoo)
  values(p_user_id, p_full_name, p_email, p_is_hoo)
  on conflict(id) do update set full_name=excluded.full_name, email=excluded.email, is_hoo=excluded.is_hoo;
  insert into public.club_assignments(user_id, club_id)
  select p_user_id, id from unnest(p_club_ids) as id on conflict do nothing;
  insert into public.user_permissions(user_id, permission_key)
  select p_user_id, key from unnest(p_permissions) as key on conflict do nothing;
end;
$$;
revoke all on function public.configure_managed_user(uuid,text,text,boolean,uuid[],text[]) from public, anon, authenticated;
grant execute on function public.configure_managed_user(uuid,text,text,boolean,uuid[],text[]) to service_role;
commit;
