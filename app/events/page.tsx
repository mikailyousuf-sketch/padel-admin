'use client'

import { monthRange } from '@/lib/reporting/dates'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronUp, ChevronDown, Plus, Download, AlertTriangle } from 'lucide-react'
import { theme } from '../components/theme'
import {
  listActiveClubs, listEventsForClub, listAllClubsForMonth,
  createEvent, updateEventField, deleteEvent, ClubEventRow,
} from './actions'
import { generateEventsExcel, generateAllClubsEventsExcel } from '../lib/exportExcel'
import { getSelectedScope } from '@/lib/scope/actions'
import { COMPANY_SCOPE } from '@/lib/scope/constants'

const T = theme

const DRINK_PRICE_LIST = [
  { name: 'Powerade', price: 11.41 }, { name: 'Coke 300ml', price: 9.66 },
  { name: 'Coke No Sugar', price: 9.62 }, { name: 'Valpre Still Water', price: 9.10 },
  { name: 'Valpre Sparkling Water', price: 9.10 }, { name: 'Appletiser', price: 13.58 },
  { name: 'Red Bull', price: 16.04 }, { name: 'Red Bull Sugar Free', price: 16.04 },
  { name: 'Monster Original 500ml', price: 15.69 }, { name: 'Sprite No Sugar', price: 8.85 },
  { name: 'Schweppes Lemonade', price: 7.68 }, { name: 'Sparl Creme Soda', price: 8.89 },
  { name: 'Bar One Chocolate', price: 10.25 }, { name: 'Jungle Bar Berries', price: 8.14 },
  { name: 'E/Bar Strawberry', price: 11.17 }, { name: 'Coffee', price: 34.00 },
  { name: 'Smoothie', price: 50.00 }, { name: 'Prego Roll', price: 50.00 },
]
const BALL_PRICE_LIST = [
  { name: 'Lok Fresh Balls', price: 79.20 }, { name: 'Adidas Balls Speed RX', price: 82.38 },
  { name: 'Wilson Padel X3', price: 85.19 }, { name: 'Bullpadel Next Balls', price: 89.26 },
  { name: 'BAB Court X3 Tube Ball', price: 94.73 }, { name: 'Tretorn Balls', price: 87.12 },
  { name: 'Wilson Prem Balls Silver H/A', price: 99.33 }, { name: 'Wilson Prem Balls Gold S/L', price: 99.00 },
  { name: 'POW Pickle Balls Rentals', price: 57.90 },
]

const EVENT_TYPES = ['CLUB SOCIAL', 'AMBASSADOR SOCIAL', 'COACH SOCIAL', 'CLUB TOURNAMENT', 'SPONSORED TOURNAMENT', 'JUNIOR ACADEMY', 'CORPORATE EVENT']

const TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  'CLUB SOCIAL':          { bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6', border: 'rgba(59,130,246,0.2)'  },
  'AMBASSADOR SOCIAL':    { bg: 'rgba(168,85,247,0.1)',  color: '#a855f7', border: 'rgba(168,85,247,0.2)'  },
  'COACH SOCIAL':         { bg: 'rgba(249,115,22,0.1)',  color: '#f97316', border: 'rgba(249,115,22,0.2)'  },
  'CLUB TOURNAMENT':      { bg: T.colors.redGlow,        color: T.colors.red, border: 'rgba(224,10,9,0.2)' },
  'SPONSORED TOURNAMENT': { bg: T.colors.greenGlow,      color: T.colors.green, border: 'rgba(34,197,94,0.2)' },
  'JUNIOR ACADEMY':       { bg: T.colors.amberGlow,      color: T.colors.amber, border: 'rgba(245,158,11,0.2)' },
  'CORPORATE EVENT':      { bg: 'rgba(2,132,199,0.1)',   color: '#0284c7', border: 'rgba(2,132,199,0.2)'   },
}

const darkInp: React.CSSProperties = { ...T.input, padding: '8px 10px', fontSize: '13px' }

function SubLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '10px', color: T.colors.red, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px' }}>{children}</p>
}
function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick} style={{ fontSize: '12px', color: T.colors.red, background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit', padding: 0 }}>{label}</button>
}
function TotalLine({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div style={{ textAlign: 'right', marginTop: '4px' }}>
      <span style={{ fontSize: '12px', color: T.colors.textMuted }}>
        {label}: <strong style={{ color: green ? T.colors.green : T.colors.textPrimary, fontFamily: "'SF Mono', monospace" }}>R {value}</strong>
      </span>
    </div>
  )
}
function SortHeader({ label, col, sortBy, sortDir, onClick, align }: {
  label: string; col: string; sortBy: string; sortDir: 'asc' | 'desc'; onClick: () => void; align?: 'left' | 'right'
}) {
  const active = sortBy === col
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
      display: 'flex', alignItems: 'center', gap: '4px', padding: 0,
      justifyContent: align === 'right' ? 'flex-end' : 'flex-start', width: '100%',
    }}>
      <span style={{ fontSize: '10px', color: active ? T.colors.red : T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: active ? '700' : '400' }}>{label}</span>
      {active && (sortDir === 'desc' ? <ChevronDown size={11} color={T.colors.red} /> : <ChevronUp size={11} color={T.colors.red} />)}
    </button>
  )
}

const MONTH_OPTIONS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]

