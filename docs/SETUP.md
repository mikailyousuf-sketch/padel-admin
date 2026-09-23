# Setup and release checklist

## Database prerequisites

The complete metadata export has now been reviewed. The existing report prerequisites
and invoice fields are present. The export also confirms a profile self-promotion
vulnerability and excessive table privileges, addressed by migration 004 below.
Use `supabase/inspect-schema.sql` to refresh the review after staging changes. The additive migrations expect:

- `public.clubs(id uuid, name text)`
- `public.profiles(id uuid, is_hoo boolean)`
- `public.club_assignments(user_id uuid, club_id uuid)`
- `public.user_permissions(user_id uuid, permission_key text)`
- `public.club_config(club_id uuid, court_count integer)`
- `public.event_quotes(id uuid, club_id uuid, pop_url text, ...)`
- Standard Supabase `auth.users`, `auth.uid()`, storage tables and `owner_id`.

Apply, in order, to a staging database containing the existing application schema:

1. `supabase/migrations/202609220001_reporting.sql`
2. `supabase/migrations/202609220002_ai_quota.sql`
3. `supabase/migrations/202609220003_invoice_proofs.sql`
4. `supabase/migrations/202609230001_profile_security.sql`

Use the existing migration workflow if one is already used by the company. These
files are transactional and should be applied once. They do not recreate the
original tables or replace existing access policies.

The first migration creates `reporting_imports`, `reporting_daily`, transactional
save/access functions and a private `report-archive` bucket. The second creates a
per-user AI quota. The third creates a private `invoice-proofs` bucket. Check that
pre-existing buckets with those IDs, if any, are private and have the documented
size/MIME limits; `ON CONFLICT` deliberately does not overwrite existing settings.

## Access model

Reporting access follows explicit club assignments, Head of Operations status,
or the `all_clubs_access` permission. These are the existing project's concepts;
this does not introduce separate company/tenant boundaries. Every assigned club
user can import and correct reports for that club. Review that policy with the
company before rollout. Only the save function writes report tables; uploads and
reads use the signed-in user's session, never the service-role key.

Audit existing RLS policies on profiles, permissions, assignments, quotes, HR and
club settings before production. In particular users must not be able to grant
themselves HOO/global permissions. Adding safe reporting policies cannot repair
an unsafe policy on one of those existing authorization tables.

## Staging checks

- As manager A, import the completed template for club A; manager B must not see
  that report, its archive, or a signed download for it.
- Confirm HOO can report across assigned/authorized clubs.
- Retry the same dates without replacement: it must be rejected. Save a correction
  with replacement: totals must change without duplication, and both archives
  must remain downloadable.
- Check files persist after logout/restart, and that expired signed URLs stop
  working. SDK storage upload/signing behavior needs verification on Supabase;
  local SQL tests emulate the relevant tables and roles only.
- Upload a real test PDF receipt to an invoice. Confirm it downloads and the
  invoice is not marked paid or automatically emailed.
- Verify login, password reset, expired-session refresh and logout. Root `proxy.ts`
  now handles session refresh and unauthenticated route protection.

## Deployment

Merge only after reviewing the branch and running staging checks. Apply migrations
before deploying the new application. The app clearly reports pending reporting
setup if its tables/functions are absent. This change does not deploy or modify
the live database automatically.

Use your existing Vercel project and configure environment variables in its
settings. Keep AI variables empty until an available model is selected and a
provider budget is configured. The AI endpoint is authenticated, validates prompts,
uses a timeout and allows at most five requests per minute per user.

For rollback, redeploy the preceding application version; keep the additive tables
and archived data intact. Do not drop archives to roll back a UI release.

## Findings from the complete database metadata

- All invoice fields used by the application are present, including invoice number,
  event time, pax and invoicing details. Quote status constraints include invoiced
  and paid. No missing-column migration is needed for these fields.
- `has_club_access` matches the assignment/HOO/global access model used by reports.
- Profiles have RLS enabled, but the self-update policy, unrestricted UPDATE grant
  and absence of profile triggers allow self-promotion to HOO. Migration 004 adds
  a trigger protecting `is_hoo` and profile identity. Ordinary profile edits and
  existing HOO role administration remain available; trusted database maintenance
  roles retain access. The regression test reproduces the original escalation
  and verifies it fails after migration.
- Application roles have TRUNCATE and TRIGGER grants on public tables. Migration
  004 removes those privileges from anon, authenticated and PUBLIC on existing
  public tables. Future table migrations must avoid granting them again.
- HR policies use `manage_hr_finance`, while the current HR role preset grants
  `manage_hr`. Infrastructure policies use `manage_infrastructure`, which the
  current permission picker does not expose. These remain follow-up UI/catalog
  work; existing assignments have not been silently broadened.
- `clubs` allows reads by every authenticated user. Existing club selectors must
  not assume that this policy limits the directory to assigned clubs. Reporting
  uses its own explicit access check.
- Quote UPDATE rules still require review alongside invoice transitions: ordinary
  managers cannot set `invoiced`, and row-level rules alone do not protect every
  approved financial field from edits.

Migration 004 can be staged independently against the exported existing schema.
Verify manager self-promotion is rejected, normal profile edits still work, and
HOO role administration works before applying it to production. The export and
local tests do not establish that this fix has been applied to the live database.
