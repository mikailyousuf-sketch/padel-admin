const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const { PGlite } = require('@electric-sql/pglite')
test('managed user setup is transactional and unavailable to application roles', async () => {
  const db = new PGlite()
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role;
      create table profiles(id uuid primary key, full_name text, email text, is_hoo boolean);
      create table clubs(id uuid primary key);
      create table permissions(key text primary key, description text);
      create table club_assignments(user_id uuid references profiles(id), club_id uuid references clubs(id), primary key(user_id,club_id));
      create table user_permissions(user_id uuid references profiles(id), permission_key text references permissions(key), primary key(user_id,permission_key));
      grant all on all tables in schema public to service_role;
    `)
    for (const file of ['202609230002_permission_catalog.sql','202609230003_managed_user_setup.sql']) await db.exec(fs.readFileSync(`supabase/migrations/${file}`,'utf8'))
    const args = ['11111111-1111-4111-8111-111111111111','Manager','manager@example.test',false,[],['manage_hr_finance']]
    const call = () => db.query('select configure_managed_user($1,$2,$3,$4,$5,$6)',args)
    await db.exec('set role authenticated')
    await assert.rejects(call(), /permission denied/)
    await db.exec('reset role; set role service_role')
    args[5] = ['missing_permission']
    await assert.rejects(call(), /foreign key/)
    assert.equal((await db.query('select * from profiles')).rows.length,0)
    args[5] = ['manage_hr_finance']
    await call()
    assert.equal((await db.query('select * from profiles')).rows.length,1)
    assert.equal((await db.query('select * from user_permissions')).rows.length,1)
    await call()
    assert.equal((await db.query('select * from user_permissions')).rows.length,1)
  } finally { await db.close() }
})
