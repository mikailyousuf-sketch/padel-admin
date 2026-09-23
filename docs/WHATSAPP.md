# WhatsApp campaign setup

Apply `supabase/migrations/202609230004_whatsapp_campaigns.sql` after the existing
reporting migrations. Open `/assistant/whatsapp` from the sidebar.

## Available now

- Club-scoped draft campaigns for availability announcements and event messages.
- Editable message placeholders and a clearly labelled sample preview.
- Availability send times and weekdays in Africa/Johannesburg, an availability
  window, and minimum slot duration (60/90/120 minutes).
- Event selection and a one-time send date/time in SAST.
- Private PNG/JPEG uploads up to 5 MB, with short-lived signed previews.
- Optimistic edit checks and database change history with actor and timestamp.

Existing image revisions are retained for the change history. Uploads which
succeed before a failed campaign save can leave unreferenced objects; storage
retention/cleanup must be implemented before production onboarding.

## Not connected yet

Saving a campaign saves configuration only. There is no delivery worker, group
provider connection, live court scan, or outbound sending in this release.
Database status constraints deliberately permit only draft/paused.
No group invitation link or manually typed group name is treated as a deliverable
provider destination. Verify the selected provider's official group capabilities,
account eligibility, group ownership and destination identifiers before enabling it.
Do not assume ordinary existing WhatsApp groups support business API delivery.

Official starting points:
- https://business.whatsapp.com/developers/developer-hub
- https://third-party.playtomic.io/endpoints/bookings/

The connected implementation needs verified credentials and club/court mapping,
fresh availability checks that account for opening hours, cancellations and
closures, an execution queue with atomic job claiming, deduplication, retries,
quiet hours, and delivery webhooks. A schedule must not be marked sent merely
because a request was submitted. Stale/unavailable source data must block sends;
no available slots should skip an availability message.

## Human checks

1. Save and edit a club availability draft with two SAST send times.
2. Open it from another session, save an edit there, then try saving the older
   version: expect a conflict message.
3. Upload a PNG/JPEG and use View image to verify private preview works in Supabase.
4. Create an event draft for an event in the same club; reject past send times.
5. Sign in as a manager from another club: the campaign must not appear.
6. Confirm all saved campaigns are drafts and no message is sent.

The simplified dashboard shows today's headline figures, at most five upcoming
monthly events, and quick actions. Missing performance data remains blank, with
one short connection/status line instead of the full reporting panel.
