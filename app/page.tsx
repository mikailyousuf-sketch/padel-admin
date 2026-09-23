import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSelectedScope } from '@/lib/scope/actions'
import { currentMonthRange } from '@/lib/reporting/dates'
import { listEventsForScope } from './reports/actions'
import OccupancyPanel from './reports/OccupancyPanel'
import { theme as T } from './components/theme'

export default async function Home() {
  const scope = await getSelectedScope()
  if (!scope) redirect('/select-club')
  const { from, to } = currentMonthRange()
  let events: Awaited<ReturnType<typeof listEventsForScope>> = []
  let eventError = false
  try { events = await listEventsForScope(scope, from, to) } catch { eventError = true }

  return <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px', color: T.colors.textPrimary }}>
    <header style={{ marginBottom: 28 }}><p style={{ color: T.colors.red, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em' }}>CLUB OPERATIONS</p><h1 style={{ fontSize: 28, marginBottom: 8 }}>Management overview</h1><p style={{ color: T.colors.textSecondary }}>Daily performance, club activity and operational tools.</p><Link href="/select-club" style={{ color: T.colors.textSecondary }}>Change club or company view</Link></header>
    <OccupancyPanel key={scope} scope={scope} compact />
    <section style={{ ...T.card, padding: 24, marginBottom: 24 }}>
      <h2 style={{ fontSize: 18 }}>Events this month</h2>
      {eventError ? <p role="alert">Events could not be loaded. Please refresh.</p> : events.length === 0 ? <p style={{ color: T.colors.textSecondary }}>No events recorded for this month.</p> : <div style={{ display: 'grid', gap: 12 }}>
        {events.map(event => <div key={event.id} style={{ display: 'flex', gap: 16, justifyContent: 'space-between', borderBottom: `1px solid ${T.colors.border}`, padding: '12px 0' }}><span>{event.name}<small style={{ display: 'block', color: T.colors.textSecondary }}>{event.clubs?.name}</small></span><span>{event.event_date} · {event.players} players</span></div>)}
      </div>}
      <p><Link href="/events" style={{ color: T.colors.textPrimary }}>Manage events →</Link></p>
    </section>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
      {[
        ['Reports & archives', 'Import daily figures and download Excel workbooks.', '/reports'],
        ['Quotes & invoices', 'Prepare event quotes and track invoice progress.', '/assistant/quotes'],
        ['People & HR', 'Manage staff, leave and incidents.', '/hr'],
        ['Maintenance', 'Track club repairs and outstanding work.', '/maintenance'],
      ].map(([title, description, href]) => <Link key={href} href={href} style={{ ...T.card, padding: 20, textDecoration: 'none', color: T.colors.textPrimary }}><h2 style={{ fontSize: 15 }}>{title}</h2><p style={{ color: T.colors.textSecondary, fontSize: 13, lineHeight: 1.6 }}>{description}</p></Link>)}
    </div>
  </div>
}
