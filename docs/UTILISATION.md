# Utilisation review

Open `/utilisation` as HOO or a user with `manage_utilisation`.
No new migration or dependency is needed for this module.

The overview uses the established club-card → per-club detail pattern. Clubs
with missing dates appear first, then those with lower occupancy. Details show
capacity-weighted occupancy, peak/off-peak and weekday comparisons, booking
revenue, games, player visits and daily figures. Date ranges are retained when
opening a club and returning to the overview. Maximum range: 62 days.

Demo mode is the default, visibly labelled, and uses three fictional clubs.
Its deterministic sample data is generated in memory and never saved to the
operational database. One fictional club deliberately has missing dates. Targets
are illustrative demo assumptions, not actual company budgets. Every worksheet
and exported filename identifies demo data.

Stored-data mode uses the existing reporting records and assignment/global access
checks. These records are historical manual figures until Playtomic is connected.
Targets stay unavailable in this mode: actual target integration needs a confirmed
basis matching booking revenue, rather than comparing against total company revenue.
Target achievement is withheld for incomplete periods even in demo mode.

This module neither fetches Playtomic nor sends messages. Its campaign link opens
the existing draft editor and does not create or enable a campaign automatically.

## Human checks

- Open Utilisation and confirm the DEMO banner is prominent.
- Select 7 days, open a club, and return: the range and mode should persist.
- Check the club with missing dates: gaps remain blank and target achievement
  does not misleadingly show a low percentage.
- Switch to Stored data: no fictional club or figure should remain visible.
- Download a demo workbook: confirm original colours/layout and DEMO labels.
- Sign in without the permission: the page and data action must refuse access.

Automated checks cover deterministic sample generation, realistic capacity
bounds, isolated club totals, missing-data treatment and withheld targets.
Authenticated browser acceptance and live Supabase verification remain required.
