begin;

-- RLS does not protect TRUNCATE. Application roles need row operations only.
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('revoke truncate, trigger on table public.%I from anon, authenticated, public', t.tablename);
  end loop;
end $$;

-- Keep self-service profile edits while protecting authorization and identity.
-- SECURITY INVOKER preserves the actual database role for trusted maintenance.
create or replace function public.guard_profile_authority()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if current_user not in ('postgres', 'supabase_admin', 'service_role') then
    if new.id is distinct from old.id then
      raise exception 'Profile identity cannot be changed' using errcode = '42501';
    end if;
    if new.is_hoo is distinct from old.is_hoo
       and not coalesce(public.is_hoo(auth.uid()), false) then
      raise exception 'Only Head of Operations can change this role' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.guard_profile_authority() from public, anon, authenticated;
create trigger protect_profile_authority
before update on public.profiles
for each row execute function public.guard_profile_authority();

commit;
