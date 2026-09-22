'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { generateOccupancyExcel } from '../lib/exportExcel'
import { ChevronDown, ChevronUp, Download, AlertTriangle } from 'lucide-react'
import { theme } from '../components/theme'
import { getSelectedScope } from '@/lib/scope/actions'
import { COMPANY_SCOPE } from '@/lib/scope/constants'
import {
  listEventsForScope, listPlayersForScope, listKpiTargets, getClubConfigForScope,
  type ReportEventRow, type ReportPlayerRow, type KpiTargetRow,
} from './actions'

const T = theme

const DEFAULT_PEAK_MORNING_START = '06:00'
const DEFAULT_PEAK_MORNING_END   = '10:00'
const DEFAULT_PEAK_EVENING_START = '15:00'
const DEFAULT_PEAK_EVENING_END   = '23:00'

function formatTimeLabel(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const hour = h % 12 || 12
  return `${hour}${m > 0 ? `:${String(m).padStart(2, '0')}` : ''}${ampm}`
}

const PERIODS = ['Today', 'Yesterday', 'Past Week', 'Past Month', 'Custom']

// ── Occupancy & Revenue — still mock. Real occupancy % requires Playtomic
// API access, which isn't set up yet (same status as WhatsApp automation).
// Labeled honestly in the UI below rather than left looking live.
const occupancyData: { [key: string]: { label: string; occupancy: number; peak: number; offpeak: number; revenue: number; target: number }[] } = {
  'Today': [
    { label: 'Court 1', occupancy: 60, peak: 80, offpeak: 40, revenue: 2800, target: 3200 },
    { label: 'Court 2', occupancy: 45, peak: 65, offpeak: 25, revenue: 2100, target: 3200 },
    { label: 'Court 3', occupancy: 70, peak: 90, offpeak: 50, revenue: 3200, target: 3200 },
    { label: 'Court 4', occupancy: 30, peak: 45, offpeak: 15, revenue: 1400, target: 3200 },
  ],
  'Yesterday': [
    { label: 'Court 1', occupancy: 82, peak: 95, offpeak: 68, revenue: 4200, target: 3200 },
    { label: 'Court 2', occupancy: 76, peak: 88, offpeak: 62, revenue: 3800, target: 3200 },
    { label: 'Court 3', occupancy: 90, peak: 100, offpeak: 78, revenue: 4500, target: 3200 },
    { label: 'Court 4', occupancy: 65, peak: 80, offpeak: 48, revenue: 3200, target: 3200 },
  ],
  'Past Week': [
    { label: 'Monday',    occupancy: 70,  peak: 88,  offpeak: 50, revenue: 12400, target: 10686 },
    { label: 'Tuesday',   occupancy: 55,  peak: 72,  offpeak: 36, revenue: 9800,  target: 10686 },
    { label: 'Wednesday', occupancy: 80,  peak: 95,  offpeak: 62, revenue: 14200, target: 10686 },
    { label: 'Thursday',  occupancy: 75,  peak: 90,  offpeak: 58, revenue: 13100, target: 10686 },
    { label: 'Friday',    occupancy: 95,  peak: 100, offpeak: 88, revenue: 18600, target: 10686 },
    { label: 'Saturday',  occupancy: 100, peak: 100, offpeak: 100, revenue: 21000, target: 10686 },
    { label: 'Sunday',    occupancy: 88,  peak: 96,  offpeak: 78, revenue: 17400, target: 10686 },
  ],
  'Past Month': [
    { label: 'Week 1', occupancy: 72, peak: 85, offpeak: 55, revenue: 68400,  target: 74802 },
    { label: 'Week 2', occupancy: 78, peak: 90, offpeak: 62, revenue: 74200,  target: 74802 },
    { label: 'Week 3', occupancy: 85, peak: 95, offpeak: 70, revenue: 81600,  target: 74802 },
    { label: 'Week 4', occupancy: 91, peak: 98, offpeak: 80, revenue: 87800,  target: 74802 },
  ],
  'Custom': [
    { label: 'Court 1', occupancy: 75, peak: 88, offpeak: 60, revenue: 3600, target: 3200 },
    { label: 'Court 2', occupancy: 68, peak: 80, offpeak: 54, revenue: 3200, target: 3200 },
  ],
}

