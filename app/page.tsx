import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSelectedScope } from '@/lib/scope/actions'
import { businessDate, currentMonthRange } from '@/lib/reporting/dates'
import { summarise } from '@/lib/reporting/model'
import { loadReporting } from './reports/data-actions'
import { listEventsForScope } from './reports/actions'
import { theme as T } from './components/theme'

export default async function Home() {
  const scope = await getSelectedScope()
  if (!scope) redirect('/select-club')
  const today = businessDate()
  const { to } = currentMonthRange()
  const [reportResult, eventResult] = await Promise.allSettled([
    loadReporting(scope, today, today), listEventsForScope(scope, today, to),
  ])
  const data = reportResult.status === 'fulfilled' ? reportResult.value : null
  const events = eventResult.status === 'fulfilled' ? eventResult.value : null
  const summary = summarise(data?.reports.flatMap(row => row.courts) ?? [])
  const hasData = Boolean(data?.reports.length)
  const money = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 })
  return <div style={{ maxWidth: 1150, margin: '0 auto', padding: '32px 24px', color: T.colors.textPrimary }}>
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 28 }}>
      <div><h1 style={{ fontSize: 28, margin: 0 }}>Today</h1><p style={{ color: T.colors.textSecondary, marginBottom: 0 }}>{data?.clubs.length === 1 ? data.clubs[0].name : 'Your clubs'} · {today}</p></div>
      <Link href="/select-club" style={{ ...T.btn.secondary, textDecoration: 'none' }}>Change club</Link>
    </header>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16 }}>
      {[
        ['Occupancy', hasData && summary.occupancy !== null ? `${summary.occupancy.toFixed(0)}%` : '—'],
        ['Booking revenue', hasData ? money.format(summary.netRevenueCents / 100) : '—'],
        ['Games', hasData ? String(summary.games) : '—'],
        ['Player visits', hasData ? String(summary.playerVisits) : '—'],
      ].map(([label, value]) => <div key={label} style={{ ...T.card, padding: 24 }}><p style={{ color: T.colors.textSecondary, fontSize: 13, margin: 0 }}>{label}</p><strong style={{ display: 'block', fontSize: 34, marginTop: 14 }}>{value}</strong></div>)}
    </div>
    <p style={{ color: T.colors.textMuted, fontSize: 12, margin: '8px 0 28px' }}>
      {reportResult.status === 'rejected' ? 'Reporting unavailable · ' : hasData ? `${data?.reports.length}/${data?.clubs.length} clubs reported · Historical manual data · ` : 'Playtomic connection pending · '}
      <Link href="/reports" style={{ color: T.colors.textSecondary }}>Full reports →</Link>
    </p>
    <section style={{ ...T.card, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2 style={{ fontSize: 18, margin: 0 }}>Upcoming events</h2><Link href="/events" style={{ color: T.colors.textSecondary }}>View all →</Link></div>
      {events === null ? <p role="alert">Events could not be loaded.</p> : events.length === 0 ? <p style={{ color: T.colors.textMuted }}>No upcoming events this month.</p> : events.slice(0, 5).map(event => <div key={event.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '16px 0', borderBottom: `1px solid ${T.colors.border}` }}><span>{event.name}<small style={{ display: 'block', color: T.colors.textMuted }}>{event.clubs?.name}</small></span><span style={{ color: T.colors.textSecondary }}>{event.event_date}</span></div>)}
    </section>
    <nav aria-label="Quick actions" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 20 }}>
      {[['Log maintenance', '/maintenance'], ['Create quote', '/assistant/quotes'], ['Staff & leave', '/hr'], ['WhatsApp schedules', '/assistant/whatsapp']].map(([label, href]) => <Link key={href} href={href} style={{ ...T.btn.secondary, textDecoration: 'none' }}>{label}</Link>)}
    </nav>
  </div>
}
