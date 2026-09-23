begin;
create table public.ai_request_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  requests integer not null
);
alter table public.ai_request_limits enable row level security;
revoke all on public.ai_request_limits from anon, authenticated;
create or replace function public.consume_ai_request() returns boolean
language plpgsql security definer set search_path = '' as $$
declare used integer;
begin
  if auth.uid() is null then return false; end if;
  insert into public.ai_request_limits as limits(user_id, window_start, requests)
  values(auth.uid(), date_trunc('minute', now()), 1)
  on conflict(user_id) do update set
    window_start = date_trunc('minute', now()),
    requests = case when limits.window_start = date_trunc('minute', now()) then limits.requests + 1 else 1 end
  returning requests into used;
  return used <= 5;
end;
$$;
revoke all on function public.consume_ai_request() from public, anon;
grant execute on function public.consume_ai_request() to authenticated;
commit;