const clubs = [
  { name: 'BALLITO',     courts: 3, pickle: 0 },
  { name: 'BEDFORDVIEW', courts: 3, pickle: 0 },
  { name: 'CENTURION',   courts: 4, pickle: 0 },
  { name: 'DURBANVILLE', courts: 3, pickle: 0 },
  { name: 'EPICENTRE',   courts: 5, pickle: 0 },
  { name: 'GATEWAY',     courts: 6, pickle: 0 },
  { name: 'GEORGE',      courts: 3, pickle: 0 },
  { name: 'GLEN',        courts: 3, pickle: 3 },
  { name: 'GROENKLOOF',  courts: 5, pickle: 0 },
  { name: 'HUDDLE',      courts: 6, pickle: 0 },
  { name: 'LORRAINE',    courts: 2, pickle: 0 },
  { name: 'LOURENSFORD', courts: 4, pickle: 2 },
  { name: 'LONEHILL',    courts: 4, pickle: 0 },
  { name: 'OLD EDS',     courts: 4, pickle: 0 },
  { name: 'POINT',       courts: 4, pickle: 3 },
  { name: 'RANDPARK',    courts: 4, pickle: 0 },
  { name: 'WOODSTOCK',   courts: 3, pickle: 0 },
]

const defaultConfig = {
  name: '',
  peakMorningStart: DEFAULT_PEAK_MORNING_START, peakMorningEnd: DEFAULT_PEAK_MORNING_END,
  peakEveningStart: DEFAULT_PEAK_EVENING_START, peakEveningEnd: DEFAULT_PEAK_EVENING_END,
}

const CATEGORY_LABELS: Record<string, string> = { staff: 'Staff', ambassador: 'Ambassadors' }
const PLAYER_CATEGORIES = ['staff', 'ambassador'] as const

const darkCard: React.CSSProperties = { ...T.card, padding: 0, marginBottom: '12px', overflow: 'hidden' }

// Same P&L math as generateEventsExcel — kept in sync deliberately so the
// on-screen numbers and the exported spreadsheet never disagree.
function calcEventFinancials(e: ReportEventRow) {
  const revenue = e.cost_per_person * e.players
  const courtExp = e.courts_used * e.duration * e.court_rate
  const drinkTotal = (e.drinks ?? []).reduce((s, d) => s + d.qty * d.unitPrice, 0)
  const ballTotal = (e.balls ?? []).reduce((s, b) => s + b.qty * b.unitPrice, 0)
  const adhocTotal = (e.adhoc ?? []).reduce((s, a) => s + a.amount, 0)
  const sponsorTotal = (e.sponsors ?? []).reduce((s, sp) => s + sp.amount, 0)
  const totalExp = courtExp + drinkTotal + ballTotal + adhocTotal
  const pl = revenue - totalExp + sponsorTotal
  const royalty = revenue * (e.royalty_rate ?? 0.06)
  const net = pl - royalty
  const isCompleted = new Date(e.event_date) < new Date(new Date().toDateString())
  return { revenue, totalExp, sponsorTotal, pl, royalty, net, status: isCompleted ? 'Completed' : 'Upcoming' }
}

