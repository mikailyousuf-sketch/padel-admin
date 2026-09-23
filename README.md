# Padel Admin

Next.js + Supabase club administration. Includes events, HR, maintenance,
quotes/invoices and daily occupancy/revenue reporting.

## Run locally

Use Node.js 22 or later. Install with `npm ci`. Create an untracked `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
# Optional. AI stays disabled unless both are configured.
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=
```

Never put the service-role or AI key in a `NEXT_PUBLIC_` variable. Existing user
and club administration uses the service-role client only after server checks.

Apply the migrations described in [setup](docs/SETUP.md) to a staging copy of the
existing Supabase database before testing. This repository does not yet include
the original database schema. The migrations are additive, not a fresh-database
installer. Use `npm run dev`, then sign in with an existing invited user.

## Daily reporting

1. Choose a club or all accessible clubs.
2. Open **Reports → Import daily figures**.
3. Select a club and download its CSV template.
4. Fill in every court for each date. Dates use `YYYY-MM-DD`; money uses rand and
   cents without currency symbols. Template blanks deliberately fail validation.
5. Upload and save. A private Excel archive and versioned daily figures are saved.
6. Adjust the date range to view the figures or export a combined workbook.

See [reporting definitions and limits](docs/REPORTING.md). The adapter currently
accepts the platform's template, **not arbitrary Playtomic exports**. No Playtomic
API calls or unattended data collection are implemented yet.

## Checks

```bash
npm test
npm run typecheck
npm run build
npm run lint
```

Tests cover date boundaries, CSV validation, report calculations, generated Excel
values and migration/RLS behavior using an isolated PostgreSQL-compatible PGlite
database. They do not contact production Supabase. The build requires public
Supabase variables; CI uses clearly non-production placeholders.

The repository still has legacy lint errors in older modules. CI checks all
TypeScript, the new reporting/API code, regression tests and the production build;
it does not disable the existing full lint rules.

## Invoice workflow

Email delivery is not connected. **Record invoice sent** explicitly acknowledges
sending outside the platform. Proof-of-payment files are uploaded privately and
can be downloaded with short-lived signed URLs. Uploading a document never marks
an invoice paid. Live database permissions for the older quote, HR, maintenance
and settings tables still require auditing against the actual Supabase project.
