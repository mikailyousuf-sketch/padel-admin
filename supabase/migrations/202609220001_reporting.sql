-- Additive migration. Requires existing clubs(id uuid), profiles,
-- club_assignments(user_id, club_id), user_permissions(user_id, permission_key).
-- Review and apply in staging before production; this does not alter their RLS.
begin;

create or replace function public.can_access_reporting_club(p_club_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (select 1 from public.clubs where id = p_club_id)
    and (exists (select 1 from public.profiles where id = auth.uid() and is_hoo = true)
      or exists (select 1 from public.club_assignments where user_id = auth.uid() and club_id = p_club_id)
      or exists (select 1 from public.user_permissions where user_id = auth.uid() and permission_key = 'all_clubs_access'));
$$;
revoke all on function public.can_access_reporting_club(uuid) from public, anon;
grant execute on function public.can_access_reporting_club(uuid) to authenticated;

create or replace function public.list_reporting_clubs()
returns table(id uuid, name text) language sql stable security definer set search_path = '' as $$
  select c.id, c.name from public.clubs c where public.can_access_reporting_club(c.id) order by c.name;
$$;
revoke all on function public.list_reporting_clubs() from public, anon;
grant execute on function public.list_reporting_clubs() to authenticated;

create table public.reporting_imports (
  id uuid primary key,
  club_id uuid not null references public.clubs(id),
  club_name text not null,
  imported_by uuid not null references auth.users(id),
  imported_at timestamptz not null default now(),
  source_name text not null check (length(source_name) between 1 and 200),
  source_sha256 text not null check (source_sha256 ~ '^[a-f0-9]{64}$'),
  workbook_path text not null unique,
  rows jsonb not null check (jsonb_typeof(rows) = 'array' and jsonb_array_length(rows) between 1 and 3100)
);
create index reporting_imports_club_date on public.reporting_imports(club_id, imported_at desc);

create table public.reporting_daily (
  club_id uuid not null references public.clubs(id),
  report_date date not null,
  import_id uuid not null references public.reporting_imports(id),
  courts jsonb not null check (jsonb_typeof(courts) = 'array'),
  updated_at timestamptz not null default now(),
  primary key (club_id, report_date)
);
alter table public.reporting_imports enable row level security;
alter table public.reporting_daily enable row level security;
create policy reporting_imports_read on public.reporting_imports for select to authenticated using (public.can_access_reporting_club(club_id));
create policy reporting_daily_read on public.reporting_daily for select to authenticated using (public.can_access_reporting_club(club_id));
revoke all on public.reporting_imports, public.reporting_daily from anon, authenticated;
grant select on public.reporting_imports, public.reporting_daily to authenticated;

-- One transaction per upload. Lock the club to prevent concurrent imports from
-- silently overwriting each other. Every correction retains the original import.
create or replace function public.save_reporting_import(
  p_id uuid, p_club_id uuid, p_source_name text, p_sha256 text,
  p_rows jsonb, p_expected jsonb, p_replace boolean
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  r record;
  day_row record;
  n integer;
  current_id uuid;
  club_name text;
  today date := (now() at time zone 'Africa/Johannesburg')::date;
begin
  if not public.can_access_reporting_club(p_club_id) then raise exception 'Club access denied'; end if;
  if jsonb_typeof(p_rows) is distinct from 'array' or jsonb_array_length(p_rows) not between 1 and 3100 then raise exception 'Invalid report rows'; end if;
  if exists(select 1 from jsonb_array_elements(p_rows) where jsonb_typeof(value) is distinct from 'object' or not coalesce((value->>'report_date') ~ '^\d{4}-\d{2}-\d{2}$', false)) then raise exception 'Dates must use YYYY-MM-DD'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_club_id::text, 0));
  select name into club_name from public.clubs where id = p_club_id;
  select court_count into n from public.club_config where club_id = p_club_id;
  if n is null or n not between 1 and 100 then raise exception 'Configure court count first'; end if;
  if (select count(distinct value->>'report_date') from jsonb_array_elements(p_rows)) > 31 then raise exception 'Maximum 31 dates per import'; end if;
  for r in select * from jsonb_to_recordset(p_rows) as x(report_date date, court_number integer, available_minutes integer, booked_minutes integer, peak_available_minutes integer, peak_booked_minutes integer, net_revenue_cents bigint, games integer, player_visits integer) loop
    if r.report_date is null or r.report_date < '2000-01-01'::date or r.report_date > today
      or r.court_number is null or r.court_number not between 1 and n
      or r.available_minutes is null or r.available_minutes not between 0 and 1440
      or r.booked_minutes is null or r.booked_minutes not between 0 and r.available_minutes
      or r.peak_available_minutes is null or r.peak_available_minutes not between 0 and r.available_minutes
      or r.peak_booked_minutes is null or r.peak_booked_minutes not between 0 and least(r.peak_available_minutes, r.booked_minutes)
      or r.booked_minutes-r.peak_booked_minutes > r.available_minutes-r.peak_available_minutes
      or r.net_revenue_cents is null or abs(r.net_revenue_cents) > 1000000000
      or r.games is null or r.games not between 0 and 10000
      or r.player_visits is null or r.player_visits not between 0 and 100000
      then raise exception 'Invalid court-day values'; end if;
  end loop;
  for day_row in select value->>'report_date' as d, count(*) as c, count(distinct (value->>'court_number')::integer) as courts from jsonb_array_elements(p_rows) group by 1 loop
    if day_row.c <> n or day_row.courts <> n then raise exception 'Include every court exactly once per date'; end if;
    current_id := null;
    select import_id into current_id from public.reporting_daily where club_id = p_club_id and report_date = day_row.d::date;
    if current_id is not null and not coalesce(p_replace, false) then raise exception 'These dates already have reports. Confirm replacement to continue.'; end if;
    if current_id::text is distinct from (p_expected->>day_row.d) then raise exception 'Reports changed during upload. Refresh and try again.'; end if;
  end loop;
  if not exists(select 1 from storage.objects where bucket_id = 'report-archive' and name = p_club_id::text || '/' || p_id::text || '.xlsx' and owner_id = auth.uid()::text) then raise exception 'Upload the workbook before saving the report'; end if;
  insert into public.reporting_imports(id, club_id, club_name, imported_by, source_name, source_sha256, workbook_path, rows)
    values(p_id, p_club_id, club_name, auth.uid(), p_source_name, p_sha256, p_club_id::text || '/' || p_id::text || '.xlsx', p_rows);
  insert into public.reporting_daily(club_id, report_date, import_id, courts)
    select p_club_id, (value->>'report_date')::date, p_id, jsonb_agg(value order by (value->>'court_number')::integer)
    from jsonb_array_elements(p_rows) group by (value->>'report_date')::date
    on conflict (club_id, report_date) do update set import_id = excluded.import_id, courts = excluded.courts, updated_at = now();
  return p_id;
end;
$$;
revoke all on function public.save_reporting_import(uuid, uuid, text, text, jsonb, jsonb, boolean) from public, anon;
grant execute on function public.save_reporting_import(uuid, uuid, text, text, jsonb, jsonb, boolean) to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('report-archive', 'report-archive', false, 5242880, array['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do nothing;
create policy report_archive_read on storage.objects for select to authenticated using (
  bucket_id = 'report-archive' and (exists (
    select 1 from public.reporting_imports i where i.workbook_path = name and public.can_access_reporting_club(i.club_id)
  ) or (owner_id = auth.uid()::text and not exists(select 1 from public.reporting_imports i where i.workbook_path = name)))
);
create policy report_archive_upload on storage.objects for insert to authenticated with check (
  bucket_id = 'report-archive' and (storage.foldername(name))[1] ~ '^[a-f0-9-]{36}$'
  and public.can_access_reporting_club(((storage.foldername(name))[1])::uuid)
);
-- Cleanup only for a caller's unfinished upload. Archived revisions are immutable.
create policy report_archive_cleanup on storage.objects for delete to authenticated using (
  bucket_id = 'report-archive' and owner_id = auth.uid()::text
  and not exists (select 1 from public.reporting_imports i where i.workbook_path = name)
);
commit;
