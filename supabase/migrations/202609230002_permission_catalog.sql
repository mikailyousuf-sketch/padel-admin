begin;
-- Register keys used by existing policies. Existing accounts are unchanged.
insert into public.permissions(key, description) values
  ('manage_hr_finance', 'Manage staff records, leave, incidents and staff compensation'),
  ('manage_infrastructure', 'Manage maintenance requests and club upgrades')
on conflict (key) do nothing;
commit;