function calcRevenue(e: ClubEventRow)  { return e.cost_per_person * e.players }
function calcCourtExp(e: ClubEventRow) { return e.courts_used * e.duration * e.court_rate }
function calcDrinkTotal(e: ClubEventRow) { return (e.drinks ?? []).reduce((s, d) => s + d.qty * d.unitPrice, 0) }
function calcBallTotal(e: ClubEventRow)  { return (e.balls ?? []).reduce((s, b) => s + b.qty * b.unitPrice, 0) }
function calcAdhocTotal(e: ClubEventRow) { return (e.adhoc ?? []).reduce((s, a) => s + a.amount, 0) }
function calcSponsorTotal(e: ClubEventRow) { return (e.sponsors ?? []).reduce((s, sp) => s + sp.amount, 0) }
function calcTotalExp(e: ClubEventRow) { return calcCourtExp(e) + calcDrinkTotal(e) + calcBallTotal(e) + calcAdhocTotal(e) }
function calcPL(e: ClubEventRow) { return calcRevenue(e) - calcTotalExp(e) + calcSponsorTotal(e) }
// Royalty rate is per-club (Revenue & Targets) and snapshotted onto each
// event at creation — no longer a hardcoded flat 6% for every club.
function calcRoyalty(e: ClubEventRow) { return calcRevenue(e) * (e.royalty_rate ?? 0.06) }
function calcNet(e: ClubEventRow) { return calcPL(e) - calcRoyalty(e) }
function calcMargin(e: ClubEventRow) { const r = calcRevenue(e); return r === 0 ? 0 : calcNet(e) / r }
function weekOfMonth(dateStr: string) { return Math.ceil(new Date(dateStr).getDate() / 7) }