export default function Reports() {
  const router = useRouter()
  const [occPeriod, setOccPeriod]           = useState('Yesterday')
  const [customRange, setCustomRange]       = useState({ from: '', to: '' })
  const [appliedRange, setAppliedRange]     = useState({ from: '', to: '' })
  const [showCustom, setShowCustom]         = useState(false)
  const [showPeakBars, setShowPeakBars]     = useState(false)
  const [clubConfig, setClubConfig]         = useState(defaultConfig)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [mounted, setMounted]               = useState(false)

  const [scope, setScope]           = useState<string | null>(null)
  const [loadingReal, setLoadingReal] = useState(true)
  const [realEvents, setRealEvents]   = useState<ReportEventRow[]>([])
  const [realPlayers, setRealPlayers] = useState<ReportPlayerRow[]>([])
  const [kpiTargets, setKpiTargets]   = useState<KpiTargetRow[]>([])

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    async function load() {
      const s = await getSelectedScope()
      if (!s) { router.push('/select-club'); return }
      setScope(s)

      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

      const [events, players, targets, config] = await Promise.all([
        listEventsForScope(s, monthStart, monthEnd),
        listPlayersForScope(s),
        listKpiTargets(),
        getClubConfigForScope(s),
      ])

      setRealEvents(events)
      setRealPlayers(players)
      setKpiTargets(targets)

      if (config) {
        const c: any = config
        setClubConfig({
          name: c.clubs?.name ?? '',
          peakMorningStart: c.peak_morning_start ?? DEFAULT_PEAK_MORNING_START,
          peakMorningEnd: c.peak_morning_end ?? DEFAULT_PEAK_MORNING_END,
          peakEveningStart: c.peak_evening_start ?? DEFAULT_PEAK_EVENING_START,
          peakEveningEnd: c.peak_evening_end ?? DEFAULT_PEAK_EVENING_END,
        })
      }

      setLoadingReal(false)
    }
    load()
  }, [router])

  const exportOccupancyToExcel = async () => {
    const now = new Date(), month = now.getMonth(), year = now.getFullYear()
    const clubData: { [key: string]: any[] } = {}
    clubs.forEach(club => {
      clubData[club.name] = (rows).map((row, i) => ({
        date: new Date(year, month, i + 1), occupancy: row.occupancy,
        revenue: row.revenue, pickleOccupancy: null, comments: '',
      }))
    })
    const configs = clubs.map(c => ({ name: c.name, courts: c.courts, pickle: c.pickle, dailyTarget: c.name === 'WOODSTOCK' ? 10686 : 8000 }))
    const blob = await generateOccupancyExcel(month, year, clubData, configs)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Occupancy_${now.toLocaleString('default', { month: 'long' })}_${year}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Occupancy (mock) ──────────────────────────────────────────────────────
  const rows     = occupancyData[occPeriod] ?? []
  const avgOcc   = Math.round(rows.reduce((a, r) => a + r.occupancy, 0) / (rows.length || 1))
  const totalRev = rows.reduce((a, r) => a + r.revenue, 0)
  const totalTarget = rows.reduce((a, r) => a + r.target, 0)
  const highestOcc = rows.length ? Math.max(...rows.map(r => r.occupancy)) : 0
  const lowestOcc  = rows.length ? Math.min(...rows.map(r => r.occupancy)) : 0
  const targetPct  = totalTarget > 0 ? Math.round((totalRev / totalTarget) * 100) : 0
  const highestRow = rows.find(r => r.occupancy === highestOcc)
  const lowestRow  = rows.find(r => r.occupancy === lowestOcc)

  const occColor = (v: number) => v >= 80 ? T.colors.green : v >= 60 ? T.colors.amber : T.colors.red
  const occGlow  = (v: number) => `0 0 8px ${occColor(v)}55`

  // ── Event P&L (real) ──────────────────────────────────────────────────────
  const eventsWithFinancials = useMemo(
    () => realEvents.map(e => ({ ...e, ...calcEventFinancials(e) })),
    [realEvents]
  )
  const completedEvents = eventsWithFinancials.filter(e => e.status === 'Completed')
  const totalEventRevenue = completedEvents.reduce((a, e) => a + e.revenue, 0)
  const totalEventExpense = completedEvents.reduce((a, e) => a + e.totalExp, 0)
  const totalEventRoyalty = completedEvents.reduce((a, e) => a + e.royalty, 0)
  const totalEventNet     = completedEvents.reduce((a, e) => a + e.net, 0)

  // ── Player Tracker (real) ─────────────────────────────────────────────────
  const targetByCategory = useMemo(() => {
    const map = new Map<string, KpiTargetRow>()
    kpiTargets.forEach(t => map.set(t.category, t))
    return map
  }, [kpiTargets])

  const categoryPlayers = activeCategory ? realPlayers.filter(p => p.category === activeCategory) : []
  const totalGames = realPlayers.reduce((a, p) => a + p.monthly_open_games + p.monthly_private_games, 0)
  const totalTarget2 = realPlayers.reduce((a, p) => {
    const t = targetByCategory.get(p.category)
    return a + (t ? t.open_game_target + t.private_game_target : 0)
  }, 0)
  const overallPct = totalTarget2 > 0 ? Math.round((totalGames / totalTarget2) * 100) : 0

  const peakLabel    = `${formatTimeLabel(clubConfig.peakMorningStart)}–${formatTimeLabel(clubConfig.peakMorningEnd)} & ${formatTimeLabel(clubConfig.peakEveningStart)}–${formatTimeLabel(clubConfig.peakEveningEnd)}`
  const offPeakLabel = `${formatTimeLabel(clubConfig.peakMorningEnd)}–${formatTimeLabel(clubConfig.peakEveningStart)}`
  const scopeIsCompany = scope === COMPANY_SCOPE

  return (
    <div style={{ minHeight: '100vh', background: T.colors.bg }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 36px' }}>

        {/* ── Page header ── */}
        <div style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.colors.red, boxShadow: T.shadow.redGlowSm }} />
            <span style={{ fontSize: '11px', color: T.colors.red, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Analytics</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: T.colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>Reports</h1>
          <p style={{ fontSize: '13px', color: T.colors.textSecondary, marginTop: '5px' }}>
            Occupancy, revenue, event summaries and player tracking
            {!scopeIsCompany && clubConfig.name && ` · ${clubConfig.name}`}
            {scopeIsCompany && ' · Entire Company'}
          </p>
        </div>

        {/* ══ 1. OCCUPANCY & REVENUE (mock — Playtomic-pending) ═══════════ */}
        <div style={darkCard}>

          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary }}>Occupancy &amp; Revenue</span>
              <span style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                fontSize: '10px', fontWeight: '600', color: T.colors.amber,
                background: T.colors.amberGlow, border: '1px solid rgba(245,158,11,0.25)',
                borderRadius: '999px', padding: '3px 10px', textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                <AlertTriangle size={11} /> Awaiting Playtomic Integration
              </span>
              <button onClick={exportOccupancyToExcel} style={{ ...T.btn.secondary, padding: '5px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Download size={12} /> Export
              </button>
              <button onClick={() => setShowPeakBars(!showPeakBars)} style={{
                ...T.btn.ghost, padding: '5px 12px', fontSize: '11px',
                background: showPeakBars ? T.colors.redGlow : 'transparent',
                color: showPeakBars ? T.colors.red : T.colors.textMuted,
                border: `1px solid ${showPeakBars ? 'rgba(224,10,9,0.3)' : T.colors.border}`,
              }}>
                {showPeakBars ? 'Peak View ✓' : 'Peak View'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {PERIODS.map(p => (
                <button key={p} onClick={() => { setOccPeriod(p); setShowCustom(p === 'Custom') }}
                  style={{ ...T.periodBtn(occPeriod === p), fontSize: '11px', padding: '5px 12px' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <p style={{ fontSize: '11px', color: T.colors.textMuted, margin: 0, padding: '10px 24px 0' }}>
            Sample data shown below for layout purposes only — not real occupancy figures. Wires up once Playtomic API access is available.
          </p>

          {showCustom && (
            <div style={{ padding: '14px 24px', borderBottom: `1px solid ${T.colors.border}`, display: 'flex', gap: '12px', alignItems: 'center', background: T.colors.surfaceRaised, marginTop: '14px' }}>
              <span style={{ fontSize: '11px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Range</span>
              <input type="date" value={customRange.from}
                onChange={e => setCustomRange(p => ({ ...p, from: e.target.value }))}
                style={{ ...T.input, width: '160px', padding: '7px 10px', fontSize: '13px' }} />
              <span style={{ fontSize: '12px', color: T.colors.textMuted }}>→</span>
              <input type="date" value={customRange.to}
                onChange={e => setCustomRange(p => ({ ...p, to: e.target.value }))}
                style={{ ...T.input, width: '160px', padding: '7px 10px', fontSize: '13px' }} />
              <button
                onClick={() => { setAppliedRange(customRange) }}
                style={{ ...T.btn.primary, padding: '7px 18px', fontSize: '12px' }}
              >Apply</button>
              {appliedRange.from && appliedRange.to && (
                <span style={{ fontSize: '12px', color: T.colors.green, fontFamily: "'SF Mono', monospace" }}>
                  ✓ {appliedRange.from} → {appliedRange.to}
                </span>
              )}
            </div>
          )}

          {rows.length > 0 && (
            <div style={{ padding: '14px 24px', borderBottom: `1px solid ${T.colors.border}`, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0', marginTop: '14px' }}>
              {[
                { label: 'Avg Occupancy', value: `${avgOcc}%`,  color: occColor(avgOcc), glow: true },
                { label: 'Highest',       value: `${highestOcc}% ${highestRow ? `(${highestRow.label})` : ''}`, color: T.colors.green, glow: false },
                { label: 'Lowest',        value: `${lowestOcc}% ${lowestRow ? `(${lowestRow.label})` : ''}`,   color: lowestOcc < 60 ? T.colors.red : T.colors.amber, glow: false },
                { label: 'Total Revenue', value: `R ${totalRev.toLocaleString()}`, color: T.colors.green, glow: true },
                { label: 'vs Target',     value: `${targetPct}%`, color: targetPct >= 100 ? T.colors.green : targetPct >= 80 ? T.colors.amber : T.colors.red, glow: false },
              ].map((s, i, arr) => (
                <div key={s.label} style={{ padding: '0 16px', borderRight: i < arr.length - 1 ? `1px solid ${T.colors.border}` : 'none' }}>
                  <p style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' }}>{s.label}</p>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: s.color, margin: 0, fontFamily: "'SF Mono', monospace", textShadow: s.glow ? `0 0 10px ${s.color}55` : 'none' }}>{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {totalTarget > 0 && (
            <div style={{ padding: '10px 24px', borderBottom: `1px solid ${T.colors.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>Revenue vs Target</span>
              <div style={{ flex: 1, background: T.colors.border, borderRadius: '4px', height: '6px', overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  width: `${Math.min(targetPct, 100)}%`, height: '6px', borderRadius: '4px',
                  background: targetPct >= 100 ? T.colors.green : targetPct >= 80 ? T.colors.amber : T.colors.red,
                  boxShadow: `0 0 8px ${(targetPct >= 100 ? T.colors.green : targetPct >= 80 ? T.colors.amber : T.colors.red)}55`,
                  transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                }} />
                <div style={{ position: 'absolute', top: 0, right: 0, width: '2px', height: '100%', background: T.colors.borderBright }} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: targetPct >= 100 ? T.colors.green : T.colors.amber, fontFamily: "'SF Mono', monospace", whiteSpace: 'nowrap' }}>
                R {totalRev.toLocaleString()} / R {totalTarget.toLocaleString()}
              </span>
            </div>
          )}

          <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: showPeakBars ? '110px 1fr 1fr 140px' : '110px 1fr 140px', gap: '16px', padding: '0 16px', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Label</span>
              {showPeakBars ? (
                <>
                  <span style={{ fontSize: '10px', color: T.colors.red, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Peak ({peakLabel})</span>
                  <span style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Off-Peak ({offPeakLabel})</span>
                </>
              ) : (
                <span style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Occupancy</span>
              )}
              <span style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'right' }}>Revenue</span>
            </div>

            {rows.map((row, idx) => (
              <div key={row.label} style={{
                display: 'grid',
                gridTemplateColumns: showPeakBars ? '110px 1fr 1fr 140px' : '110px 1fr 140px',
                alignItems: 'center', gap: '16px',
                padding: '14px 16px',
                background: idx % 2 === 0 ? T.colors.surfaceRaised : T.colors.surface,
                border: `1px solid ${T.colors.border}`,
                borderRadius: T.radius.md,
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'none' : 'translateY(6px)',
                transition: `opacity 0.3s ease ${idx * 40}ms, transform 0.3s ease ${idx * 40}ms`,
              }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary, fontFamily: "'SF Mono', monospace" }}>{row.label}</span>

                {showPeakBars ? (
                  <>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '10px', color: T.colors.textMuted }}>Peak</span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: T.colors.red, textShadow: T.shadow.redGlowSm }}>{row.peak}%</span>
                      </div>
                      <div style={{ background: T.colors.border, borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                        <div style={{ width: `${row.peak}%`, height: '6px', borderRadius: '4px', background: `linear-gradient(90deg, ${T.colors.red}, rgba(224,10,9,0.5))`, boxShadow: '0 0 6px rgba(224,10,9,0.4)', transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '10px', color: T.colors.textMuted }}>Off-Peak</span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: T.colors.textSecondary }}>{row.offpeak}%</span>
                      </div>
                      <div style={{ background: T.colors.border, borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                        <div style={{ width: `${row.offpeak}%`, height: '6px', borderRadius: '4px', background: T.colors.borderBright, transition: 'width 0.6s ease 0.1s' }} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Occupancy</span>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: occColor(row.occupancy), textShadow: occGlow(row.occupancy) }}>{row.occupancy}%</span>
                    </div>
                    <div style={{ background: T.colors.border, borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${row.occupancy}%`, height: '6px', borderRadius: '4px', background: occColor(row.occupancy), boxShadow: occGlow(row.occupancy), transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
                    </div>
                    <div style={{ position: 'relative', marginTop: '3px', height: '4px' }}>
                      <div style={{ position: 'absolute', left: `${Math.min((row.target / (row.target * 1.2)) * 100, 100)}%`, top: 0, width: '2px', height: '4px', background: T.colors.borderBright, borderRadius: '1px' }} />
                    </div>
                  </div>
                )}

                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 3px' }}>Revenue</p>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: T.colors.textPrimary, margin: 0, fontFamily: "'SF Mono', monospace" }}>R {row.revenue.toLocaleString()}</p>
                  {row.target > 0 && (
                    <p style={{ fontSize: '10px', color: row.revenue >= row.target ? T.colors.green : T.colors.textMuted, margin: '2px 0 0', fontFamily: "'SF Mono', monospace" }}>
                      {row.revenue >= row.target ? '↑' : '↓'} target R {row.target.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ margin: '0 24px 24px', padding: '14px 20px', borderRadius: T.radius.md, background: T.colors.surfaceRaised, border: `1px solid ${T.colors.borderBright}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: T.colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Total — {occPeriod === 'Custom' && appliedRange.from ? `${appliedRange.from} → ${appliedRange.to}` : occPeriod}
            </span>
            <div style={{ display: 'flex', gap: '40px' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px' }}>Avg Occupancy</p>
                <p style={{ fontSize: '18px', fontWeight: '700', color: occColor(avgOcc), margin: 0, fontFamily: "'SF Mono', monospace", textShadow: occGlow(avgOcc) }}>{avgOcc}%</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px' }}>Total Revenue</p>
                <p style={{ fontSize: '18px', fontWeight: '700', color: T.colors.green, margin: 0, fontFamily: "'SF Mono', monospace", textShadow: '0 0 12px rgba(34,197,94,0.3)' }}>R {totalRev.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ══ 2. EVENT P&L SUMMARY (real, this calendar month) ═══════════ */}
        <div style={darkCard}>
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary }}>Event P&amp;L Summary — This Month</span>
            <span style={{ fontSize: '11px', color: T.colors.textMuted }}>{eventsWithFinancials.length} event{eventsWithFinancials.length === 1 ? '' : 's'}</span>
          </div>
          <div style={{ padding: '16px 24px' }}>
            {loadingReal ? (
              <p style={{ fontSize: '13px', color: T.colors.textMuted, textAlign: 'center', padding: '24px' }}>Loading…</p>
            ) : eventsWithFinancials.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: T.colors.textMuted, fontSize: '13px' }}>
                No events logged this month{!scopeIsCompany ? ' for this club' : ''}.
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 110px 110px 100px 110px 90px', marginBottom: '8px', padding: '0 14px' }}>
                  {['Event', 'Players', 'Revenue', 'Expenses', 'Royalty', 'Net Profit', 'Status'].map((h, i) => (
                    <span key={h} style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: i > 0 ? 'right' : 'left' }}>{h}</span>
                  ))}
                </div>
                {eventsWithFinancials.map((ev, idx) => (
                  <div key={ev.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr 70px 110px 110px 100px 110px 90px',
                    padding: '13px 14px', borderRadius: T.radius.md, marginBottom: '4px', alignItems: 'center',
                    background: idx % 2 === 0 ? T.colors.surfaceRaised : T.colors.surface,
                    border: `1px solid ${T.colors.border}`,
                  }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary, margin: 0 }}>{ev.name}</p>
                      <p style={{ fontSize: '11px', color: T.colors.textMuted, margin: '3px 0 0', fontFamily: "'SF Mono', monospace" }}>
                        {new Date(ev.event_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                        {scopeIsCompany && ev.clubs?.name ? ` · ${ev.clubs.name}` : ''}
                      </p>
                    </div>
                    <span style={{ fontSize: '13px', color: T.colors.textSecondary, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>{ev.players}</span>
                    <span style={{ fontSize: '13px', color: T.colors.textSecondary, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>R {ev.revenue.toLocaleString()}</span>
                    <span style={{ fontSize: '13px', color: T.colors.textMuted, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>R {ev.totalExp.toLocaleString()}</span>
                    <span style={{ fontSize: '12px', color: T.colors.textMuted, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>R {ev.royalty.toLocaleString()}</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', textAlign: 'right', fontFamily: "'SF Mono', monospace", color: ev.net > 0 ? T.colors.green : T.colors.red, textShadow: ev.net > 0 ? '0 0 8px rgba(34,197,94,0.3)' : T.shadow.redGlowSm }}>
                      R {ev.net.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: '600', textAlign: 'center', padding: '3px 8px', borderRadius: '999px', marginLeft: 'auto', display: 'block', width: 'fit-content', ...(ev.status === 'Completed' ? T.badge.green : T.badge.amber) }}>{ev.status}</span>
                  </div>
                ))}
                <div style={{ marginTop: '10px', padding: '14px 16px', borderRadius: T.radius.md, background: T.colors.surfaceRaised, border: `1px solid ${T.colors.borderBright}`, display: 'grid', gridTemplateColumns: '1fr 70px 110px 110px 100px 110px 90px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: T.colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total (Completed)</span>
                  <span />
                  <span style={{ fontSize: '14px', fontWeight: '700', color: T.colors.textPrimary, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>R {totalEventRevenue.toLocaleString()}</span>
                  <span style={{ fontSize: '14px', color: T.colors.textMuted, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>R {totalEventExpense.toLocaleString()}</span>
                  <span style={{ fontSize: '13px', color: T.colors.textMuted, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>R {totalEventRoyalty.toLocaleString()}</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: T.colors.green, textAlign: 'right', fontFamily: "'SF Mono', monospace", textShadow: '0 0 12px rgba(34,197,94,0.3)' }}>R {totalEventNet.toLocaleString()}</span>
                  <span />
                </div>
              </>
            )}
          </div>
        </div>

        {/* ══ 3. PLAYER TRACKER (real) ═══════════════════════════════════ */}
        <div style={darkCard}>
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary }}>Player Tracker — Staff &amp; Ambassadors</span>
            <span style={{ fontSize: '11px', color: T.colors.textMuted }}>This month's game counts</span>
          </div>

          <div style={{ padding: '14px 24px', borderBottom: `1px solid ${T.colors.border}`, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0' }}>
            {[
              { label: 'Total Tracked',    value: String(realPlayers.length), color: T.colors.textPrimary },
              { label: 'Total Games',      value: String(totalGames),         color: T.colors.textPrimary },
              { label: 'Overall Progress', value: `${overallPct}%`,           color: overallPct >= 80 ? T.colors.green : overallPct >= 60 ? T.colors.amber : T.colors.red },
            ].map((s, i, arr) => (
              <div key={s.label} style={{ padding: '0 16px', borderRight: i < arr.length - 1 ? `1px solid ${T.colors.border}` : 'none' }}>
                <p style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' }}>{s.label}</p>
                <p style={{ fontSize: '15px', fontWeight: '700', color: s.color, margin: 0, fontFamily: "'SF Mono', monospace" }}>{s.value}</p>
              </div>
            ))}
          </div>

          <div style={{ padding: '10px 24px', borderBottom: `1px solid ${T.colors.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>Overall KPI</span>
            <div style={{ flex: 1, background: T.colors.border, borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(overallPct, 100)}%`, height: '6px', borderRadius: '4px', background: overallPct >= 80 ? T.colors.green : overallPct >= 60 ? T.colors.amber : T.colors.red, boxShadow: `0 0 8px ${(overallPct >= 80 ? T.colors.green : T.colors.amber)}55`, transition: 'width 0.6s ease' }} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: T.colors.textSecondary, fontFamily: "'SF Mono', monospace", whiteSpace: 'nowrap' }}>{totalGames} / {totalTarget2} games</span>
          </div>

          <div style={{ padding: '20px 24px' }}>
            {loadingReal ? (
              <p style={{ fontSize: '13px', color: T.colors.textMuted, textAlign: 'center', padding: '24px' }}>Loading…</p>
            ) : (
              <>
                <p style={{ fontSize: '11px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Select Category</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '24px' }}>
                  {PLAYER_CATEGORIES.map(cat => {
                    const catPlayers = realPlayers.filter(p => p.category === cat)
                    const catTotal   = catPlayers.reduce((a, p) => a + p.monthly_open_games + p.monthly_private_games, 0)
                    const t = targetByCategory.get(cat)
                    const catTarget  = t ? t.open_game_target + t.private_game_target : 0
                    const catPct     = catTarget > 0 ? Math.round((catTotal / catTarget) * 100) : 0
                    const isActive   = activeCategory === cat
                    const catColor   = catPct >= 100 ? T.colors.green : catPct >= 70 ? T.colors.amber : T.colors.red
                    return (
                      <button key={cat} onClick={() => setActiveCategory(isActive ? null : cat)} style={{
                        background: isActive ? T.colors.redGlow : T.colors.surfaceRaised,
                        border: `1px solid ${isActive ? T.colors.red : T.colors.border}`,
                        borderRadius: T.radius.md, padding: '14px 16px',
                        cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                        boxShadow: isActive ? T.shadow.redGlowSm : 'none',
                        transition: 'all 0.15s ease',
                      }}>
                        <p style={{ fontSize: '12px', fontWeight: '600', color: isActive ? T.colors.red : T.colors.textPrimary, margin: '0 0 4px' }}>{CATEGORY_LABELS[cat]}</p>
                        <p style={{ fontSize: '11px', color: T.colors.textMuted, margin: '0 0 10px' }}>{catPlayers.length} players · {catTotal}/{catTarget} games</p>
                        <div style={{ background: T.colors.border, borderRadius: '3px', height: '4px', overflow: 'hidden', marginBottom: '6px' }}>
                          <div style={{ width: `${Math.min(catPct, 100)}%`, height: '4px', background: isActive ? T.colors.red : catColor, borderRadius: '3px', transition: 'width 0.4s ease', boxShadow: `0 0 4px ${catColor}44` }} />
                        </div>
                        <p style={{ fontSize: '11px', color: isActive ? T.colors.red : catColor, margin: 0, fontFamily: "'SF Mono', monospace", fontWeight: '700' }}>{catPct}%</p>
                      </button>
                    )
                  })}
                </div>

                {activeCategory && (
                  <div style={{ borderTop: `1px solid ${T.colors.border}`, paddingTop: '20px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '700', color: T.colors.red, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>{CATEGORY_LABELS[activeCategory]}</p>
                    {categoryPlayers.length === 0 ? (
                      <p style={{ fontSize: '13px', color: T.colors.textMuted, padding: '16px 0' }}>No {CATEGORY_LABELS[activeCategory].toLowerCase()} on record{!scopeIsCompany ? ' for this club' : ''}.</p>
                    ) : (
                      categoryPlayers.map(player => (
                        <PlayerRow key={player.id} player={player} target={targetByCategory.get(player.category)} showClub={scopeIsCompany} />
                      ))
                    )}
                  </div>
                )}

                {!activeCategory && (
                  <div style={{ textAlign: 'center', padding: '24px', color: T.colors.textMuted, fontSize: '13px' }}>
                    Select a category above to view player breakdowns
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

function PlayerRow({ player, target, showClub }: { player: ReportPlayerRow; target?: KpiTargetRow; showClub: boolean }) {
  const played = player.monthly_open_games + player.monthly_private_games
  const targetTotal = target ? target.open_game_target + target.private_game_target : 0
  const pct        = targetTotal > 0 ? Math.round((played / targetTotal) * 100) : 0
  const color      = pct >= 100 ? T.colors.green : pct >= 70 ? T.colors.amber : T.colors.red
  const badgeStyle = pct >= 100 ? T.badge.green : pct >= 70 ? T.badge.amber : T.badge.red
  const label      = pct >= 100 ? 'Complete' : pct >= 70 ? 'On Track' : 'Behind'

  return (
    <div style={{ marginBottom: '6px', borderRadius: T.radius.md, border: `1px solid ${T.colors.border}`, overflow: 'hidden' }}>
      <div style={{
        padding: '14px 16px', background: T.colors.surface,
        display: 'grid', gridTemplateColumns: '1fr 200px 80px',
        alignItems: 'center', gap: '16px',
      }}>
        <div>
          <p style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary, margin: 0 }}>{player.name}</p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '10px', color: T.colors.red, fontFamily: "'SF Mono', monospace" }}>{player.monthly_private_games} private</span>
            <span style={{ fontSize: '10px', color: T.colors.green, fontFamily: "'SF Mono', monospace" }}>{player.monthly_open_games} open</span>
            {showClub && player.club_name && (
              <span style={{ fontSize: '10px', color: T.colors.textMuted, fontFamily: "'SF Mono', monospace" }}>· {player.club_name}</span>
            )}
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontSize: '11px', color: T.colors.textMuted, fontFamily: "'SF Mono', monospace" }}>{played} / {targetTotal} games</span>
            <span style={{ fontSize: '11px', fontWeight: '700', color, fontFamily: "'SF Mono', monospace" }}>{pct}%</span>
          </div>
          <div style={{ background: T.colors.border, borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(pct, 100)}%`, height: '6px', background: color, borderRadius: '4px', transition: 'width 0.4s ease', boxShadow: `0 0 6px ${color}44` }} />
          </div>
        </div>
        <span style={{ fontSize: '10px', fontWeight: '600', padding: '3px 8px', borderRadius: '999px', textAlign: 'center', whiteSpace: 'nowrap', ...badgeStyle }}>{label}</span>
      </div>
    </div>
  )
}