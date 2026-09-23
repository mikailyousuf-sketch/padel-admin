begin;
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('invoice-proofs', 'invoice-proofs', false, 5242880, array['application/pdf', 'image/png', 'image/jpeg'])
on conflict(id) do nothing;
create policy invoice_proofs_read on storage.objects for select to authenticated using (
  bucket_id = 'invoice-proofs' and (exists (
    select 1 from public.event_quotes q where q.pop_url = name and public.can_access_reporting_club(q.club_id)
  ) or (owner_id = auth.uid()::text and not exists(select 1 from public.event_quotes q where q.pop_url = name)))
);
create policy invoice_proofs_upload on storage.objects for insert to authenticated with check (
  bucket_id = 'invoice-proofs' and exists (
    select 1 from public.event_quotes q where q.id::text = (storage.foldername(name))[2]
      and q.club_id::text = (storage.foldername(name))[1] and public.can_access_reporting_club(q.club_id)
  )
);
create policy invoice_proofs_cleanup on storage.objects for delete to authenticated using (
  bucket_id = 'invoice-proofs' and owner_id = auth.uid()::text
    and not exists(select 1 from public.event_quotes q where q.pop_url = name)
);
commit;
