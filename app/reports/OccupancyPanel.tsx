'use client'

import { useEffect, useState } from 'react'
import { businessDate, currentMonthRange, datesInRange } from '@/lib/reporting/dates'
import { summarise } from '@/lib/reporting/model'
import { archiveDownload, loadReporting } from './data-actions'
import './reporting.css'

type Data = Awaited<ReturnType<typeof loadReporting>>
const percent = (value: number | null) => value === null ? '—' : `${value.toFixed(1)}%`
const money = (cents: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(cents / 100)

export default function OccupancyPanel({ scope, compact = false }: { scope: string; compact?: boolean }) {
  const [range, setRange] = useState(() => ({ from: currentMonthRange().from, to: businessDate() }))
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let cancelled = false
    loadReporting(scope, range.from, range.to).then(result => {
      if (cancelled) return
      setData(result); setError(''); setLoading(false)
    }).catch(err => {
      if (cancelled) return
      setData(null); setError(err instanceof Error ? err.message : 'Unable to load reports.'); setLoading(false)
    })
    return () => { cancelled = true }
  }, [scope, range.from, range.to, revision])

  const refresh = () => { setLoading(true); setRevision(r => r + 1) }
  async function run(task: () => Promise<void>) {
    setBusy(true); setError('')
    try { await task() } catch (err) { setError(err instanceof Error ? err.message : 'Operation failed.') } finally { setBusy(false) }
  }
  function download(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob), anchor = document.createElement('a')
    anchor.href = url; anchor.download = name; anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const rows = data?.reports ?? []
  const summary = summarise(rows.flatMap(r => r.courts))
  let days: string[] = []
  try { days = datesInRange(range.from, range.to) } catch { /* Invalid input is reported by the server. */ }
  const expected = (data?.clubs.length ?? 0) * days.length
  const index = new Map(rows.map(r => [`${r.club_id}:${r.report_date}`, r]))

  return <section className="reporting-panel" aria-label="Daily occupancy and revenue">
    <div className="reporting-heading"><div><h2>Occupancy &amp; booking revenue</h2><p>Daily reporting · South African calendar dates</p></div><span className="reporting-tag">Playtomic connection pending</span></div>
    <p role="status">Automatic reporting is awaiting the Playtomic Manager connection. Managers do not need to prepare or upload spreadsheets. Any existing figures below are historical manual data, not a live Playtomic feed.</p>
    <div className="reporting-toolbar">
      <label>From<input type="date" value={range.from} onChange={e => { setLoading(true); setRange({ ...range, from: e.target.value }) }} /></label>
      <label>To<input type="date" value={range.to} onChange={e => { setLoading(true); setRange({ ...range, to: e.target.value }) }} /></label>
      <button disabled={busy || loading} onClick={refresh}>Refresh</button>
      {!compact && <button disabled={busy || loading || !data?.clubs.length} onClick={() => run(async () => {
        const response = await fetch(`/api/reports/export?${new URLSearchParams({ scope, ...range })}`)
        if (!response.ok) throw new Error((await response.json()).error ?? 'Export failed.')
        download(await response.blob(), `Occupancy_${range.from}_${range.to}.xlsx`)
      })}>Download Excel</button>}
    </div>
    {error && <p className="reporting-error" role="alert">{error}</p>}
    {loading ? <p role="status">Loading reports…</p> : data && <>
      <p className="reporting-coverage">{rows.length} of {expected} club-days have data. Missing dates are excluded from totals.</p>
      <div className="reporting-stats">
        {[
          ['Occupancy', rows.length ? percent(summary.occupancy) : '—'],
          ['Net booking revenue', rows.length ? money(summary.netRevenueCents) : '—'],
          ['Games', rows.length ? summary.games.toLocaleString() : '—'],
          ['Player visits', rows.length ? summary.playerVisits.toLocaleString() : '—'],
        ].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
      </div>
      <p>Peak {percent(summary.peakOccupancy)} · Off-peak {percent(summary.offPeakOccupancy)}. Player visits are not unique players.</p>
      {!rows.length && <p>No reporting data is available for this period.</p>}
      {!compact && <>
        <div className="reporting-table-wrap"><table><caption>Daily figures, including missing dates</caption><thead><tr>{['Date', 'Club', 'Status', 'Occupancy', 'Net revenue', 'Games', 'Visits'].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>
          {days.flatMap(date => data.clubs.map(club => {
            const report = index.get(`${club.id}:${date}`), s = report ? summarise(report.courts) : null
            return <tr key={`${club.id}:${date}`}><td>{date}</td><td>{club.name}</td><td>{s ? s.availableMinutes ? 'Historical manual data' : 'Closed' : 'No data'}</td><td>{s ? percent(s.occupancy) : '—'}</td><td>{s ? money(s.netRevenueCents) : '—'}</td><td>{s?.games ?? '—'}</td><td>{s?.playerVisits ?? '—'}</td></tr>
          }))}
        </tbody></table></div>
        <details><summary>Workbook archive · latest 30 uploads</summary><p>These are the original workbooks saved at import time, including earlier versions of corrected dates. This list covers all dates.</p>
          {!data.archives.length && <p>No archived workbooks yet.</p>}
          {data.archives.map(a => <div className="reporting-archive" key={a.id}><span>{a.club_name} · {a.source_name}<small>{new Date(a.imported_at).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })} SAST</small></span><button disabled={busy} onClick={() => run(async () => { window.location.assign(await archiveDownload(a.id)) })}>Download</button></div>)}
        </details>
      </>}
      {compact && <a href="/reports">View daily reports →</a>}
    </>}
  </section>
}
