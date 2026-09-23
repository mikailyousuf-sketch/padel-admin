'use client'
import Link from 'next/link'
import { useEffect, useState, type CSSProperties } from 'react'
import { BRAND } from '@/lib/config/brand'
import { businessDate } from '@/lib/reporting/dates'
import { clubMetrics } from '@/lib/utilisation/model'
import { loadUtilisation } from './actions'
import './utilisation.css'

const pct = (value: number | null) => value === null ? '—' : `${value.toFixed(1)}%`
const money = (cents: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(cents / 100)
const ago = (date: string, days: number) => new Date(Date.parse(date) - days * 86400000).toISOString().slice(0,10)
export default function UtilisationClient({ clubId, initialMode, initialFrom, initialTo }: { clubId?: string; initialMode?: string; initialFrom?: string; initialTo?: string }) {
  const [mode, setMode] = useState(initialMode === 'stored' || (clubId && !clubId.startsWith('demo-')) ? 'stored' : 'demo')
  const [range, setRange] = useState(() => ({ from: initialFrom ?? ago(businessDate(), 29), to: initialTo ?? businessDate() }))
  const [data, setData] = useState<Awaited<ReturnType<typeof loadUtilisation>> | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let active = true
    loadUtilisation(mode, range.from, range.to, clubId).then(result => {
      if (active) { setData(result); setError(''); setLoading(false) }
    }).catch(e => { if (active) { setData(null); setError(e.message); setLoading(false) } })
    return () => { active = false }
  }, [mode, range.from, range.to, clubId, revision])
  function changeRange(next: typeof range) { setLoading(true); setData(null); setRange(next) }
  const items = (data?.clubs ?? []).map(club => ({ club, stats: clubMetrics(club, data?.reports ?? [], range.from, range.to) }))
    .sort((a,b) => b.stats.missingDays-a.stats.missingDays || (a.stats.occupancy ?? 0)-(b.stats.occupancy ?? 0))
  const detail = clubId ? items[0] : null
  return <main className="util-page" style={{ '--util-accent': BRAND.primaryColor } as CSSProperties}>
    {clubId && <Link className="util-back" href={`/utilisation?${new URLSearchParams({ mode, ...range })}`}>← All clubs</Link>}
    <header className="util-heading"><div><h1>{detail?.club.name ?? 'Utilisation'}</h1><p>{clubId ? 'Court performance and opportunities' : 'Club performance at a glance'}</p></div>
      {!clubId && <div className="util-switch" aria-label="Data mode">{['demo','stored'].map(value => <button key={value} aria-pressed={mode === value} onClick={() => { setMode(value); setLoading(true); setData(null) }}>{value === 'demo' ? 'Demo' : 'Stored data'}</button>)}</div>}
    </header>
    <p className="util-banner">{mode === 'demo' ? 'DEMO · Fictional clubs and figures. Nothing here changes your club data.' : 'STORED DATA · Historical manual records. Playtomic is not connected.'}</p>
    <div className="util-toolbar"><label>From<input type="date" value={range.from} onChange={e => changeRange({ ...range, from: e.target.value })} /></label><label>To<input type="date" max={businessDate()} value={range.to} onChange={e => changeRange({ ...range, to: e.target.value })} /></label>
      {[7,30].map(days => <button key={days} onClick={() => changeRange({ from: ago(businessDate(), days-1), to: businessDate() })}>{days} days</button>)}
      <button disabled={loading} onClick={() => { setLoading(true); setRevision(v => v+1) }}>Refresh</button>
      <button disabled={loading || exporting || !items.length} onClick={async () => {
        setExporting(true); setError('')
        try {
          const response = await fetch(`/api/utilisation/export?${new URLSearchParams({ mode, ...range, ...(clubId ? { club: clubId } : {}) })}`)
          if (!response.ok) throw new Error((await response.json()).error)
          const url = URL.createObjectURL(await response.blob()), a = document.createElement('a')
          a.href = url; a.download = `${mode === 'demo' ? 'DEMO_' : ''}Utilisation_${range.from}_${range.to}.xlsx`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
        } catch(e) { setError(e instanceof Error ? e.message : 'Export failed.') } finally { setExporting(false) }
      }}>{exporting ? 'Preparing…' : 'Export Excel'}</button>
    </div>
    {error && <p role="alert">{error}</p>}
    {loading ? <p role="status">Loading club performance…</p> : !items.length ? <p>No accessible clubs or reporting data for this view.</p> : detail ? <>
      <div className="util-metrics">{[['Occupancy',pct(detail.stats.occupancy)],['Booking revenue',detail.stats.days ? money(detail.stats.netRevenueCents) : '—'],['Games',detail.stats.days ? String(detail.stats.games) : '—'],['Player visits',detail.stats.days ? String(detail.stats.playerVisits) : '—']].map(([label,value]) => <div className="util-card" key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
      <div className="util-two"><section className="util-card"><h2>Peak & off-peak</h2>{[['Peak',detail.stats.peakOccupancy],['Off-peak',detail.stats.offPeakOccupancy]].map(([label,value]) => <div className="util-bar-row" key={String(label)}><span>{label}</span><progress max={100} value={Number(value ?? 0)} aria-label={`${label} occupancy`} /><b>{pct(value as number|null)}</b></div>)}<p className="util-muted">Weighted by available court minutes.</p></section>
        <section className="util-card"><h2>{mode === 'demo' ? 'Demo revenue target' : 'Revenue target'}</h2><strong>{pct(detail.stats.targetPercent)}</strong><p>{detail.stats.targetCents === null ? 'Target comparison is not connected yet.' : `${money(detail.stats.netRevenueCents)} / ${money(detail.stats.targetCents)}`}</p>{detail.stats.missingDays > 0 && <p className="util-muted">Target achievement withheld until all dates have data.</p>}</section></div>
      <section className="util-card"><h2>Weekday performance</h2>{detail.stats.weekday.map(day => <div className="util-bar-row" key={day.label}><span>{day.label}</span><progress max={100} value={day.occupancy ?? 0} aria-label={`${day.label} occupancy`} /><b>{pct(day.occupancy)}</b></div>)}</section>
      <div className="util-two"><section className="util-card"><h2>Focus areas</h2><ul>
        {detail.stats.missingDays > 0 && <li>Resolve {detail.stats.missingDays} missing reporting date(s) before comparing revenue.</li>}
        {detail.stats.offPeakOccupancy !== null && detail.stats.offPeakOccupancy < 40 && <li>Review off-peak demand: consider a social session or targeted availability campaign.</li>}
        {detail.stats.targetPercent !== null && detail.stats.targetPercent < 100 && <li>Revenue is below the selected period’s {mode === 'demo' ? 'illustrative ' : ''}target.</li>}
        <li>{detail.stats.days} reporting dates available. {detail.stats.missingDays} missing.</li>
      </ul><Link href="/assistant/whatsapp">Plan a WhatsApp campaign →</Link></section><section className="util-card"><h2>Data status</h2><p>{mode === 'demo' ? 'Generated sample data' : 'Historical manual records'}</p><p>Latest record: {detail.stats.lastUpdated ? new Date(detail.stats.lastUpdated).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' }) + ' SAST' : 'None'}</p><p className="util-muted">Missing data stays blank. Player visits are attendances, not unique people.</p></section></div>
      <section className="util-card util-table"><h2>Daily performance</h2><table><thead><tr><th>Date</th><th>Occupancy</th><th>Peak</th><th>Off-peak</th><th>Revenue</th></tr></thead><tbody>{detail.stats.daily.map(day => <tr key={day.date}><td>{day.date}</td><td>{pct(day.occupancy)}</td><td>{pct(day.peakOccupancy)}</td><td>{pct(day.offPeakOccupancy)}</td><td>{data?.reports.some(r => r.report_date === day.date) ? money(day.netRevenueCents) : '—'}</td></tr>)}</tbody></table></section>
    </> : <>
      <p className="util-muted">Missing data first, then lowest occupancy. Select a club for details.</p>
      <div className="util-grid">{items.map(({club,stats}) => <Link className="util-card util-club" key={club.id} href={`/utilisation/${club.id}?${new URLSearchParams({ mode, ...range })}`}><div className="util-heading"><h2>{club.name}</h2><span>→</span></div><strong>{pct(stats.occupancy)}</strong><small>Occupancy</small><div className="util-pair"><span>Peak <b>{pct(stats.peakOccupancy)}</b></span><span>Off-peak <b>{pct(stats.offPeakOccupancy)}</b></span></div><p>{stats.days ? money(stats.netRevenueCents) : '—'} booking revenue</p><p className="util-muted">{stats.days} dates reported{stats.missingDays ? ` · ${stats.missingDays} missing` : ' · Complete period'}</p></Link>)}</div>
    </>}
  </main>
}