export default function EventsPage() {
  const router = useRouter()
  const [view, setView] = useState<'single' | 'all'>('single')
  const [clubs, setClubs] = useState<{ id: string; name: string }[]>([])
  const [selectedClubId, setSelectedClubId] = useState<string>('')
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR)
  const [events, setEvents] = useState<ClubEventRow[]>([])
  const [allClubsEvents, setAllClubsEvents] = useState<(ClubEventRow & { clubs: { name: string } })[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'revenue' | 'pl' | 'margin'>('revenue')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [loading, setLoading] = useState(true)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [scopeReady, setScopeReady] = useState(false)
  const [scopeIsCompany, setScopeIsCompany] = useState(false)

  const monthLabel = `${MONTH_OPTIONS[selectedMonthIdx]} ${selectedYear}`
  const { from: monthStart, to: monthEnd } = monthRange(selectedYear, selectedMonthIdx)

  // Land on whatever was chosen at /select-club — company-wide summary if
  // "Entire Company" was picked, or straight into that specific club's
  // single view — instead of always defaulting to view='single' + whichever
  // club happened to load first.
  useEffect(() => {
    async function initScope() {
      const scope = await getSelectedScope()
      if (!scope) { router.push('/select-club'); return }

      const c = await listActiveClubs()
      setClubs(c)

      if (scope === COMPANY_SCOPE) {
        setScopeIsCompany(true)
        setView('all')
        if (c.length > 0) setSelectedClubId(c[0].id)
      } else {
        setScopeIsCompany(false)
        setView('single')
        setSelectedClubId(scope)
      }
      setScopeReady(true)
    }
    initScope()
  }, [router])

  async function reloadSingle() {
    if (!selectedClubId) return
    const data = await listEventsForClub(selectedClubId, monthStart, monthEnd)
    setEvents(data)
    setLoading(false)
  }

  async function reloadAll() {
    const data = await listAllClubsForMonth(monthStart, monthEnd)
    setAllClubsEvents(data)
    setLoading(false)
  }

  useEffect(() => {
    if (!scopeReady) return
    setLoading(true)
    if (view === 'single') reloadSingle()
    else reloadAll()
  }, [scopeReady, view, selectedClubId, selectedMonthIdx, selectedYear])

  async function handleAddEvent(formData: FormData) {
    formData.set('clubId', selectedClubId)
    await createEvent(formData)
    setShowAddEvent(false)
    await reloadSingle()
  }

  // Optimistic update, but now actually checked: if the server call fails,
  // the screen previously kept showing the edited value forever with no
  // indication it never saved. Now it reverts to the real data and says why.
  async function handleFieldUpdate(eventId: string, field: string, value: any) {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, [field]: value } : e))
    try {
      await updateEventField(eventId, field, value)
    } catch (err: any) {
      console.error(err)
      setFieldError(`That change didn't save (${err?.message ?? 'unknown error'}) — reverted.`)
      await reloadSingle()
      setTimeout(() => setFieldError(null), 6000)
    }
  }

  async function handleDelete(eventId: string) {
    if (!window.confirm('Delete this event? This cannot be undone.')) return
    await deleteEvent(eventId)
    await reloadSingle()
  }

  async function handleExportSingle() {
    const exportEvents = events.map((e, idx) => ({
      id: idx + 1,
      week: weekOfMonth(e.event_date),
      type: e.event_type,
      name: e.name,
      date: new Date(e.event_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }),
      costPerPerson: e.cost_per_person,
      players: e.players,
      courtsUsed: e.courts_used,
      duration: e.duration,
      courtRate: e.court_rate,
      royaltyRate: e.royalty_rate ?? 0.06,
    }))
    const expensesMap: Record<number, any> = {}
    events.forEach((e, idx) => {
      expensesMap[idx + 1] = {
        drinks: (e.drinks ?? []).map(d => ({ drinkName: d.name, qty: d.qty, unitPrice: d.unitPrice })),
        balls: (e.balls ?? []).map(b => ({ ballName: b.name, qty: b.qty, unitPrice: b.unitPrice })),
        adhoc: e.adhoc ?? [],
        sponsors: (e.sponsors ?? []).map(sp => ({ ...sp, popFile: null })),
      }
    })
    const blob = await generateEventsExcel(selectedClubName, MONTH_OPTIONS[selectedMonthIdx], selectedYear, exportEvents, expensesMap)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Events_${selectedClubName.replace(/\s+/g, '-')}_${MONTH_OPTIONS[selectedMonthIdx]}_${selectedYear}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleExportAll() {
    const summaries = clubSummaries.map(c => ({
      name: c.name, eventCount: c.eventCount, revenue: c.revenue,
      expenses: c.expenses, pl: c.pl, net: c.net, margin: c.margin,
    }))
    const blob = await generateAllClubsEventsExcel(MONTH_OPTIONS[selectedMonthIdx], selectedYear, summaries)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Events_AllClubs_${MONTH_OPTIONS[selectedMonthIdx]}_${selectedYear}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  const selectedClubName = clubs.find(c => c.id === selectedClubId)?.name ?? ''

  const totalRev = events.reduce((s, e) => s + calcRevenue(e), 0)
  const totalExp = events.reduce((s, e) => s + calcTotalExp(e), 0)
  const totalPL  = events.reduce((s, e) => s + calcPL(e), 0)
  const totalNet = events.reduce((s, e) => s + calcNet(e), 0)

  const clubSummaries = clubs.map(club => {
    const clubEvents = allClubsEvents.filter(e => e.club_id === club.id)
    const revenue = clubEvents.reduce((s, e) => s + calcRevenue(e), 0)
    const expenses = clubEvents.reduce((s, e) => s + calcTotalExp(e), 0)
    const pl = clubEvents.reduce((s, e) => s + calcPL(e), 0)
    const net = clubEvents.reduce((s, e) => s + calcNet(e), 0)
    const margin = revenue === 0 ? 0 : net / revenue
    return { name: club.name, eventCount: clubEvents.length, revenue, expenses, pl, net, margin }
  })

  const sortedSummary = [...clubSummaries].sort((a, b) => {
    let cmp = 0
    if (sortBy === 'name')    cmp = a.name.localeCompare(b.name)
    if (sortBy === 'revenue') cmp = a.revenue - b.revenue
    if (sortBy === 'pl')      cmp = a.pl - b.pl
    if (sortBy === 'margin')  cmp = a.margin - b.margin
    return sortDir === 'asc' ? cmp : -cmp
  })

  const grandRevenue  = clubSummaries.reduce((s, c) => s + c.revenue, 0)
  const grandExpenses = clubSummaries.reduce((s, c) => s + c.expenses, 0)
  const grandPL       = clubSummaries.reduce((s, c) => s + c.pl, 0)
  const grandNet      = clubSummaries.reduce((s, c) => s + c.net, 0)
  const grandEvents   = clubSummaries.reduce((s, c) => s + c.eventCount, 0)

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('desc') }
  }

  const weeks = Array.from(new Set(events.map(e => weekOfMonth(e.event_date)))).sort()

  if (!scopeReady || loading) {
    return <div style={{ minHeight: '100vh', background: T.colors.bg, padding: '32px 36px', color: T.colors.textSecondary }}>Loading...</div>
  }

  return (
    <div style={{ minHeight: '100vh', background: T.colors.bg }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 36px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.colors.red, boxShadow: T.shadow.redGlowSm }} />
              <span style={{ fontSize: '11px', color: T.colors.red, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Events</span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: T.colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>Event P&L</h1>
            <p style={{ fontSize: '13px', color: T.colors.textSecondary, marginTop: '5px' }}>
              {view === 'single' ? `${selectedClubName} · ${monthLabel} · ${events.length} events` : `All clubs · ${monthLabel} · ${grandEvents} events`}
            </p>
          </div>
        </div>

        {fieldError && (
          <div style={{
            ...T.card, borderColor: 'rgba(239,68,68,0.3)', marginBottom: '16px', padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <AlertTriangle size={15} color={T.colors.redStatus} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '13px', color: T.colors.textSecondary }}>{fieldError}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
          {([['single', 'Single Club'], ['all', 'All Clubs']] as const).map(([v, label]) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '8px 18px', borderRadius: T.radius.sm, fontFamily: 'inherit', cursor: 'pointer',
              fontSize: '12px', fontWeight: view === v ? '600' : '400',
              background: view === v ? T.colors.red : T.colors.surfaceRaised,
              color: view === v ? '#fff' : T.colors.textSecondary,
              border: `1px solid ${view === v ? T.colors.red : T.colors.border}`,
              boxShadow: view === v ? T.shadow.redGlowSm : 'none',
            }}>{label}</button>
          ))}
        </div>

        {view === 'all' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select value={selectedMonthIdx} onChange={e => setSelectedMonthIdx(Number(e.target.value))} style={{
                  padding: '9px 14px', borderRadius: T.radius.sm, border: `1px solid ${T.colors.border}`,
                  fontSize: '13px', fontFamily: 'inherit', background: T.colors.surfaceRaised,
                  color: T.colors.textPrimary, cursor: 'pointer',
                }}>
                  {MONTH_OPTIONS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
                <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} style={{
                  padding: '9px 14px', borderRadius: T.radius.sm, border: `1px solid ${T.colors.border}`,
                  fontSize: '13px', fontFamily: 'inherit', background: T.colors.surfaceRaised,
                  color: T.colors.textPrimary, cursor: 'pointer',
                }}>
                  {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <button onClick={handleExportAll} style={{ ...T.btn.secondary, display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px' }}>
                <Download size={14} /> Export to Excel
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '24px' }}>
              {[
                { label: 'Total Events',   value: String(grandEvents),                  color: T.colors.textPrimary, glow: false },
                { label: 'Total Revenue',  value: `R ${grandRevenue.toLocaleString()}`, color: T.colors.textPrimary, glow: false },
                { label: 'Total Expenses', value: `R ${grandExpenses.toLocaleString()}`, color: T.colors.textSecondary, glow: false },
                { label: 'Group P&L',      value: `R ${grandPL.toLocaleString()}`,       color: grandPL  >= 0 ? T.colors.green : T.colors.red, glow: true },
                { label: 'Group Net (after royalty)', value: `R ${grandNet.toLocaleString()}`,      color: grandNet >= 0 ? T.colors.green : T.colors.red, glow: true },
              ].map(c => (
                <div key={c.label} style={{ ...T.card, padding: '16px 18px', marginBottom: 0 }}>
                  <p style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>{c.label}</p>
                  <p style={{ fontSize: '18px', fontWeight: '700', color: c.color, margin: 0, fontFamily: "'SF Mono', monospace", textShadow: c.glow ? `0 0 12px ${c.color}55` : 'none' }}>{c.value}</p>
                </div>
              ))}
            </div>

            <div style={{ ...T.card, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: `1px solid ${T.colors.border}` }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary }}>Club Performance — {monthLabel}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 90px 130px 130px 130px 130px 100px', padding: '12px 24px', borderBottom: `1px solid ${T.colors.border}`, background: T.colors.surfaceRaised }}>
                <span style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>#</span>
                <SortHeader label="Club" col="name" sortBy={sortBy} sortDir={sortDir} onClick={() => toggleSort('name')} />
                <span style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'right' }}>Events</span>
                <SortHeader label="Revenue" col="revenue" sortBy={sortBy} sortDir={sortDir} onClick={() => toggleSort('revenue')} align="right" />
                <span style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'right' }}>Expenses</span>
                <SortHeader label="P&L" col="pl" sortBy={sortBy} sortDir={sortDir} onClick={() => toggleSort('pl')} align="right" />
                <span style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'right' }}>Net</span>
                <SortHeader label="Margin" col="margin" sortBy={sortBy} sortDir={sortDir} onClick={() => toggleSort('margin')} align="right" />
              </div>

              <div style={{ padding: '8px 16px' }}>
                {sortedSummary.map((c, idx) => (
                  <div key={c.name} onClick={() => {
                    const club = clubs.find(cl => cl.name === c.name)
                    if (club) setSelectedClubId(club.id)
                    setView('single')
                  }} style={{
                    display: 'grid', gridTemplateColumns: '40px 1fr 90px 130px 130px 130px 130px 100px',
                    padding: '12px 8px', borderRadius: T.radius.sm, marginBottom: '2px',
                    background: idx % 2 === 0 ? T.colors.surfaceRaised : 'transparent',
                    cursor: 'pointer', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: '11px', color: T.colors.textMuted, fontFamily: "'SF Mono', monospace" }}>{idx + 1}</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary }}>{c.name}</span>
                    <span style={{ fontSize: '12px', color: T.colors.textSecondary, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>{c.eventCount}</span>
                    <span style={{ fontSize: '13px', color: T.colors.textPrimary, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>R {c.revenue.toLocaleString()}</span>
                    <span style={{ fontSize: '13px', color: T.colors.textMuted, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>R {c.expenses.toLocaleString()}</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', textAlign: 'right', fontFamily: "'SF Mono', monospace", color: c.pl >= 0 ? T.colors.green : T.colors.red }}>R {c.pl.toLocaleString()}</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', textAlign: 'right', fontFamily: "'SF Mono', monospace", color: c.net >= 0 ? T.colors.green : T.colors.red }}>R {c.net.toLocaleString()}</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', textAlign: 'right', fontFamily: "'SF Mono', monospace", color: c.margin >= 0.2 ? T.colors.green : c.margin >= 0 ? T.colors.amber : T.colors.red }}>{(c.margin * 100).toFixed(1)}%</span>
                  </div>
                ))}

                <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 90px 130px 130px 130px 130px 100px', padding: '14px 8px', marginTop: '8px', borderRadius: T.radius.sm, background: T.colors.surface, border: `1px solid ${T.colors.borderBright}` }}>
                  <span />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: T.colors.textPrimary, textTransform: 'uppercase' }}>All Clubs Total</span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: T.colors.textSecondary, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>{grandEvents}</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: T.colors.textPrimary, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>R {grandRevenue.toLocaleString()}</span>
                  <span style={{ fontSize: '13px', color: T.colors.textMuted, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>R {grandExpenses.toLocaleString()}</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', textAlign: 'right', fontFamily: "'SF Mono', monospace", color: grandPL >= 0 ? T.colors.green : T.colors.red }}>R {grandPL.toLocaleString()}</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', textAlign: 'right', fontFamily: "'SF Mono', monospace", color: grandNet >= 0 ? T.colors.green : T.colors.red }}>R {grandNet.toLocaleString()}</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', textAlign: 'right', fontFamily: "'SF Mono', monospace", color: T.colors.textSecondary }}>{grandRevenue === 0 ? '0.0' : ((grandNet / grandRevenue) * 100).toFixed(1)}%</span>
                </div>
              </div>

              <p style={{ padding: '12px 24px 20px', fontSize: '11px', color: T.colors.textMuted, margin: 0 }}>Click any club to view its detailed event breakdown</p>
            </div>
          </>
        )}

        {view === 'single' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
              {scopeIsCompany && (
                <select value={selectedClubId} onChange={e => setSelectedClubId(e.target.value)} style={{
                  padding: '9px 14px', borderRadius: T.radius.sm, border: `1px solid ${T.colors.border}`,
                  fontSize: '13px', fontFamily: 'inherit', background: T.colors.surfaceRaised,
                  color: T.colors.textPrimary, cursor: 'pointer',
                }}>
                  {clubs.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                </select>
              )}
              <select value={selectedMonthIdx} onChange={e => setSelectedMonthIdx(Number(e.target.value))} style={{
                padding: '9px 14px', borderRadius: T.radius.sm, border: `1px solid ${T.colors.border}`,
                fontSize: '13px', fontFamily: 'inherit', background: T.colors.surfaceRaised,
                color: T.colors.textPrimary, cursor: 'pointer',
              }}>
                {MONTH_OPTIONS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} style={{
                padding: '9px 14px', borderRadius: T.radius.sm, border: `1px solid ${T.colors.border}`,
                fontSize: '13px', fontFamily: 'inherit', background: T.colors.surfaceRaised,
                color: T.colors.textPrimary, cursor: 'pointer',
              }}>
                {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <button onClick={handleExportSingle} disabled={events.length === 0} style={{
                ...T.btn.secondary, display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px',
                opacity: events.length === 0 ? 0.5 : 1, cursor: events.length === 0 ? 'not-allowed' : 'pointer',
              }}>
                <Download size={14} /> Export
              </button>
              <button onClick={() => setShowAddEvent(v => !v)} style={{ ...T.btn.primary, display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px' }}>
                <Plus size={14} /> Add Event
              </button>
            </div>

            {showAddEvent && (
              <form action={handleAddEvent} style={{
                ...T.card, padding: '20px 24px', marginBottom: '24px',
                border: `1px solid ${T.colors.red}`, display: 'flex', flexDirection: 'column', gap: '14px',
              }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>New Event</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: T.colors.textSecondary, display: 'block', marginBottom: '6px' }}>Event Name</label>
                    <input name="name" required style={darkInp} placeholder="e.g. Tuesday Americano" />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: T.colors.textSecondary, display: 'block', marginBottom: '6px' }}>Event Type</label>
                    <select name="eventType" style={darkInp} defaultValue="CLUB SOCIAL">
                      {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: T.colors.textSecondary, display: 'block', marginBottom: '6px' }}>Date</label>
                    <input name="eventDate" type="date" required style={darkInp} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: T.colors.textSecondary, display: 'block', marginBottom: '6px' }}>Cost / Person (R)</label>
                    <input name="costPerPerson" type="number" min={0} defaultValue={150} style={darkInp} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: T.colors.textSecondary, display: 'block', marginBottom: '6px' }}>Players</label>
                    <input name="players" type="number" min={0} defaultValue={8} style={darkInp} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: T.colors.textSecondary, display: 'block', marginBottom: '6px' }}>Courts Used</label>
                    <input name="courtsUsed" type="number" min={1} defaultValue={2} style={darkInp} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: T.colors.textSecondary, display: 'block', marginBottom: '6px' }}>Duration (hrs)</label>
                    <input name="duration" type="number" step="0.5" min={0.5} defaultValue={1.5} style={darkInp} />
                  </div>
                </div>
                <p style={{ fontSize: '11px', color: T.colors.textMuted, margin: 0 }}>
                  Court rate and royalty rate are pulled automatically from Revenue &amp; Targets for this club — not entered here.
                </p>
                <button type="submit" style={{ ...T.btn.primary, alignSelf: 'flex-start' }}>Create Event</button>
              </form>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '32px' }}>
              {[
                { label: 'Total Revenue',  value: `R ${totalRev.toLocaleString()}`, color: T.colors.textPrimary, glow: false },
                { label: 'Total Expenses', value: `R ${totalExp.toLocaleString()}`, color: T.colors.textSecondary, glow: false },
                { label: 'Profit / Loss',  value: `R ${totalPL.toLocaleString()}`,  color: totalPL  >= 0 ? T.colors.green : T.colors.red, glow: true },
                { label: 'Net (after royalty)', value: `R ${totalNet.toLocaleString()}`, color: totalNet >= 0 ? T.colors.green : T.colors.red, glow: true },
              ].map(c => (
                <div key={c.label} style={{ ...T.card, padding: '16px 20px', marginBottom: 0 }}>
                  <p style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>{c.label}</p>
                  <p style={{ fontSize: '20px', fontWeight: '700', color: c.color, margin: 0, fontFamily: "'SF Mono', monospace", textShadow: c.glow ? `0 0 12px ${c.color}55` : 'none' }}>{c.value}</p>
                </div>
              ))}
            </div>

            {events.length === 0 && (
              <div style={{ ...T.card, textAlign: 'center', padding: '40px', color: T.colors.textMuted }}>
                No events entered for {selectedClubName} in {monthLabel} yet. Click "Add Event" to create one.
              </div>
            )}

            {weeks.map(week => {
              const weekEvents = events.filter(e => weekOfMonth(e.event_date) === week)
              const weekRev = weekEvents.reduce((s, e) => s + calcRevenue(e), 0)
              const weekPL  = weekEvents.reduce((s, e) => s + calcPL(e), 0)

              return (
                <div key={week} style={{ marginBottom: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: "'SF Mono', monospace" }}>Week {week}</span>
                      <div style={{ height: '1px', width: '32px', background: T.colors.border }} />
                    </div>
                    <span style={{ fontSize: '12px', color: T.colors.textMuted, fontFamily: "'SF Mono', monospace" }}>
                      Rev R {weekRev.toLocaleString()} ·{' '}
                      <span style={{ color: weekPL >= 0 ? T.colors.green : T.colors.red, fontWeight: '600' }}>P&L R {weekPL.toLocaleString()}</span>
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {weekEvents.map(ev => {
                      const isOpen = expandedId === ev.id
                      const tc = TYPE_COLORS[ev.event_type] ?? { bg: T.colors.surfaceRaised, color: T.colors.textSecondary, border: T.colors.border }
                      const revenue = calcRevenue(ev)
                      const courtExp = calcCourtExp(ev)
                      const drinkTotal = calcDrinkTotal(ev)
                      const ballTotal = calcBallTotal(ev)
                      const adhocTotal = calcAdhocTotal(ev)
                      const sponsorTotal = calcSponsorTotal(ev)
                      const totalExpAmt = calcTotalExp(ev)
                      const pl = calcPL(ev)
                      const royalty = calcRoyalty(ev)
                      const netProfit = calcNet(ev)
                      const margin = calcMargin(ev)

                      return (
                        <div key={ev.id} style={{
                          background: T.colors.surface, borderRadius: T.radius.lg,
                          border: `1px solid ${isOpen ? T.colors.red : T.colors.border}`,
                          overflow: 'hidden', boxShadow: isOpen ? T.shadow.redGlowSm : T.shadow.card,
                        }}>
                          <div onClick={() => setExpandedId(isOpen ? null : ev.id)} style={{
                            display: 'grid', gridTemplateColumns: '150px 1fr 100px 100px 110px 100px 24px',
                            alignItems: 'center', padding: '13px 16px', cursor: 'pointer', gap: '12px',
                          }}>
                            <select
                              value={ev.event_type}
                              onClick={e => e.stopPropagation()}
                              onChange={e => { e.stopPropagation(); handleFieldUpdate(ev.id, 'event_type', e.target.value) }}
                              style={{
                                fontSize: '10px', fontWeight: '700', fontFamily: 'inherit', cursor: 'pointer',
                                background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`,
                                borderRadius: T.radius.sm, padding: '5px 8px', width: '100%', letterSpacing: '0.04em',
                              }}
                            >
                              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>

                            <div>
                              <p style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary, margin: 0 }}>{ev.name}</p>
                              <p style={{ fontSize: '11px', color: T.colors.textMuted, margin: '3px 0 0', fontFamily: "'SF Mono', monospace" }}>
                                {new Date(ev.event_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} · {ev.players} players · R{ev.cost_per_person}/person
                              </p>
                            </div>

                            {[
                              { label: 'Revenue',  val: `R ${revenue.toLocaleString()}`,                color: T.colors.textPrimary, glow: false },
                              { label: 'Expenses', val: `R ${Math.round(totalExpAmt).toLocaleString()}`, color: T.colors.textSecondary, glow: false },
                              { label: 'P&L',      val: `R ${Math.round(pl).toLocaleString()}`,          color: pl >= 0 ? T.colors.green : T.colors.red, glow: true },
                              { label: 'Margin',   val: `${(margin * 100).toFixed(1)}%`,                 color: margin >= 0 ? T.colors.green : T.colors.red, glow: true },
                            ].map(col => (
                              <div key={col.label} style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '9px', color: T.colors.textMuted, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{col.label}</p>
                                <p style={{ fontSize: '13px', fontWeight: '700', color: col.color, margin: 0, fontFamily: "'SF Mono', monospace", textShadow: col.glow ? `0 0 8px ${col.color}55` : 'none' }}>{col.val}</p>
                              </div>
                            ))}

                            <span style={{ color: isOpen ? T.colors.red : T.colors.textMuted, fontSize: '14px', textAlign: 'center', display: 'block', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
                          </div>

                          {isOpen && (
                            <div style={{ borderTop: `1px solid ${T.colors.border}`, padding: '20px', background: T.colors.bg }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                      <SubLabel>Court Costs</SubLabel>
                                    </div>
                                    <p style={{ fontSize: '10px', color: T.colors.textMuted, margin: '-6px 0 10px' }}>
                                      Courts &amp; duration manual until Playtomic sync · rate from Revenue &amp; Targets
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                                      <div style={{ background: T.colors.surfaceRaised, border: `1px solid ${T.colors.border}`, borderRadius: T.radius.sm, padding: '10px 12px' }}>
                                        <p style={{ fontSize: '9px', color: T.colors.textMuted, margin: '0 0 4px', textTransform: 'uppercase' }}># Courts</p>
                                        <input type="number" min={1} value={ev.courts_used} style={{ ...darkInp, padding: '2px 0', background: 'transparent', border: 'none', fontSize: '14px', fontWeight: 600 }}
                                          onChange={e => handleFieldUpdate(ev.id, 'courts_used', parseInt(e.target.value) || 1)} />
                                      </div>
                                      <div style={{ background: T.colors.surfaceRaised, border: `1px solid ${T.colors.border}`, borderRadius: T.radius.sm, padding: '10px 12px' }}>
                                        <p style={{ fontSize: '9px', color: T.colors.textMuted, margin: '0 0 4px', textTransform: 'uppercase' }}>Duration (hrs)</p>
                                        <input type="number" step="0.5" min={0.5} value={ev.duration} style={{ ...darkInp, padding: '2px 0', background: 'transparent', border: 'none', fontSize: '14px', fontWeight: 600 }}
                                          onChange={e => handleFieldUpdate(ev.id, 'duration', parseFloat(e.target.value) || 1.5)} />
                                      </div>
                                      <div style={{ background: T.colors.surfaceRaised, border: `1px solid ${T.colors.border}`, borderRadius: T.radius.sm, padding: '10px 12px' }}>
                                        <p style={{ fontSize: '9px', color: T.colors.textMuted, margin: '0 0 4px', textTransform: 'uppercase' }}>Court Rate</p>
                                        <p style={{ fontSize: '14px', fontWeight: 600, color: T.colors.textSecondary, margin: 0, fontFamily: "'SF Mono', monospace" }}>
                                          R{ev.court_rate}
                                        </p>
                                      </div>
                                    </div>
                                    <p style={{ fontSize: '9px', color: T.colors.textMuted, margin: '6px 0 0' }}>
                                      Rate snapshotted at event creation from Revenue &amp; Targets — won't change if HOO updates the rate later.
                                    </p>
                                    <div style={{ marginTop: '6px', background: T.colors.surfaceRaised, border: `1px solid ${T.colors.border}`, borderRadius: T.radius.sm, padding: '10px 14px', display: 'flex', justifyContent: 'space-between' }}>
                                      <span style={{ fontSize: '12px', color: T.colors.textSecondary }}>Total Court Expense</span>
                                      <span style={{ fontSize: '14px', fontWeight: '700', color: T.colors.textPrimary, fontFamily: "'SF Mono', monospace" }}>R {courtExp.toLocaleString()}</span>
                                    </div>
                                  </div>

                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                      <SubLabel>Drinks Provided</SubLabel>
                                      <AddBtn label='+ Add drink' onClick={() => handleFieldUpdate(ev.id, 'drinks', [...(ev.drinks ?? []), { name: '', qty: 0, unitPrice: 0 }])} />
                                    </div>
                                    {(ev.drinks ?? []).map((d, i) => (
                                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 24px', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                                        <select value={d.name} style={darkInp} onChange={e => {
                                          const sel = DRINK_PRICE_LIST.find(x => x.name === e.target.value)
                                          const next = [...ev.drinks]; next[i] = { ...next[i], name: e.target.value, unitPrice: sel?.price ?? 0 }
                                          handleFieldUpdate(ev.id, 'drinks', next)
                                        }}>
                                          <option value=''>Select drink...</option>
                                          {DRINK_PRICE_LIST.map(dr => <option key={dr.name} value={dr.name}>{dr.name} — R{dr.price}</option>)}
                                        </select>
                                        <input type='number' min={0} value={d.qty || ''} placeholder='Qty' style={{ ...darkInp, textAlign: 'center' }}
                                          onChange={e => { const next = [...ev.drinks]; next[i] = { ...next[i], qty: Number(e.target.value) }; handleFieldUpdate(ev.id, 'drinks', next) }} />
                                        <button onClick={() => handleFieldUpdate(ev.id, 'drinks', ev.drinks.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: T.colors.textMuted, cursor: 'pointer', fontSize: '16px' }}>×</button>
                                      </div>
                                    ))}
                                    {drinkTotal > 0 && <TotalLine label="Drink total" value={drinkTotal.toFixed(2)} />}
                                  </div>

                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                      <SubLabel>Balls Used</SubLabel>
                                      <AddBtn label='+ Add balls' onClick={() => handleFieldUpdate(ev.id, 'balls', [...(ev.balls ?? []), { name: '', qty: 0, unitPrice: 0 }])} />
                                    </div>
                                    {(ev.balls ?? []).map((b, i) => (
                                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 24px', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                                        <select value={b.name} style={darkInp} onChange={e => {
                                          const sel = BALL_PRICE_LIST.find(x => x.name === e.target.value)
                                          const next = [...ev.balls]; next[i] = { ...next[i], name: e.target.value, unitPrice: sel?.price ?? 0 }
                                          handleFieldUpdate(ev.id, 'balls', next)
                                        }}>
                                          <option value=''>Select balls...</option>
                                          {BALL_PRICE_LIST.map(bl => <option key={bl.name} value={bl.name}>{bl.name} — R{bl.price}</option>)}
                                        </select>
                                        <input type='number' min={0} value={b.qty || ''} placeholder='Qty' style={{ ...darkInp, textAlign: 'center' }}
                                          onChange={e => { const next = [...ev.balls]; next[i] = { ...next[i], qty: Number(e.target.value) }; handleFieldUpdate(ev.id, 'balls', next) }} />
                                        <button onClick={() => handleFieldUpdate(ev.id, 'balls', ev.balls.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: T.colors.textMuted, cursor: 'pointer', fontSize: '16px' }}>×</button>
                                      </div>
                                    ))}
                                    {ballTotal > 0 && <TotalLine label="Balls total" value={ballTotal.toFixed(2)} />}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                      <SubLabel>Adhoc Expenses</SubLabel>
                                      <AddBtn label='+ Add row' onClick={() => handleFieldUpdate(ev.id, 'adhoc', [...(ev.adhoc ?? []), { description: '', amount: 0 }])} />
                                    </div>
                                    <p style={{ fontSize: '11px', color: T.colors.textMuted, margin: '0 0 8px' }}>Prizes, Playtomic wallets, paramedic, catering, etc.</p>
                                    {(ev.adhoc ?? []).map((a, i) => (
                                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 24px', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                                        <input type='number' min={0} value={a.amount || ''} placeholder='R 0' style={darkInp}
                                          onChange={e => { const next = [...ev.adhoc]; next[i] = { ...next[i], amount: Number(e.target.value) }; handleFieldUpdate(ev.id, 'adhoc', next) }} />
                                        <input type='text' value={a.description} placeholder='Description' style={darkInp}
                                          onChange={e => { const next = [...ev.adhoc]; next[i] = { ...next[i], description: e.target.value }; handleFieldUpdate(ev.id, 'adhoc', next) }} />
                                        <button onClick={() => handleFieldUpdate(ev.id, 'adhoc', ev.adhoc.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: T.colors.textMuted, cursor: 'pointer', fontSize: '16px' }}>×</button>
                                      </div>
                                    ))}
                                    {adhocTotal > 0 && <TotalLine label="Adhoc total" value={adhocTotal.toFixed(2)} />}
                                  </div>

                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                      <SubLabel>Sponsors</SubLabel>
                                      <AddBtn label='+ Add sponsor' onClick={() => handleFieldUpdate(ev.id, 'sponsors', [...(ev.sponsors ?? []), { name: '', amount: 0, invoiced: false, paid: false, popFileName: '' }])} />
                                    </div>
                                    {(ev.sponsors ?? []).length === 0 && <p style={{ fontSize: '12px', color: T.colors.textMuted, fontStyle: 'italic', margin: 0 }}>No sponsors added yet.</p>}
                                    {(ev.sponsors ?? []).map((sp, i) => (
                                      <div key={i} style={{ background: T.colors.surfaceRaised, border: `1px solid ${T.colors.border}`, borderRadius: T.radius.md, padding: '14px', marginBottom: '10px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 24px', gap: '6px', marginBottom: '10px', alignItems: 'center' }}>
                                          <input type='text' value={sp.name} placeholder='Sponsor name' style={darkInp}
                                            onChange={e => { const next = [...ev.sponsors]; next[i] = { ...next[i], name: e.target.value }; handleFieldUpdate(ev.id, 'sponsors', next) }} />
                                          <input type='number' min={0} value={sp.amount || ''} placeholder='Amount' style={darkInp}
                                            onChange={e => { const next = [...ev.sponsors]; next[i] = { ...next[i], amount: Number(e.target.value) }; handleFieldUpdate(ev.id, 'sponsors', next) }} />
                                          <button onClick={() => handleFieldUpdate(ev.id, 'sponsors', ev.sponsors.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: T.colors.textMuted, cursor: 'pointer', fontSize: '16px' }}>×</button>
                                        </div>
                                        <div style={{ display: 'flex', gap: '16px', marginBottom: '10px' }}>
                                          {[{ key: 'invoiced', label: 'Invoiced' }, { key: 'paid', label: 'Paid' }].map(f => (
                                            <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: T.colors.textSecondary }}>
                                              <input type='checkbox' checked={(sp as any)[f.key]} style={{ accentColor: T.colors.red, width: '14px', height: '14px' }}
                                                onChange={e => { const next = [...ev.sponsors]; next[i] = { ...next[i], [f.key]: e.target.checked }; handleFieldUpdate(ev.id, 'sponsors', next) }} />
                                              {f.label}
                                            </label>
                                          ))}
                                        </div>
                                        <p style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', margin: '0 0 6px' }}>Proof of Payment</p>
                                        {sp.popFileName ? (
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: T.colors.greenGlow, border: `1px solid rgba(34,197,94,0.2)`, borderRadius: T.radius.sm }}>
                                            <span>📎</span>
                                            <span style={{ fontSize: '12px', color: T.colors.green, fontWeight: '600', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sp.popFileName}</span>
                                            <button onClick={() => { const next = [...ev.sponsors]; next[i] = { ...next[i], popFileName: '' }; handleFieldUpdate(ev.id, 'sponsors', next) }} style={{ background: 'none', border: 'none', color: T.colors.textMuted, cursor: 'pointer', fontSize: '14px' }}>×</button>
                                          </div>
                                        ) : (
                                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: T.colors.surface, border: `1px dashed ${T.colors.borderBright}`, borderRadius: T.radius.sm, cursor: 'pointer' }}>
                                            <span>📎</span>
                                            <span style={{ fontSize: '12px', color: T.colors.textMuted }}>Attach POP (filename only — file storage not yet wired)</span>
                                            <input type='file' accept='.pdf,.jpg,.jpeg,.png' style={{ display: 'none' }}
                                              onChange={e => {
                                                const file = e.target.files?.[0]; if (!file) return
                                                const next = [...ev.sponsors]; next[i] = { ...next[i], popFileName: file.name }; handleFieldUpdate(ev.id, 'sponsors', next)
                                              }} />
                                          </label>
                                        )}
                                      </div>
                                    ))}
                                    {sponsorTotal > 0 && <TotalLine label="Sponsor total" value={sponsorTotal.toLocaleString()} green />}
                                  </div>
                                </div>
                              </div>

                              <div style={{ marginTop: '20px', padding: '16px 20px', borderRadius: T.radius.md, background: T.colors.surfaceRaised, border: `1px solid ${T.colors.borderBright}`, display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                                {[
                                  { label: 'Revenue',    value: `R ${revenue.toLocaleString()}`, color: T.colors.textPrimary, glow: false },
                                  { label: 'Court Exp',  value: `R ${courtExp.toLocaleString()}`, color: T.colors.textSecondary, glow: false },
                                  { label: 'Other Exp',  value: `R ${(drinkTotal + ballTotal + adhocTotal).toFixed(0)}`, color: T.colors.textSecondary, glow: false },
                                  { label: 'Sponsor In', value: sponsorTotal > 0 ? `R ${sponsorTotal.toLocaleString()}` : '—', color: sponsorTotal > 0 ? T.colors.green : T.colors.textMuted, glow: sponsorTotal > 0 },
                                  { label: `Royalty (${((ev.royalty_rate ?? 0.06) * 100).toFixed(1)}%)`, value: `R ${royalty.toFixed(0)}`, color: T.colors.textSecondary, glow: false },
                                  { label: 'Net Profit', value: `R ${netProfit.toFixed(0)}`, color: netProfit >= 0 ? T.colors.green : T.colors.red, glow: true },
                                ].map((s, i, arr) => (
                                  <div key={s.label} style={{ textAlign: 'center', flex: 1, borderRight: i < arr.length - 1 ? `1px solid ${T.colors.border}` : 'none' }}>
                                    <p style={{ fontSize: '9px', color: T.colors.textMuted, textTransform: 'uppercase', margin: '0 0 5px' }}>{s.label}</p>
                                    <p style={{ fontSize: '14px', fontWeight: '700', color: s.color, margin: 0, fontFamily: "'SF Mono', monospace", textShadow: s.glow ? `0 0 8px ${s.color}55` : 'none' }}>{s.value}</p>
                                  </div>
                                ))}
                              </div>

                              <div style={{ marginTop: '14px', textAlign: 'right' }}>
                                <button onClick={() => handleDelete(ev.id)} style={{
                                  fontSize: '12px', color: T.colors.textMuted, background: 'none',
                                  border: `1px solid ${T.colors.border}`, borderRadius: T.radius.sm,
                                  padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit',
                                }}>Delete Event</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
