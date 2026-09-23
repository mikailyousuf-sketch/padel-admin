begin;
create table public.whatsapp_campaigns (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id),
  title text not null check(length(title) between 1 and 100),
  kind text not null check(kind in ('availability','event')),
  template text not null check(length(template) between 1 and 2000),
  destination_label text not null check(length(destination_label) between 1 and 120),
  schedule jsonb not null,
  media_path text,
  status text not null default 'draft' check(status in ('draft','paused')),
  created_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now()
);
alter table public.whatsapp_campaigns enable row level security;
revoke all on public.whatsapp_campaigns from public, anon, authenticated;
grant select,insert,update on public.whatsapp_campaigns to authenticated;
create policy whatsapp_read on public.whatsapp_campaigns for select to authenticated
  using(public.can_access_reporting_club(club_id));
create policy whatsapp_insert on public.whatsapp_campaigns for insert to authenticated
  with check(public.can_access_reporting_club(club_id) and created_by=auth.uid());
create policy whatsapp_update on public.whatsapp_campaigns for update to authenticated
  using(public.can_access_reporting_club(club_id))
  with check(public.can_access_reporting_club(club_id));

create table public.whatsapp_campaign_history (
  id bigint generated always as identity primary key,
  campaign_id uuid not null references public.whatsapp_campaigns(id),
  club_id uuid not null references public.clubs(id),
  actor_id uuid,
  changed_at timestamptz not null default now(),
  before_data jsonb,
  after_data jsonb not null
);
alter table public.whatsapp_campaign_history enable row level security;
revoke all on public.whatsapp_campaign_history from public, anon, authenticated;
grant select on public.whatsapp_campaign_history to authenticated;
create policy whatsapp_history_read on public.whatsapp_campaign_history for select to authenticated
  using(public.can_access_reporting_club(club_id));
create function public.audit_whatsapp_campaign() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if TG_OP='UPDATE' and (new.club_id<>old.club_id or new.created_by<>old.created_by) then
    raise exception 'Campaign club and creator cannot be changed';
  end if;
  new.updated_at=clock_timestamp();
  return new;
end $$;
create trigger whatsapp_campaign_guard before update on public.whatsapp_campaigns for each row execute function public.audit_whatsapp_campaign();
create function public.record_whatsapp_campaign() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.whatsapp_campaign_history(campaign_id,club_id,actor_id,before_data,after_data)
 values(new.id,new.club_id,auth.uid(),case when TG_OP='UPDATE' then to_jsonb(old) else null end,to_jsonb(new));
 return new;
end $$;
create trigger whatsapp_campaign_audit after insert or update on public.whatsapp_campaigns for each row execute function public.record_whatsapp_campaign();
revoke all on function public.audit_whatsapp_campaign(), public.record_whatsapp_campaign() from public,anon,authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('whatsapp-media','whatsapp-media',false,5242880,array['image/jpeg','image/png']) on conflict(id) do nothing;
create policy whatsapp_media_read on storage.objects for select to authenticated
using(bucket_id='whatsapp-media' and exists(select 1 from public.clubs c where c.id::text=(storage.foldername(name))[1] and public.can_access_reporting_club(c.id)));
create policy whatsapp_media_insert on storage.objects for insert to authenticated
with check(bucket_id='whatsapp-media' and owner_id=auth.uid()::text and exists(select 1 from public.clubs c where c.id::text=(storage.foldername(name))[1] and public.can_access_reporting_club(c.id)));
commit;
