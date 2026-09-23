# Reporting workflow

Reports are intended to feed automatically from the official Playtomic API.
Managers should never prepare or upload reporting spreadsheets. Manual upload
controls and their server action are now disabled. Existing manual data and
archives remain available and are explicitly labelled as historical manual data.

The occupancy export reuses `app/lib/exportExcel.ts`: DAILY SUMMARY, monthly
club tabs, weekday columns, red headers, dark totals and alternating row shading.
Only authorized clubs appear. Historical summaries use the selected end date.
The supporting Daily reports and Definitions tabs retain provenance and missing
calendar dates. Event P&L exports continue using their original exporter.
Targets and pickleball measurements not supplied by the reporting contract stay
blank; no inferred targets or invented pickleball figures are inserted.

## Playtomic connection status

The direct sync is not implemented or active. Credentials are still unavailable.
Official documentation is now identified and must guide implementation:
- https://third-party.playtomic.io/
- https://third-party.playtomic.io/endpoints/auth/
- https://third-party.playtomic.io/endpoints/bookings/

Required next integration work: server-only credentials, club/tenant and court
mapping, paginated booking retrieval, rate-limit handling, UTC-to-SAST conversion,
cancellations/refunds reconciliation, durable sync checkpoints, and automatic
branded workbook archives. Booking price must not be treated as collected net
revenue without reconciling payments/refunds. Verify capacity/closures separately.
Never expose credentials to client components or commit secrets to GitHub.

## Historical manual-data contract (retained for existing records/tests)

CSV uploads use one row per court per calendar date in Africa/Johannesburg. All
configured padel courts must be present for each included date, even if closed.
The current court count is used for validation; changes to historical court counts
need a configuration-history extension before importing affected historical days.
Pickleball is not included in this first contract.

| Column | Meaning |
| --- | --- |
| report_date | Play/service date, `YYYY-MM-DD`, no future dates |
| court_number | Integer from 1 to the club's configured court count |
| available_minutes | Bookable minutes after maintenance/closures, 0–1440 |
| booked_minutes | Occupied booking minutes, excluding cancelled bookings |
| peak_available_minutes | Peak portion of available minutes |
| peak_booked_minutes | Peak portion of booked minutes |
| net_revenue | Net booking revenue in ZAR after refunds, including VAT where applicable; negative corrections allowed |
| games | Number of non-cancelled games on this court/date |
| player_visits | Attendances, not unique people or staff/ambassador KPI counts |

Use consistent source definitions across clubs. A Playtomic export must first be
mapped into these columns; arbitrary source files are not automatically understood.
Amounts are converted to integer cents for aggregation. Refunds in this model are
attributed back to the original play date. It is not a bank-settlement ledger.

Occupancy = sum(booked_minutes) / sum(available_minutes). Peak and off-peak use
their own capacity denominators. Missing dates remain missing; zero-capacity dates
show blank occupancy and a closed status. No numbers are invented for missing
clubs. Rows are fetched in pages to avoid Supabase's default response truncation.

Imports accept UTF-8 CSV, with optional BOM, CRLF and quoted fields. Maximum 2 MB,
3,100 rows, 31 dates per upload; exported date ranges are limited to 366 days.
Every imported date replaces that date's full court set only after explicit
replacement acknowledgement. A database transaction serializes saves per club,
checks the versions seen before upload and retains immutable import history.
Each import creates a stored XLSX workbook, so earlier figures remain reviewable
when corrected. Combined exports are generated from the current stored revisions.
A failed database save attempts to remove its unfinished workbook. An interrupted
request can leave an orphan object; an administrator may clean up objects with no
matching `reporting_imports.workbook_path` after checking age/active uploads.

## Future Playtomic adapter

Do not invent endpoints or assume an API key is sufficient. Obtain authorized API
documentation and anonymised examples of bookings, cancellations, refunds, courts,
players and pagination. Implement a server-only connector, map source club/court
IDs to local IDs, deduplicate booking IDs, retain raw source history, and aggregate
into the same court/day contract. Add retryable sync jobs, health indicators and
backfills before enabling unattended collection. Peak windows must be split at
time boundaries and closures reflected in daily capacity.

Daily figures and workbook storage are implemented here. Live booking ingestion,
individual player history, automatic midnight reports, reconciliation against
settlements and a background Playtomic scheduler remain integration work.
