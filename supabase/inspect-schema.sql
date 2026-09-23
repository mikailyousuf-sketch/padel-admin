-- Read-only metadata review. Run the whole query in Supabase SQL Editor.
-- Export/download its single result as CSV and share the file.
-- Does not select customer records, passwords, API keys, or stored file contents.
with sections as (
  select 'columns' as section, coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) as details
  from (
    select table_schema, table_name, column_name, data_type, udt_name,
           is_nullable, column_default, ordinal_position
    from information_schema.columns
    where table_schema = 'public'
       or (table_schema = 'storage' and table_name in ('objects', 'buckets'))
    order by table_schema, table_name, ordinal_position
  ) x
  union all
  select 'policies', coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
  from (
    select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    from pg_policies where schemaname in ('public', 'storage')
    order by schemaname, tablename, policyname
  ) x
  union all
  select 'row_security', coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
  from (
    select n.nspname as schema_name, c.relname as table_name,
           c.relrowsecurity as enabled, c.relforcerowsecurity as forced,
           pg_get_userbyid(c.relowner) as owner
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('public', 'storage') and c.relkind in ('r', 'p')
    order by n.nspname, c.relname
  ) x
  union all
  select 'table_grants', coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
  from (
    select grantee, table_schema, table_name, privilege_type
    from information_schema.table_privileges
    where table_schema in ('public', 'storage')
    order by table_schema, table_name, grantee, privilege_type
  ) x
  union all
  select 'column_grants', coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
  from (
    select grantee, table_schema, table_name, column_name, privilege_type
    from information_schema.column_privileges
    where table_schema = 'public'
      and table_name in ('profiles', 'user_permissions', 'club_assignments', 'event_quotes')
    order by table_name, column_name, grantee, privilege_type
  ) x
  union all
  select 'constraints', coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
  from (
    select n.nspname as schema_name, c.relname as table_name,
           k.conname as constraint_name, pg_get_constraintdef(k.oid) as definition
    from pg_constraint k join pg_class c on c.oid = k.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
    order by c.relname, k.conname
  ) x
  union all
  select 'triggers', coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
  from (
    select n.nspname as schema_name, c.relname as table_name,
           t.tgname as trigger_name, t.tgenabled as enabled,
           pg_get_triggerdef(t.oid) as definition,
           pg_get_functiondef(t.tgfoid) as function_definition
    from pg_trigger t join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and not t.tgisinternal
    order by c.relname, t.tgname
  ) x
  union all
  select 'access_functions', coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
  from (
    select n.nspname as schema_name, p.proname,
           pg_get_userbyid(p.proowner) as owner, p.proacl as grants,
           pg_get_functiondef(p.oid) as definition
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f'
      and p.proname in ('is_hoo', 'has_permission', 'has_club_access')
    order by p.proname, p.oid
  ) x
)
select jsonb_object_agg(section, details) as schema_review from sections;
