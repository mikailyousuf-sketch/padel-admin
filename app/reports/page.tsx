'use client'

import { useState, useEffect } from 'react'
import { generateOccupancyExcel } from '../lib/exportExcel'
import { ChevronDown, ChevronUp, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { theme } from '../components/theme'

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

const events = [
  { name: 'Corporate Tournament',    revenue: 18500, cost: 6200, date: '2 Jun',  status: 'Completed', registered: 26, capacity: 32,  target: 20000 },
  { name: 'Club Championship',       revenue: 12000, cost: 4500, date: '18 May', status: 'Completed', registered: 48, capacity: 48,  target: 10000 },
  { name: 'Ladies Social Evening',   revenue: 4800,  cost: 1200, date: '10 May', status: 'Completed', registered: 12, capacity: 12,  target: 5000  },
  { name: 'Junior Academy Day',      revenue: 6500,  cost: 2800, date: '3 May',  status: 'Completed', registered: 18, capacity: 24,  target: 8000  },
  { name: 'Business League Round 1', revenue: 9200,  cost: 3100, date: '14 Jun', status: 'Upcoming',  registered: 7,  capacity: 16,  target: 12000 },
]

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

const PLAYER_CATEGORIES = ['Staff', 'VAPC Members', 'Ambassadors', 'VIP'] as const
type PlayerCategory = typeof PLAYER_CATEGORIES[number]
type GameEntry = { date: string; type: string; gameType: 'Private' | 'Open/Public' | 'Social/Event' }
type Player = { name: string; category: PlayerCategory; gamesPlayed: number; target: number; private: number; open: number; social: number; games: GameEntry[] }

const playerData: Player[] = [
  { name: 'Jason Mokoena',     category: 'Staff',        gamesPlayed: 8,  target: 12, private: 3, open: 2, social: 3,
    games: [{ date: '3 Jun', type: 'Category A', gameType: 'Social/Event' }, { date: '7 Jun', type: 'Category B', gameType: 'Open/Public' }, { date: '12 Jun', type: 'Category A', gameType: 'Private' }] },
  { name: 'Lerato Dlamini',    category: 'Staff',        gamesPlayed: 11, target: 12, private: 4, open: 3, social: 4,
    games: [{ date: '1 Jun', type: 'Category A', gameType: 'Social/Event' }, { date: '5 Jun', type: 'Category A', gameType: 'Private' }, { date: '9 Jun', type: 'Category B', gameType: 'Open/Public' }, { date: '14 Jun', type: 'Category A', gameType: 'Social/Event' }] },
  { name: 'Sipho Ndlovu',      category: 'Ambassadors',  gamesPlayed: 5,  target: 8,  private: 1, open: 2, social: 2,
    games: [{ date: '4 Jun', type: 'Category B', gameType: 'Open/Public' }, { date: '10 Jun', type: 'Category A', gameType: 'Social/Event' }] },
  { name: 'Anika van der Berg',category: 'Ambassadors',  gamesPlayed: 7,  target: 8,  private: 2, open: 3, social: 2,
    games: [{ date: '2 Jun', type: 'Category A', gameType: 'Social/Event' }, { date: '8 Jun', type: 'Category B', gameType: 'Private' }, { date: '15 Jun', type: 'Category A', gameType: 'Open/Public' }] },
  { name: 'Tariq Hendricks',   category: 'VAPC Members', gamesPlayed: 14, target: 10, private: 6, open: 5, social: 3,
    games: [{ date: '1 Jun', type: 'Open', gameType: 'Open/Public' }, { date: '6 Jun', type: 'Private', gameType: 'Private' }] },
  { name: 'Nadia Rousseau',    category: 'VIP',          gamesPlayed: 3,  target: 4,  private: 2, open: 1, social: 0,
    games: [{ date: '5 Jun', type: 'Private', gameType: 'Private' }, { date: '11 Jun', type: 'Open', gameType: 'Open/Public' }] },
]

const defaultConfig = {
  name: 'Woodstock',
  weekdayOpen: '06:00', weekdayClose: '23:00',
  weekendOpen: '06:00', weekendClose: '22:00',
  courts: 3, hasPickleball: false, pickleballCourts: 0, dailyTarget: 10686,
  peakMorningStart: DEFAULT_PEAK_MORNING_START, peakMorningEnd: DEFAULT_PEAK_MORNING_END,
  peakEveningStart: DEFAULT_PEAK_EVENING_START, peakEveningEnd: DEFAULT_PEAK_EVENING_END,
}

const darkCard: React.CSSProperties = { ...T.card, padding: 0, marginBottom: '12px', overflow: 'hidden' }

export default function Reports() {
  const [occPeriod, setOccPeriod]           = useState('Yesterday')
  const [customRange, setCustomRange]       = useState({ from: '', to: '' })
  const [appliedRange, setAppliedRange]     = useState({ from: '', to: '' })
  const [showCustom, setShowCustom]         = useState(false)
  const [showPeakBars, setShowPeakBars]     = useState(false)
  const [clubConfig, setClubConfig]         = useState(defaultConfig)
  const [activeCategory, setActiveCategory] = useState<PlayerCategory | null>(null)
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null)
  const [playerPeriod, setPlayerPeriod]     = useState('This Month')
  const [mounted, setMounted]               = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('padel_clubs')
    if (saved) {
      const savedClubs = JSON.parse(saved)
      if (savedClubs.length > 0) setClubConfig({ ...defaultConfig, ...savedClubs[0] })
    }
  }, [])

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
    a.download = `VA_Padel_Occupancy_${now.toLocaleString('default', { month: 'long' })}_${year}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  const rows     = occupancyData[occPeriod] ?? []
  const avgOcc   = Math.round(rows.reduce((a, r) => a + r.occupancy, 0) / (rows.length || 1))
  const totalRev = rows.reduce((a, r) => a + r.revenue, 0)
  const totalTarget = rows.reduce((a, r) => a + r.target, 0)
  const highestOcc = rows.length ? Math.max(...rows.map(r => r.occupancy)) : 0
  const lowestOcc  = rows.length ? Math.min(...rows.map(r => r.occupancy)) : 0
  const targetPct  = totalTarget > 0 ? Math.round((totalRev / totalTarget) * 100) : 0
  const highestRow = rows.find(r => r.occupancy === highestOcc)
  const lowestRow  = rows.find(r => r.occupancy === lowestOcc)

  const completedEvents = events.filter(e => e.status === 'Completed')
  const totalRevenue = completedEvents.reduce((a, e) => a + e.revenue, 0)
  const totalCost    = completedEvents.reduce((a, e) => a + e.cost, 0)
  const totalProfit  = totalRevenue - totalCost

  const occColor = (v: number) => v >= 80 ? T.colors.green : v >= 60 ? T.colors.amber : T.colors.red
  const occGlow  = (v: number) => `0 0 8px ${occColor(v)}55`

  const categoryPlayers = activeCategory ? playerData.filter(p => p.category === activeCategory) : []
  const totalGames  = playerData.reduce((a, p) => a + p.gamesPlayed, 0)
  const totalTarget2 = playerData.reduce((a, p) => a + p.target, 0)
  const overallPct  = Math.round((totalGames / totalTarget2) * 100)

  const peakLabel    = `${formatTimeLabel(clubConfig.peakMorningStart)}–${formatTimeLabel(clubConfig.peakMorningEnd)} & ${formatTimeLabel(clubConfig.peakEveningStart)}–${formatTimeLabel(clubConfig.peakEveningEnd)}`
  const offPeakLabel = `${formatTimeLabel(clubConfig.peakMorningEnd)}–${formatTimeLabel(clubConfig.peakEveningStart)}`

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
          <p style={{ fontSize: '13px', color: T.colors.textSecondary, marginTop: '5px' }}>Occupancy, revenue, event summaries and player tracking</p>
        </div>

        {/* ══ 1. OCCUPANCY & REVENUE ══════════════════════════════════════ */}
        <div style={darkCard}>

          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary }}>Occupancy &amp; Revenue</span>
              <button onClick={exportOccupancyToExcel} style={{ ...T.btn.secondary, padding: '5px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Download size={12} /> Export
              </button>
              {/* Peak/off-peak toggle */}
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

          {/* Custom range picker */}
          {showCustom && (
            <div style={{ padding: '14px 24px', borderBottom: `1px solid ${T.colors.border}`, display: 'flex', gap: '12px', alignItems: 'center', background: T.colors.surfaceRaised }}>
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

          {/* Summary stats strip */}
          {rows.length > 0 && (
            <div style={{ padding: '14px 24px', borderBottom: `1px solid ${T.colors.border}`, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0' }}>
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

          {/* Revenue vs target mini bar */}
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
                {/* Target line at 100% */}
                <div style={{ position: 'absolute', top: 0, right: 0, width: '2px', height: '100%', background: T.colors.borderBright }} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: targetPct >= 100 ? T.colors.green : T.colors.amber, fontFamily: "'SF Mono', monospace", whiteSpace: 'nowrap' }}>
                R {totalRev.toLocaleString()} / R {totalTarget.toLocaleString()}
              </span>
            </div>
          )}

          {/* Occupancy rows */}
          <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>

            {/* Column headers */}
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
                    {/* Peak bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '10px', color: T.colors.textMuted }}>Peak</span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: T.colors.red, textShadow: T.shadow.redGlowSm }}>{row.peak}%</span>
                      </div>
                      <div style={{ background: T.colors.border, borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                        <div style={{ width: `${row.peak}%`, height: '6px', borderRadius: '4px', background: `linear-gradient(90deg, ${T.colors.red}, rgba(224,10,9,0.5))`, boxShadow: '0 0 6px rgba(224,10,9,0.4)', transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                    {/* Off-peak bar */}
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
                  /* Standard occupancy bar */
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Occupancy</span>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: occColor(row.occupancy), textShadow: occGlow(row.occupancy) }}>{row.occupancy}%</span>
                    </div>
                    <div style={{ background: T.colors.border, borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${row.occupancy}%`, height: '6px', borderRadius: '4px', background: occColor(row.occupancy), boxShadow: occGlow(row.occupancy), transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
                    </div>
                    {/* Target line */}
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

          {/* Totals bar */}
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

        {/* ══ 2. EVENT P&L SUMMARY ════════════════════════════════════════ */}
        <div style={darkCard}>
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.colors.border}` }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary }}>Event P&amp;L Summary</span>
          </div>
          <div style={{ padding: '16px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px 110px 110px 90px', marginBottom: '8px', padding: '0 14px' }}>
              {['Event', 'Players', 'Revenue', 'Cost', 'Profit', 'Status'].map((h, i) => (
                <span key={h} style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: i > 0 ? 'right' : 'left' }}>{h}</span>
              ))}
            </div>
            {events.map((ev, idx) => {
              const profit   = ev.revenue - ev.cost
              const fillPct  = Math.round((ev.registered / ev.capacity) * 100)
              const isFull   = fillPct >= 100
              const revPct   = Math.round((ev.revenue / ev.target) * 100)
              return (
                <div key={ev.name} style={{
                  borderRadius: T.radius.md, marginBottom: '4px',
                  background: idx % 2 === 0 ? T.colors.surfaceRaised : T.colors.surface,
                  border: `1px solid ${T.colors.border}`, overflow: 'hidden',
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px 110px 110px 90px', padding: '13px 14px', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary, margin: 0 }}>{ev.name}</p>
                      <p style={{ fontSize: '11px', color: T.colors.textMuted, margin: '3px 0 0', fontFamily: "'SF Mono', monospace" }}>{ev.date}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '999px', background: isFull ? T.colors.redGlow : T.colors.greenGlow, color: isFull ? T.colors.red : T.colors.green, border: `1px solid ${isFull ? 'rgba(224,10,9,0.2)' : 'rgba(34,197,94,0.2)'}`, fontFamily: "'SF Mono', monospace" }}>
                        {ev.registered}/{ev.capacity}
                      </span>
                    </div>
                    <span style={{ fontSize: '13px', color: T.colors.textSecondary, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>R {ev.revenue.toLocaleString()}</span>
                    <span style={{ fontSize: '13px', color: T.colors.textMuted, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>R {ev.cost.toLocaleString()}</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', textAlign: 'right', fontFamily: "'SF Mono', monospace", color: profit > 0 ? T.colors.green : T.colors.red, textShadow: profit > 0 ? '0 0 8px rgba(34,197,94,0.3)' : T.shadow.redGlowSm }}>
                      R {profit.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: '600', textAlign: 'center', padding: '3px 8px', borderRadius: '999px', marginLeft: 'auto', display: 'block', width: 'fit-content', ...(ev.status === 'Completed' ? T.badge.green : T.badge.amber) }}>{ev.status}</span>
                  </div>
                  {/* Revenue vs target mini bar */}
                  <div style={{ padding: '0 14px 10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '9px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Revenue vs target</span>
                    <div style={{ flex: 1, background: T.colors.border, borderRadius: '3px', height: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(revPct, 100)}%`, height: '4px', borderRadius: '3px', background: revPct >= 100 ? T.colors.green : revPct >= 80 ? T.colors.amber : T.colors.red, transition: 'width 0.5s ease', boxShadow: `0 0 4px ${revPct >= 100 ? T.colors.green : T.colors.amber}44` }} />
                    </div>
                    <span style={{ fontSize: '10px', color: revPct >= 100 ? T.colors.green : T.colors.textMuted, fontFamily: "'SF Mono', monospace", whiteSpace: 'nowrap' }}>{revPct}%</span>
                  </div>
                </div>
              )
            })}
            <div style={{ marginTop: '10px', padding: '14px 16px', borderRadius: T.radius.md, background: T.colors.surfaceRaised, border: `1px solid ${T.colors.borderBright}`, display: 'grid', gridTemplateColumns: '1fr 80px 110px 110px 110px 90px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: T.colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total (Completed)</span>
              <span />
              <span style={{ fontSize: '14px', fontWeight: '700', color: T.colors.textPrimary, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>R {totalRevenue.toLocaleString()}</span>
              <span style={{ fontSize: '14px', color: T.colors.textMuted, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>R {totalCost.toLocaleString()}</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: T.colors.green, textAlign: 'right', fontFamily: "'SF Mono', monospace", textShadow: '0 0 12px rgba(34,197,94,0.3)' }}>R {totalProfit.toLocaleString()}</span>
              <span />
            </div>
          </div>
        </div>

        {/* ══ 3. PLAYER TRACKER ══════════════════════════════════════════ */}
        <div style={darkCard}>
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary }}>Player Tracker</span>
              <span style={{ fontSize: '10px', color: T.colors.red, background: T.colors.redGlow, border: `1px solid rgba(224,10,9,0.2)`, borderRadius: '999px', padding: '2px 8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>API Ready</span>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {['This Week', 'This Month', 'Last Month'].map(p => (
                <button key={p} onClick={() => setPlayerPeriod(p)} style={{ ...T.periodBtn(playerPeriod === p), fontSize: '11px', padding: '5px 12px' }}>{p}</button>
              ))}
            </div>
          </div>

          {/* Overall KPI strip */}
          <div style={{ padding: '14px 24px', borderBottom: `1px solid ${T.colors.border}`, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0' }}>
            {[
              { label: 'Total Players',    value: String(playerData.length),    color: T.colors.textPrimary },
              { label: 'Total Games',      value: String(totalGames),           color: T.colors.textPrimary },
              { label: 'Overall Progress', value: `${overallPct}%`,             color: overallPct >= 80 ? T.colors.green : overallPct >= 60 ? T.colors.amber : T.colors.red },
              { label: 'Period',           value: playerPeriod,                  color: T.colors.textSecondary },
            ].map((s, i, arr) => (
              <div key={s.label} style={{ padding: '0 16px', borderRight: i < arr.length - 1 ? `1px solid ${T.colors.border}` : 'none' }}>
                <p style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' }}>{s.label}</p>
                <p style={{ fontSize: '15px', fontWeight: '700', color: s.color, margin: 0, fontFamily: "'SF Mono', monospace" }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Overall progress bar */}
          <div style={{ padding: '10px 24px', borderBottom: `1px solid ${T.colors.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>Overall KPI</span>
            <div style={{ flex: 1, background: T.colors.border, borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(overallPct, 100)}%`, height: '6px', borderRadius: '4px', background: overallPct >= 80 ? T.colors.green : overallPct >= 60 ? T.colors.amber : T.colors.red, boxShadow: `0 0 8px ${(overallPct >= 80 ? T.colors.green : T.colors.amber)}55`, transition: 'width 0.6s ease' }} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: T.colors.textSecondary, fontFamily: "'SF Mono', monospace", whiteSpace: 'nowrap' }}>{totalGames} / {totalTarget2} games</span>
          </div>

          <div style={{ padding: '20px 24px' }}>
            <p style={{ fontSize: '11px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Select Category</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '24px' }}>
              {PLAYER_CATEGORIES.map(cat => {
                const catPlayers = playerData.filter(p => p.category === cat)
                const catTotal   = catPlayers.reduce((a, p) => a + p.gamesPlayed, 0)
                const catTarget  = catPlayers.reduce((a, p) => a + p.target, 0)
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
                    <p style={{ fontSize: '12px', fontWeight: '600', color: isActive ? T.colors.red : T.colors.textPrimary, margin: '0 0 4px' }}>{cat}</p>
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
                <p style={{ fontSize: '11px', fontWeight: '700', color: T.colors.red, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>{activeCategory}</p>
                {categoryPlayers.map(player => (
                  <PlayerRow
                    key={player.name}
                    player={player}
                    expanded={expandedPlayer === player.name}
                    onToggle={() => setExpandedPlayer(expandedPlayer === player.name ? null : player.name)}
                  />
                ))}
              </div>
            )}

            {!activeCategory && (
              <div style={{ textAlign: 'center', padding: '24px', color: T.colors.textMuted, fontSize: '13px' }}>
                Select a category above to view player breakdowns
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

function PlayerRow({ player, expanded, onToggle }: { player: Player; expanded: boolean; onToggle: () => void }) {
  const pct        = Math.round((player.gamesPlayed / player.target) * 100)
  const color      = pct >= 100 ? T.colors.green : pct >= 70 ? T.colors.amber : T.colors.red
  const badgeStyle = pct >= 100 ? T.badge.green : pct >= 70 ? T.badge.amber : T.badge.red
  const label      = pct >= 100 ? 'Complete' : pct >= 70 ? 'On Track' : 'Behind'

  const GAME_TYPE_COLORS: Record<string, { color: string; bg: string }> = {
    'Private':      { color: T.colors.red,   bg: T.colors.redGlow   },
    'Open/Public':  { color: T.colors.green, bg: T.colors.greenGlow },
    'Social/Event': { color: T.colors.amber, bg: T.colors.amberGlow },
  }

  return (
    <div style={{ marginBottom: '6px', borderRadius: T.radius.md, border: `1px solid ${expanded ? T.colors.borderBright : T.colors.border}`, overflow: 'hidden', transition: 'border-color 0.15s' }}>
      <button onClick={onToggle} style={{
        width: '100%', padding: '14px 16px',
        background: expanded ? T.colors.surfaceRaised : T.colors.surface,
        border: 'none', cursor: 'pointer',
        display: 'grid', gridTemplateColumns: '1fr 200px 80px 28px',
        alignItems: 'center', gap: '16px', fontFamily: 'inherit',
        transition: 'background 0.15s',
      }}>
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary, margin: 0 }}>{player.name}</p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            {[
              { label: `${player.private} private`,       color: T.colors.red   },
              { label: `${player.open} open`,             color: T.colors.green },
              { label: `${player.social} social/events`,  color: T.colors.amber },
            ].map(t => (
              <span key={t.label} style={{ fontSize: '10px', color: t.color, fontFamily: "'SF Mono', monospace" }}>{t.label}</span>
            ))}
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontSize: '11px', color: T.colors.textMuted, fontFamily: "'SF Mono', monospace" }}>{player.gamesPlayed} / {player.target} games</span>
            <span style={{ fontSize: '11px', fontWeight: '700', color, fontFamily: "'SF Mono', monospace" }}>{pct}%</span>
          </div>
          <div style={{ background: T.colors.border, borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(pct, 100)}%`, height: '6px', background: color, borderRadius: '4px', transition: 'width 0.4s ease', boxShadow: `0 0 6px ${color}44` }} />
          </div>
        </div>
        <span style={{ fontSize: '10px', fontWeight: '600', padding: '3px 8px', borderRadius: '999px', textAlign: 'center', whiteSpace: 'nowrap', ...badgeStyle }}>{label}</span>
        {expanded ? <ChevronUp size={14} color={T.colors.textMuted} /> : <ChevronDown size={14} color={T.colors.textMuted} />}
      </button>

      {expanded && (
        <div style={{ padding: '16px 16px 20px', background: T.colors.bg, borderTop: `1px solid ${T.colors.border}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
            {[
              { label: 'Private Games',    count: player.private, color: T.colors.red,   glow: T.colors.redGlow   },
              { label: 'Open / Public',    count: player.open,    color: T.colors.green, glow: T.colors.greenGlow },
              { label: 'Socials / Events', count: player.social,  color: T.colors.amber, glow: T.colors.amberGlow },
            ].map(g => (
              <div key={g.label} style={{ background: g.glow, border: `1px solid ${g.color}22`, borderRadius: T.radius.md, padding: '12px 14px' }}>
                <p style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>{g.label}</p>
                <p style={{ fontSize: '22px', fontWeight: '700', color: g.color, margin: 0, fontFamily: "'SF Mono', monospace" }}>{g.count}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '10px', fontWeight: '700', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Game Log</p>
          <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 120px', marginBottom: '6px', padding: '0 10px' }}>
            {['Date', 'Category', 'Type'].map(h => (
              <span key={h} style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
            ))}
          </div>
          {player.games.map((g, i) => {
            const tc = GAME_TYPE_COLORS[g.gameType] ?? { color: T.colors.textSecondary, bg: T.colors.surfaceRaised }
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 120px', padding: '9px 10px', borderRadius: T.radius.sm, background: i % 2 === 0 ? T.colors.surfaceRaised : T.colors.surface, marginBottom: '3px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: T.colors.textMuted, fontFamily: "'SF Mono', monospace" }}>{g.date}</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: T.colors.textPrimary }}>{g.type}</span>
                <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '999px', background: tc.bg, color: tc.color, border: `1px solid ${tc.color}22`, width: 'fit-content' }}>{g.gameType}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}