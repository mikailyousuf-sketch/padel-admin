'use client'

import { useEffect, useState } from 'react'
import { businessDate, currentMonthRange, datesInRange } from '@/lib/reporting/dates'
import { summarise } from '@/lib/reporting/model'
import { archiveDownload, getImportTemplate, importDailyReport, loadReporting } from './data-actions'
import './reporting.css'

type Data = Awaited<ReturnType<typeof loadReporting>>
const percent = (value: number | null) => value === null ? '—' : `${value.toFixed(1)}%`
const money = (cents: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(cents / 100)

export default function OccupancyPanel({ scope, compact = false }: { scope: string; compact?: boolean }) {
  const [range, setRange] = useState(() => ({ from: currentMonthRange().from, to: businessDate() }))
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [revision, setRevision] = useState(0)
  const [clubId, setClubId] = useState('')

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

  const selectedClub = data?.clubs.find(c => c.id === clubId)?.id ?? (data?.clubs.length === 1 ? data.clubs[0].id : '')
  const refresh = () => { setLoading(true); setRevision(r => r + 1) }
  async function run(task: () => Promise<void>) {
    setBusy(true); setError(''); setNotice('')
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
    <div className="reporting-heading"><div><h2>Occupancy &amp; booking revenue</h2><p>Stored daily figures · South African calendar dates</p></div><span className="reporting-tag">CSV imports · Playtomic not connected</span></div>
    <div className="reporting-toolbar">
      <label>From<input type="date" value={range.from} onChange={e => { setLoading(true); setRange({ ...range, from: e.target.value }) }} /></label>
      <label>To<input type="date" value={range.to} onChange={e => { setLoading(true); setRange({ ...range, to: e.target.value }) }} /></label>
      <button disabled={busy || loading} onClick={refresh}>Refresh</button>
      {!compact && <button disabled={busy || loading || !rows.length} onClick={() => run(async () => {
        const response = await fetch(`/api/reports/export?${new URLSearchParams({ scope, ...range })}`)
        if (!response.ok) throw new Error((await response.json()).error ?? 'Export failed.')
        download(await response.blob(), `Daily_reports_${range.from}_${range.to}.xlsx`)
      })}>Download Excel</button>}
    </div>
    {error && <p className="reporting-error" role="alert">{error}</p>}
    {notice && <p role="status">{notice}</p>}
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
      {!rows.length && <p>No figures have been imported for this period.</p>}
      {!compact && <>
        <details className="reporting-import"><summary>Import daily figures</summary>
          <p>Download the template for one club. Enter one row per court per day, including closed courts. Each upload can cover up to 31 dates.</p>
          <p>Minutes must reflect the actual day’s capacity after closures. Revenue is net booking revenue after refunds, including VAT where applicable, allocated to the play date. Games exclude cancellations; player visits count attendances.</p>
          <form onSubmit={e => {
            e.preventDefault(); const form = new FormData(e.currentTarget); form.set('clubId', selectedClub)
            run(async () => { const result = await importDailyReport(form); if (!result.ok) throw new Error(result.error); setNotice(`Saved and archived ${result.days} day(s). Adjust the date range above if needed.`); refresh() })
          }}>
            <label>Club<select value={selectedClub} onChange={e => setClubId(e.target.value)} required><option value="">Select a club</option>{data.clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <button type="button" disabled={!selectedClub || busy} onClick={() => run(async () => download(new Blob([await getImportTemplate(selectedClub)], { type: 'text/csv' }), 'Daily_report_template.csv'))}>Download CSV template</button>
            <label>Completed template<input name="file" type="file" accept=".csv,text/csv" required /></label>
            <label className="reporting-check"><input type="checkbox" name="replace" /> Replace existing dates; keep previous versions in the archive</label>
            <button disabled={!selectedClub || busy} type="submit">{busy ? 'Working…' : 'Validate, save & archive'}</button>
          </form>
        </details>
        <div className="reporting-table-wrap"><table><caption>Daily figures, including missing dates</caption><thead><tr>{['Date', 'Club', 'Status', 'Occupancy', 'Net revenue', 'Games', 'Visits'].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>
          {days.flatMap(date => data.clubs.map(club => {
            const report = index.get(`${club.id}:${date}`), s = report ? summarise(report.courts) : null
            return <tr key={`${club.id}:${date}`}><td>{date}</td><td>{club.name}</td><td>{s ? s.availableMinutes ? 'Imported' : 'Closed' : 'Not imported'}</td><td>{s ? percent(s.occupancy) : '—'}</td><td>{s ? money(s.netRevenueCents) : '—'}</td><td>{s?.games ?? '—'}</td><td>{s?.playerVisits ?? '—'}</td></tr>
          }))}
        </tbody></table></div>
        <details><summary>Workbook archive · latest 30 uploads</summary><p>These are the original workbooks saved at import time, including earlier versions of corrected dates. This list covers all dates.</p>
          {!data.archives.length && <p>No archived workbooks yet.</p>}
          {data.archives.map(a => <div className="reporting-archive" key={a.id}><span>{a.club_name} · {a.source_name}<small>{new Date(a.imported_at).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })} SAST</small></span><button disabled={busy} onClick={() => run(async () => { window.location.assign(await archiveDownload(a.id)) })}>Download</button></div>)}
        </details>
      </>}
      {compact && <a href="/reports">Import figures and view daily reports →</a>}
    </>}
  </section>
}
