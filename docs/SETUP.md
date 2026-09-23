# Setup and release checklist

## Database prerequisites

The supplied partial column export and access policies have been reviewed, but
the complete live schema, grants and triggers are still needed. Run the whole
`supabase/inspect-schema.sql` query in Supabase SQL Editor, download its single
result as CSV, and compare it before applying anything to production. The additive migrations expect:

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

## Findings from the supplied database metadata

These are review findings, not proof of effective runtime access: table grants,
RLS enablement, constraints and triggers have not yet been supplied.

- The column list ends at `event_quotes.event_type`. Later tables and additional
  quote fields must be checked against a complete export, not assumed absent.
- `profiles_update_own` permits updating one's own profile. Verify that column
  grants or a trigger prevent a non-HOO user from changing `is_hoo`; otherwise
  the reporting access model can be bypassed by self-promotion.
- Policies depend on `has_club_access`, whose definition is still needed.
- HR policies use `manage_hr_finance`, while the current HR role preset grants
  `manage_hr`. Infrastructure policies use `manage_infrastructure`, which the
  current permission picker does not expose. Check the permission catalog and
  its constraints before changing presets or migrating existing assignments.
- `clubs` permits reads by every authenticated user. Existing club selectors
  must not assume this policy limits the directory to assigned clubs. The new
  reporting access function checks assignments and global access explicitly.
- The supplied quote UPDATE policy does not allow ordinary managers to set
  `invoiced`. Review invoice transitions, status constraints and field protection
  together before changing this policy.

The inspection query includes complete columns, constraints, policies, RLS flags,
grants, non-internal triggers and the three access helpers in one result. It is
read-only and does not export application records.
