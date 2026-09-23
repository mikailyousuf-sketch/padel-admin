const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const { PGlite } = require('@electric-sql/pglite')

test('profile guard blocks self-promotion while preserving profile edits and HOO administration', async () => {
  const db = new PGlite()
  try {
    await db.exec(`
      create role authenticated; create role anon; create role service_role bypassrls;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to authenticated;
      create table profiles(id uuid primary key, full_name text, is_hoo boolean not null default false);
      create function public.is_hoo(p_user_id uuid) returns boolean language sql stable security definer as $$
        select coalesce((select is_hoo from public.profiles where id=p_user_id),false) $$;
      alter table profiles enable row level security;
      create policy profiles_select_own_or_hoo on profiles for select using(id=auth.uid() or is_hoo(auth.uid()));
      create policy profiles_update_own on profiles for update using(id=auth.uid() or is_hoo(auth.uid()));
      grant all on profiles to authenticated, anon;
      insert into profiles values
        ('11111111-1111-4111-8111-111111111111','Manager',false),
        ('22222222-2222-4222-8222-222222222222','HOO',true);
      set role authenticated;
      select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
      update profiles set is_hoo=true where id=auth.uid();
    `)
    assert.equal((await db.query('select is_hoo(auth.uid()) as allowed')).rows[0].allowed, true, 'reproduces original escalation')
    await db.exec(`reset role; update profiles set is_hoo=false where full_name='Manager';`)
    await db.exec(fs.readFileSync('supabase/migrations/202609230001_profile_security.sql','utf8'))
    await db.exec('set role authenticated')
    await assert.rejects(db.exec('update profiles set is_hoo=true where id=auth.uid()'), /Only Head of Operations/)
    await assert.rejects(db.exec("update profiles set id='33333333-3333-4333-8333-333333333333' where id=auth.uid()"), /identity cannot/)
    await db.exec("update profiles set full_name='Updated' where id=auth.uid()")
    assert.equal((await db.query('select full_name from profiles')).rows[0].full_name,'Updated')
    await assert.rejects(db.exec('truncate profiles'), /permission denied/)
    assert.equal((await db.query("select has_table_privilege('authenticated','profiles','TRIGGER') as allowed")).rows[0].allowed,false)
    await db.exec("select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false)")
    await db.exec("update profiles set is_hoo=true where full_name='Updated'")
    assert.equal((await db.query("select is_hoo from profiles where full_name='Updated'")).rows[0].is_hoo,true)
  } finally { await db.close() }
})
