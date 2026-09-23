const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const { PGlite } = require('@electric-sql/pglite')
const clubA = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', clubB = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'
const userA = '11111111-1111-4111-8111-111111111111', userB = '22222222-2222-4222-8222-222222222222'
const importA = '33333333-3333-4333-8333-333333333333', importB = '44444444-4444-4444-8444-444444444444'
const rows = [{ report_date: '2026-01-01', court_number: 1, available_minutes: 600, booked_minutes: 300, peak_available_minutes: 300, peak_booked_minutes: 200, net_revenue_cents: 120050, games: 4, player_visits: 16 }]

test('database migrations, access rules and atomic corrections', async t => {
  const db = new PGlite()
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema public, auth, storage to authenticated, anon;
    grant execute on function auth.uid() to authenticated, anon;
    create table public.clubs(id uuid primary key, name text);
    create table public.permissions(key text primary key, description text);
    create table public.profiles(id uuid primary key, is_hoo boolean, full_name text, email text);
    create table public.club_assignments(user_id uuid, club_id uuid);
    create table public.user_permissions(user_id uuid, permission_key text);
    create table public.club_config(club_id uuid, court_count integer);
    create table public.event_quotes(id uuid primary key, club_id uuid, pop_url text);
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(), bucket_id text, name text, owner_id text);
    create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name,'/') $$;
    alter table storage.objects enable row level security;
    grant select,insert,delete on storage.objects to authenticated;
    grant select on public.event_quotes, public.clubs to authenticated;
    insert into auth.users values('${userA}'),('${userB}');
    insert into public.clubs values('${clubA}','Club A'),('${clubB}','Club B');
    insert into public.profiles(id,is_hoo) values('${userA}',false),('${userB}',false);
    insert into public.club_assignments values('${userA}','${clubA}'),('${userB}','${clubB}');
    insert into public.club_config values('${clubA}',1),('${clubB}',1);
  `)
  for (const file of fs.readdirSync('supabase/migrations').sort()) await db.exec(fs.readFileSync(`supabase/migrations/${file}`, 'utf8'))
  async function login(id) { await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub','${id}',false);`) }
  async function upload(id) { await db.query('insert into storage.objects(bucket_id,name,owner_id) values($1,$2,$3)', ['report-archive', `${clubA}/${id}.xlsx`, userA]) }
  async function save(id, expected = {}, replace = false, payload = rows, club = clubA) {
    return db.query('select public.save_reporting_import($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7)', [id, club, 'report.csv', 'a'.repeat(64), JSON.stringify(payload), JSON.stringify(expected), replace])
  }
  await login(userA)
  await t.test('requires stored workbook before committing figures', async () => { await assert.rejects(save(importA), /Upload the workbook/) })
  assert.deepEqual((await db.query('select * from list_reporting_clubs()')).rows.map(r => r.id), [clubA])
  await upload(importA)
  await t.test('valid upload becomes a daily report and immutable archive', async () => {
    await save(importA)
    const result = await db.query('select * from reporting_daily')
    assert.equal(result.rows.length, 1); assert.equal(result.rows[0].courts[0].net_revenue_cents, 120050)
    await assert.rejects(db.exec('delete from reporting_daily'), /permission denied/)
  })
  await t.test('another manager cannot read or replace club A reports', async () => {
    await login(userB)
    assert.equal((await db.query('select * from reporting_daily')).rows.length, 0)
    assert.equal((await db.query('select * from reporting_imports')).rows.length, 0)
    assert.equal((await db.query('select * from storage.objects')).rows.length, 0)
    await assert.rejects(save(importB, {}, true), /Club access denied/)
    await login(userA)
  })
  await upload(importB)
  await t.test('rejects duplicates, stale edits and invalid payloads atomically', async () => {
    await assert.rejects(save(importB), /already have reports/)
    await assert.rejects(save(importB, {}, true), /changed during upload/)
    await assert.rejects(save(importB, { '2026-01-01': importA }, true, [{ ...rows[0], booked_minutes: 700 }]), /Invalid court-day/)
    await assert.rejects(save(importB, { '2026-01-01': importA }, true, [{ ...rows[0], report_date: '2026-1-1' }]), /YYYY-MM-DD/)
    assert.equal((await db.query('select * from reporting_imports')).rows.length, 1)
  })
  await t.test('correction replaces totals without double counting and retains history', async () => {
    await save(importB, { '2026-01-01': importA }, true, [{ ...rows[0], net_revenue_cents: 500 }])
    assert.equal((await db.query('select * from reporting_imports')).rows.length, 2)
    const latest = await db.query('select * from reporting_daily')
    assert.equal(latest.rows.length, 1); assert.equal(latest.rows[0].courts[0].net_revenue_cents, 500)
    await db.exec('delete from storage.objects')
    assert.equal((await db.query('select * from storage.objects')).rows.length, 2)
  })
  await t.test('WhatsApp drafts are scoped, audited and cannot be marked live', async () => {
    await login(userA)
    const result = await db.query(`insert into whatsapp_campaigns(club_id,title,kind,template,destination_label,schedule,created_by) values($1,'Evening','availability','Hello {{club}}','Players','{}',$2) returning id`, [clubA,userA])
    const id = result.rows[0].id
    assert.equal((await db.query('select * from whatsapp_campaign_history')).rows.length,1)
    await assert.rejects(db.query("update whatsapp_campaigns set status='active' where id=$1",[id]), /check constraint/)
    await login(userB)
    assert.equal((await db.query('select * from whatsapp_campaigns')).rows.length,0)
    assert.equal((await db.query('select * from whatsapp_campaign_history')).rows.length,0)
    await assert.rejects(db.query(`insert into whatsapp_campaigns(club_id,title,kind,template,destination_label,schedule,created_by) values($1,'Bad','event','Hello','Group','{}',$2)`, [clubA,userB]), /row-level security/)
    await login(userA)
  })
  await t.test('AI rate limit rejects sixth request for this user', async () => {
    for (let i = 0; i < 5; i++) assert.equal((await db.query('select consume_ai_request() as allowed')).rows[0].allowed, true)
    assert.equal((await db.query('select consume_ai_request() as allowed')).rows[0].allowed, false)
  })
  await db.close()
})
