'use client'

import { useState } from 'react'
import { Download, ChevronUp, ChevronDown } from 'lucide-react'
import { theme } from '../components/theme'

const T = theme

const DRINK_PRICE_LIST: { name: string; price: number }[] = [
  { name: 'Powerade', price: 11.41 },
  { name: 'Coke 300ml', price: 9.66 },
  { name: 'Coke No Sugar', price: 9.62 },
  { name: 'Valpre Still Water', price: 9.10 },
  { name: 'Valpre Sparkling Water', price: 9.10 },
  { name: 'Appletiser', price: 13.58 },
  { name: 'Red Bull', price: 16.04 },
  { name: 'Red Bull Sugar Free', price: 16.04 },
  { name: 'Monster Original 500ml', price: 15.69 },
  { name: 'Sprite No Sugar', price: 8.85 },
  { name: 'Schweppes Lemonade', price: 7.68 },
  { name: 'Sparl Creme Soda', price: 8.89 },
  { name: 'Bar One Chocolate', price: 10.25 },
  { name: 'Jungle Bar Berries', price: 8.14 },
  { name: 'E/Bar Strawberry', price: 11.17 },
  { name: 'Coffee', price: 34.00 },
  { name: 'Smoothie', price: 50.00 },
  { name: 'Prego Roll', price: 50.00 },
]

const BALL_PRICE_LIST: { name: string; price: number }[] = [
  { name: 'Lok Fresh Balls', price: 79.20 },
  { name: 'Adidas Balls Speed RX', price: 82.38 },
  { name: 'Wilson Padel X3', price: 85.19 },
  { name: 'Bullpadel Next Balls', price: 89.26 },
  { name: 'BAB Court X3 Tube Ball', price: 94.73 },
  { name: 'Tretorn Balls', price: 87.12 },
  { name: 'Wilson Prem Balls Silver H/A', price: 99.33 },
  { name: 'Wilson Prem Balls Gold S/L', price: 99.00 },
  { name: 'POW Pickle Balls Rentals', price: 57.90 },
]

const EVENT_TYPES = [
  'CLUB SOCIAL', 'AMBASSADOR SOCIAL', 'COACH SOCIAL',
  'CLUB TOURNAMENT', 'SPONSORED TOURNAMENT', 'JUNIOR ACADEMY', 'CORPORATE EVENT',
]

const TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  'CLUB SOCIAL':          { bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6', border: 'rgba(59,130,246,0.2)'  },
  'AMBASSADOR SOCIAL':    { bg: 'rgba(168,85,247,0.1)',  color: '#a855f7', border: 'rgba(168,85,247,0.2)'  },
  'COACH SOCIAL':         { bg: 'rgba(249,115,22,0.1)',  color: '#f97316', border: 'rgba(249,115,22,0.2)'  },
  'CLUB TOURNAMENT':      { bg: T.colors.redGlow,        color: T.colors.red, border: 'rgba(224,10,9,0.2)' },
  'SPONSORED TOURNAMENT': { bg: T.colors.greenGlow,      color: T.colors.green, border: 'rgba(34,197,94,0.2)' },
  'JUNIOR ACADEMY':       { bg: T.colors.amberGlow,      color: T.colors.amber, border: 'rgba(245,158,11,0.2)' },
  'CORPORATE EVENT':      { bg: 'rgba(2,132,199,0.1)',   color: '#0284c7', border: 'rgba(2,132,199,0.2)'   },
}

const MOCK_EVENTS = [
  { id: 1,  week: 1, type: 'AMBASSADOR SOCIAL', name: 'Monday Night Ladies Social',             date: '2 Jun',  costPerPerson: 150, players: 11, courtsUsed: 3, duration: 1.5, courtRate: 500 },
  { id: 2,  week: 1, type: 'CLUB SOCIAL',        name: 'Tuesday Intermediate Americano',         date: '3 Jun',  costPerPerson: 185, players: 7,  courtsUsed: 2, duration: 1.5, courtRate: 500 },
  { id: 3,  week: 1, type: 'CLUB SOCIAL',        name: 'Wednesday Lunch Time Social',            date: '4 Jun',  costPerPerson: 75,  players: 7,  courtsUsed: 2, duration: 1.5, courtRate: 350 },
  { id: 4,  week: 1, type: 'COACH SOCIAL',       name: 'Beans & Banter with Amber x Epic Cafe',  date: '5 Jun',  costPerPerson: 210, players: 11, courtsUsed: 3, duration: 1.5, courtRate: 500 },
  { id: 5,  week: 1, type: 'CLUB SOCIAL',        name: 'Friday Lunch Time Social',               date: '6 Jun',  costPerPerson: 75,  players: 11, courtsUsed: 3, duration: 1.5, courtRate: 350 },
  { id: 6,  week: 1, type: 'CLUB SOCIAL',        name: 'Rally & Rise',                           date: '6 Jun',  costPerPerson: 185, players: 2,  courtsUsed: 1, duration: 1.5, courtRate: 500 },
  { id: 7,  week: 1, type: 'CLUB SOCIAL',        name: 'Sunrise Saturdays',                      date: '7 Jun',  costPerPerson: 185, players: 7,  courtsUsed: 2, duration: 1.5, courtRate: 500 },
  { id: 8,  week: 2, type: 'CLUB SOCIAL',        name: 'Monday Padel For Fun',                   date: '9 Jun',  costPerPerson: 185, players: 4,  courtsUsed: 1, duration: 1.5, courtRate: 500 },
  { id: 9,  week: 2, type: 'CLUB SOCIAL',        name: 'Wednesday Lunch Social',                 date: '11 Jun', costPerPerson: 75,  players: 8,  courtsUsed: 2, duration: 1.5, courtRate: 350 },
  { id: 10, week: 2, type: 'COACH SOCIAL',       name: "Coach Amber's Breakfast Club",           date: '14 Jun', costPerPerson: 200, players: 10, courtsUsed: 3, duration: 1.5, courtRate: 500 },
  { id: 11, week: 3, type: 'CLUB SOCIAL',        name: 'Tuesday Intermediate Americano',         date: '17 Jun', costPerPerson: 185, players: 8,  courtsUsed: 2, duration: 1.5, courtRate: 500 },
  { id: 12, week: 3, type: 'CLUB SOCIAL',        name: 'Friday Lunch Time Social',               date: '20 Jun', costPerPerson: 75,  players: 7,  courtsUsed: 2, duration: 1.5, courtRate: 350 },
  { id: 13, week: 3, type: 'CLUB SOCIAL',        name: 'Sunrise Saturdays',                      date: '21 Jun', costPerPerson: 150, players: 6,  courtsUsed: 2, duration: 1.5, courtRate: 500 },
  { id: 14, week: 4, type: 'AMBASSADOR SOCIAL',  name: 'Monday Night Ladies Social',             date: '23 Jun', costPerPerson: 150, players: 11, courtsUsed: 3, duration: 1.5, courtRate: 500 },
  { id: 15, week: 4, type: 'CLUB SOCIAL',        name: 'Wednesday Lunch Time Social',            date: '25 Jun', costPerPerson: 75,  players: 5,  courtsUsed: 2, duration: 1.5, courtRate: 350 },
]

const CLUB_NAMES = ['BALLITO','BEDFORDVIEW','CENTURION','DURBANVILLE','EPICENTRE','GATEWAY','GEORGE','GLEN','GROENKLOOF','HUDDLE','LORRAINE','LOURENSFORD','LONEHILL','OLD EDS','POINT','RANDPARK','WOODSTOCK']

interface DrinkEntry   { drinkName: string; qty: number; unitPrice: number }
interface BallEntry    { ballName: string;  qty: number; unitPrice: number }
interface AdhocEntry   { description: string; amount: number }
interface SponsorEntry { name: string; amount: number; invoiced: boolean; paid: boolean; popFile: File | null; popFileName: string }
interface EventExpenses { drinks: DrinkEntry[]; balls: BallEntry[]; adhoc: AdhocEntry[]; sponsors: SponsorEntry[] }

const defaultExpenses = (): EventExpenses => ({
  drinks:   [{ drinkName: '', qty: 0, unitPrice: 0 }],
  balls:    [{ ballName:  '', qty: 0, unitPrice: 0 }],
  adhoc:    [{ description: '', amount: 0 }],
  sponsors: [],
})
const defaultSponsor = (): SponsorEntry => ({ name: '', amount: 0, invoiced: false, paid: false, popFile: null, popFileName: '' })

const darkInp: React.CSSProperties = { ...T.input, padding: '8px 10px', fontSize: '13px' }

function SubLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '10px', color: T.colors.red, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px' }}>{children}</p>
}

function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick} style={{ fontSize: '12px', color: T.colors.red, background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit', padding: 0 }}>{label}</button>
}

// ── Deterministic per-club mock multiplier — gives every club distinct,
// stable numbers without needing real data yet ─────────────────────────────
function clubSeed(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 1000
  return hash / 1000
}

function getClubEventSummary(clubName: string) {
  const seed = clubSeed(clubName)
  const multiplier = 0.6 + seed * 0.9 // 0.6x to 1.5x variance per club
  const eventCount = Math.max(2, Math.round(MOCK_EVENTS.length * (0.4 + seed * 0.8)))

  let revenue = 0, expenses = 0
  MOCK_EVENTS.slice(0, eventCount).forEach(e => {
    const rev = e.costPerPerson * e.players * multiplier
    const court = e.courtsUsed * e.duration * e.courtRate * multiplier
    revenue += rev
    expenses += court + rev * 0.08 // approx other expenses as 8% of revenue
  })

  const royalty = revenue * 0.06
  const pl  = revenue - expenses
  const net = pl - royalty
  const margin = revenue === 0 ? 0 : net / revenue

  return {
    name: clubName,
    eventCount,
    revenue: Math.round(revenue),
    expenses: Math.round(expenses),
    pl: Math.round(pl),
    net: Math.round(net),
    margin,
  }
}

export default function EventsPage() {
  const [view, setView]                 = useState<'single' | 'all'>('single')
  const [expandedId, setExpandedId]     = useState<number | null>(null)
  const [expenses, setExpenses]         = useState<Record<number, EventExpenses>>({})
  const [eventTypes, setEventTypes]     = useState<Record<number, string>>({})
  const [selectedClub, setSelectedClub] = useState('WOODSTOCK')
  const [selectedMonth, setSelectedMonth] = useState('June 2026')
  const [sortBy, setSortBy]             = useState<'name' | 'revenue' | 'pl' | 'margin'>('revenue')
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('desc')

  const getExp = (id: number): EventExpenses => expenses[id] ?? defaultExpenses()
  const setExp = (id: number, updater: (prev: EventExpenses) => EventExpenses) =>
    setExpenses(prev => ({ ...prev, [id]: updater(prev[id] ?? defaultExpenses()) }))

  const calcRevenue      = (e: typeof MOCK_EVENTS[0]) => e.costPerPerson * e.players
  const calcCourtExp     = (e: typeof MOCK_EVENTS[0]) => e.courtsUsed * e.duration * e.courtRate
  const calcDrinkTotal   = (id: number) => getExp(id).drinks.reduce((s, d) => s + d.qty * d.unitPrice, 0)
  const calcBallTotal    = (id: number) => getExp(id).balls.reduce((s, b)  => s + b.qty * b.unitPrice, 0)
  const calcAdhocTotal   = (id: number) => getExp(id).adhoc.reduce((s, a)  => s + a.amount, 0)
  const calcSponsorTotal = (id: number) => getExp(id).sponsors.reduce((s, sp) => s + sp.amount, 0)
  const calcTotalExp     = (e: typeof MOCK_EVENTS[0], id: number) => calcCourtExp(e) + calcDrinkTotal(id) + calcBallTotal(id) + calcAdhocTotal(id)
  const calcPL           = (e: typeof MOCK_EVENTS[0], id: number) => calcRevenue(e) - calcTotalExp(e, id) + calcSponsorTotal(id)
  const calcRoyalty      = (e: typeof MOCK_EVENTS[0], id: number) => calcRevenue(e) * 0.06
  const calcNet          = (e: typeof MOCK_EVENTS[0], id: number) => calcPL(e, id) - calcRoyalty(e, id)
  const calcMargin       = (e: typeof MOCK_EVENTS[0], id: number) => { const r = calcRevenue(e); return r === 0 ? 0 : calcNet(e, id) / r }

  const exportToExcel = async () => {
    const { generateEventsExcel } = await import('../lib/exportExcel')
    const blob = await generateEventsExcel(
      selectedClub, selectedMonth.split(' ')[0], parseInt(selectedMonth.split(' ')[1]),
      MOCK_EVENTS.map(e => ({ ...e, type: eventTypes[e.id] ?? e.type })), expenses
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `VA_Padel_Events_${selectedClub}_${selectedMonth.replace(' ', '_')}.xlsx`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // ── All-clubs summary data ────────────────────────────────────────────────
  const allClubsSummary = CLUB_NAMES.map(getClubEventSummary)
  const sortedSummary = [...allClubsSummary].sort((a, b) => {
    let cmp = 0
    if (sortBy === 'name')    cmp = a.name.localeCompare(b.name)
    if (sortBy === 'revenue') cmp = a.revenue - b.revenue
    if (sortBy === 'pl')      cmp = a.pl - b.pl
    if (sortBy === 'margin')  cmp = a.margin - b.margin
    return sortDir === 'asc' ? cmp : -cmp
  })

  const grandRevenue  = allClubsSummary.reduce((s, c) => s + c.revenue, 0)
  const grandExpenses = allClubsSummary.reduce((s, c) => s + c.expenses, 0)
  const grandPL       = allClubsSummary.reduce((s, c) => s + c.pl, 0)
  const grandNet      = allClubsSummary.reduce((s, c) => s + c.net, 0)
  const grandEvents   = allClubsSummary.reduce((s, c) => s + c.eventCount, 0)

  const exportAllClubs = async () => {
    const { generateAllClubsEventsExcel } = await import('../lib/exportExcel')
    const blob = await generateAllClubsEventsExcel(
      selectedMonth.split(' ')[0],
      parseInt(selectedMonth.split(' ')[1]),
      allClubsSummary
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `VA_Padel_AllClubs_Events_${selectedMonth.replace(' ', '_')}.xlsx`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('desc') }
  }

  const totalRev = MOCK_EVENTS.reduce((s, e) => s + calcRevenue(e), 0)
  const totalExp = MOCK_EVENTS.reduce((s, e) => s + calcTotalExp(e, e.id), 0)
  const totalPL  = MOCK_EVENTS.reduce((s, e) => s + calcPL(e, e.id), 0)
  const totalNet = MOCK_EVENTS.reduce((s, e) => s + calcNet(e, e.id), 0)

  return (
    <div style={{ minHeight: '100vh', background: T.colors.bg }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 36px' }}>

        {/* ── Page header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.colors.red, boxShadow: T.shadow.redGlowSm }} />
              <span style={{ fontSize: '11px', color: T.colors.red, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Events</span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: T.colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>Event P&L</h1>
            <p style={{ fontSize: '13px', color: T.colors.textSecondary, marginTop: '5px' }}>
              {view === 'single' ? `${selectedClub} · ${selectedMonth} · ${MOCK_EVENTS.length} events` : `All 17 clubs · ${selectedMonth} · ${grandEvents} events`}
            </p>
          </div>
        </div>

        {/* ── View toggle ── */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
          {([['single', 'Single Club'], ['all', 'All Clubs']] as const).map(([v, label]) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '8px 18px', borderRadius: T.radius.sm, fontFamily: 'inherit', cursor: 'pointer',
              fontSize: '12px', fontWeight: view === v ? '600' : '400',
              background: view === v ? T.colors.red : T.colors.surfaceRaised,
              color: view === v ? '#fff' : T.colors.textSecondary,
              border: `1px solid ${view === v ? T.colors.red : T.colors.border}`,
              boxShadow: view === v ? T.shadow.redGlowSm : 'none',
              transition: 'all 0.15s ease',
            }}>{label}</button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            ALL CLUBS VIEW
        ══════════════════════════════════════════════════════════════ */}
        {view === 'all' && (
          <>
            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{
                padding: '9px 14px', borderRadius: T.radius.sm, border: `1px solid ${T.colors.border}`,
                fontSize: '13px', fontFamily: 'inherit', background: T.colors.surfaceRaised,
                color: T.colors.textPrimary, cursor: 'pointer',
              }}>
                {['January 2026','February 2026','March 2026','April 2026','May 2026','June 2026','July 2026','August 2026','September 2026','October 2026','November 2026','December 2026'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <button onClick={exportAllClubs} style={{ ...T.btn.primary, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: T.shadow.redGlowSm }}>
                <Download size={13} /> Export All Clubs
              </button>
            </div>

            {/* Grand total summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '24px' }}>
              {[
                { label: 'Total Events',   value: String(grandEvents),                     color: T.colors.textPrimary, glow: false },
                { label: 'Total Revenue',  value: `R ${grandRevenue.toLocaleString()}`,    color: T.colors.textPrimary, glow: false },
                { label: 'Total Expenses', value: `R ${grandExpenses.toLocaleString()}`,    color: T.colors.textSecondary, glow: false },
                { label: 'Group P&L',      value: `R ${grandPL.toLocaleString()}`,          color: grandPL  >= 0 ? T.colors.green : T.colors.red, glow: true },
                { label: 'Group Net (6%)', value: `R ${grandNet.toLocaleString()}`,         color: grandNet >= 0 ? T.colors.green : T.colors.red, glow: true },
              ].map(c => (
                <div key={c.label} style={{ ...T.card, padding: '16px 18px', marginBottom: 0 }}>
                  <p style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>{c.label}</p>
                  <p style={{ fontSize: '18px', fontWeight: '700', color: c.color, margin: 0, fontFamily: "'SF Mono', monospace", textShadow: c.glow ? `0 0 12px ${c.color}55` : 'none' }}>{c.value}</p>
                </div>
              ))}
            </div>

            {/* All-clubs table */}
            <div style={{ ...T.card, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: `1px solid ${T.colors.border}` }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary }}>Club Performance — {selectedMonth}</span>
              </div>

              {/* Column headers — sortable */}
              <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 90px 130px 130px 130px 130px 100px', padding: '12px 24px', borderBottom: `1px solid ${T.colors.border}`, background: T.colors.surfaceRaised }}>
                <span style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>#</span>
                <SortHeader label="Club" col="name" sortBy={sortBy} sortDir={sortDir} onClick={() => toggleSort('name')} />
                <span style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'right' }}>Events</span>
                <SortHeader label="Revenue" col="revenue" sortBy={sortBy} sortDir={sortDir} onClick={() => toggleSort('revenue')} align="right" />
                <span style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'right' }}>Expenses</span>
                <SortHeader label="P&L" col="pl" sortBy={sortBy} sortDir={sortDir} onClick={() => toggleSort('pl')} align="right" />
                <span style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'right' }}>Net (6%)</span>
                <SortHeader label="Margin" col="margin" sortBy={sortBy} sortDir={sortDir} onClick={() => toggleSort('margin')} align="right" />
              </div>

              {/* Rows */}
              <div style={{ padding: '8px 16px' }}>
                {sortedSummary.map((c, idx) => (
                  <div key={c.name} onClick={() => { setSelectedClub(c.name); setView('single') }} style={{
                    display: 'grid', gridTemplateColumns: '40px 1fr 90px 130px 130px 130px 130px 100px',
                    padding: '12px 8px', borderRadius: T.radius.sm, marginBottom: '2px',
                    background: idx % 2 === 0 ? T.colors.surfaceRaised : 'transparent',
                    cursor: 'pointer', alignItems: 'center',
                    transition: 'background 0.15s ease',
                  }}>
                    <span style={{ fontSize: '11px', color: T.colors.textMuted, fontFamily: "'SF Mono', monospace" }}>{idx + 1}</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary }}>{c.name}</span>
                    <span style={{ fontSize: '12px', color: T.colors.textSecondary, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>{c.eventCount}</span>
                    <span style={{ fontSize: '13px', color: T.colors.textPrimary, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>R {c.revenue.toLocaleString()}</span>
                    <span style={{ fontSize: '13px', color: T.colors.textMuted, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>R {c.expenses.toLocaleString()}</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', textAlign: 'right', fontFamily: "'SF Mono', monospace", color: c.pl >= 0 ? T.colors.green : T.colors.red, textShadow: c.pl >= 0 ? '0 0 8px rgba(34,197,94,0.3)' : T.shadow.redGlowSm }}>
                      R {c.pl.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: '700', textAlign: 'right', fontFamily: "'SF Mono', monospace", color: c.net >= 0 ? T.colors.green : T.colors.red }}>
                      R {c.net.toLocaleString()}
                    </span>
                    <span style={{
                      fontSize: '12px', fontWeight: '700', textAlign: 'right', fontFamily: "'SF Mono', monospace",
                      color: c.margin >= 0.2 ? T.colors.green : c.margin >= 0 ? T.colors.amber : T.colors.red,
                    }}>{(c.margin * 100).toFixed(1)}%</span>
                  </div>
                ))}

                {/* Grand total row */}
                <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 90px 130px 130px 130px 130px 100px', padding: '14px 8px', marginTop: '8px', borderRadius: T.radius.sm, background: T.colors.surface, border: `1px solid ${T.colors.borderBright}` }}>
                  <span />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: T.colors.textPrimary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>All Clubs Total</span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: T.colors.textSecondary, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>{grandEvents}</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: T.colors.textPrimary, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>R {grandRevenue.toLocaleString()}</span>
                  <span style={{ fontSize: '13px', color: T.colors.textMuted, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>R {grandExpenses.toLocaleString()}</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', textAlign: 'right', fontFamily: "'SF Mono', monospace", color: grandPL >= 0 ? T.colors.green : T.colors.red, textShadow: `0 0 10px ${grandPL >= 0 ? T.colors.green : T.colors.red}55` }}>
                    R {grandPL.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '700', textAlign: 'right', fontFamily: "'SF Mono', monospace", color: grandNet >= 0 ? T.colors.green : T.colors.red, textShadow: `0 0 10px ${grandNet >= 0 ? T.colors.green : T.colors.red}55` }}>
                    R {grandNet.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '700', textAlign: 'right', fontFamily: "'SF Mono', monospace", color: T.colors.textSecondary }}>
                    {grandRevenue === 0 ? '0.0' : ((grandNet / grandRevenue) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <p style={{ padding: '12px 24px 20px', fontSize: '11px', color: T.colors.textMuted, margin: 0 }}>
                Click any club to view its detailed event breakdown
              </p>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SINGLE CLUB VIEW
        ══════════════════════════════════════════════════════════════ */}
        {view === 'single' && (
          <>
            {/* Club / month selectors + export */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center', marginBottom: '24px' }}>
              {[
                { value: selectedClub,  onChange: setSelectedClub,  options: CLUB_NAMES },
                { value: selectedMonth, onChange: setSelectedMonth, options: ['January 2026','February 2026','March 2026','April 2026','May 2026','June 2026','July 2026','August 2026','September 2026','October 2026','November 2026','December 2026'] },
              ].map((sel, i) => (
                <select key={i} value={sel.value} onChange={e => sel.onChange(e.target.value)} style={{
                  padding: '9px 14px', borderRadius: T.radius.sm,
                  border: `1px solid ${T.colors.border}`, fontSize: '13px',
                  fontFamily: 'inherit', background: T.colors.surfaceRaised,
                  color: T.colors.textPrimary, cursor: 'pointer',
                }}>
                  {sel.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ))}
              <button onClick={exportToExcel} style={{ ...T.btn.secondary, display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px' }}>
                <Download size={13} /> Export to Excel
              </button>
            </div>

            {/* Month summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '32px' }}>
              {[
                { label: 'Total Revenue',  value: `R ${totalRev.toLocaleString()}`, color: T.colors.textPrimary, glow: false },
                { label: 'Total Expenses', value: `R ${totalExp.toLocaleString()}`, color: T.colors.textSecondary, glow: false },
                { label: 'Profit / Loss',  value: `R ${totalPL.toLocaleString()}`,  color: totalPL  >= 0 ? T.colors.green : T.colors.red, glow: true },
                { label: 'Net (after 6%)', value: `R ${totalNet.toLocaleString()}`, color: totalNet >= 0 ? T.colors.green : T.colors.red, glow: true },
              ].map(c => (
                <div key={c.label} style={{ ...T.card, padding: '16px 20px', marginBottom: 0 }}>
                  <p style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>{c.label}</p>
                  <p style={{ fontSize: '20px', fontWeight: '700', color: c.color, margin: 0, fontFamily: "'SF Mono', monospace", textShadow: c.glow ? `0 0 12px ${c.color}55` : 'none' }}>{c.value}</p>
                </div>
              ))}
            </div>

            {/* Weeks */}
            {[1, 2, 3, 4].map(week => {
              const weekEvents = MOCK_EVENTS.filter(e => e.week === week)
              if (weekEvents.length === 0) return null
              const weekRev = weekEvents.reduce((s, e) => s + calcRevenue(e), 0)
              const weekPL  = weekEvents.reduce((s, e) => s + calcPL(e, e.id), 0)

              return (
                <div key={week} style={{ marginBottom: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: "'SF Mono', monospace" }}>Week {week}</span>
                      <div style={{ height: '1px', width: '32px', background: T.colors.border }} />
                    </div>
                    <span style={{ fontSize: '12px', color: T.colors.textMuted, fontFamily: "'SF Mono', monospace" }}>
                      Rev R {weekRev.toLocaleString()} ·{' '}
                      <span style={{ color: weekPL >= 0 ? T.colors.green : T.colors.red, fontWeight: '600', textShadow: weekPL >= 0 ? '0 0 8px rgba(34,197,94,0.3)' : T.shadow.redGlowSm }}>
                        P&L R {weekPL.toLocaleString()}
                      </span>
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {weekEvents.map(ev => {
                      const isOpen       = expandedId === ev.id
                      const exp          = getExp(ev.id)
                      const activeType   = eventTypes[ev.id] ?? ev.type
                      const tc           = TYPE_COLORS[activeType] ?? { bg: T.colors.surfaceRaised, color: T.colors.textSecondary, border: T.colors.border }
                      const revenue      = calcRevenue(ev)
                      const courtExp     = calcCourtExp(ev)
                      const drinkTotal   = calcDrinkTotal(ev.id)
                      const ballTotal    = calcBallTotal(ev.id)
                      const adhocTotal   = calcAdhocTotal(ev.id)
                      const sponsorTotal = calcSponsorTotal(ev.id)
                      const totalExpAmt  = calcTotalExp(ev, ev.id)
                      const pl           = calcPL(ev, ev.id)
                      const royalty      = calcRoyalty(ev, ev.id)
                      const netProfit    = calcNet(ev, ev.id)
                      const margin       = calcMargin(ev, ev.id)

                      return (
                        <div key={ev.id} style={{
                          background: T.colors.surface,
                          borderRadius: T.radius.lg,
                          border: `1px solid ${isOpen ? T.colors.red : T.colors.border}`,
                          overflow: 'hidden',
                          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                          boxShadow: isOpen ? T.shadow.redGlowSm : T.shadow.card,
                        }}>

                          <div onClick={() => setExpandedId(isOpen ? null : ev.id)} style={{
                            display: 'grid', gridTemplateColumns: '150px 1fr 100px 100px 110px 100px 24px',
                            alignItems: 'center', padding: '13px 16px', cursor: 'pointer', gap: '12px',
                          }}>
                            <select
                              value={activeType}
                              onClick={e => e.stopPropagation()}
                              onChange={e => { e.stopPropagation(); setEventTypes(prev => ({ ...prev, [ev.id]: e.target.value })) }}
                              style={{
                                fontSize: '10px', fontWeight: '700', fontFamily: 'inherit', cursor: 'pointer',
                                background: tc.bg, color: tc.color,
                                border: `1px solid ${tc.border}`,
                                borderRadius: T.radius.sm, padding: '5px 8px', width: '100%',
                                letterSpacing: '0.04em',
                              }}
                            >
                              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>

                            <div>
                              <p style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary, margin: 0 }}>{ev.name}</p>
                              <p style={{ fontSize: '11px', color: T.colors.textMuted, margin: '3px 0 0', fontFamily: "'SF Mono', monospace" }}>
                                {ev.date} · {ev.players} players · R{ev.costPerPerson}/person
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

                            <span style={{
                              color: isOpen ? T.colors.red : T.colors.textMuted,
                              fontSize: '14px', textAlign: 'center', display: 'block',
                              transition: 'transform 0.15s, color 0.15s',
                              transform: isOpen ? 'rotate(180deg)' : 'none',
                            }}>▾</span>
                          </div>

                          {isOpen && (
                            <div style={{ borderTop: `1px solid ${T.colors.border}`, padding: '20px', background: T.colors.bg }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                      <SubLabel>Court Costs</SubLabel>
                                      <span style={{ fontSize: '10px', color: T.colors.textMuted, marginBottom: '10px' }}>(Playtomic)</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                                      {[
                                        { label: '# Courts',      value: ev.courtsUsed       },
                                        { label: 'Duration (hrs)', value: ev.duration         },
                                        { label: 'Court Rate',     value: `R${ev.courtRate}`  },
                                      ].map(f => (
                                        <div key={f.label} style={{ background: T.colors.surfaceRaised, border: `1px solid ${T.colors.border}`, borderRadius: T.radius.sm, padding: '10px 12px' }}>
                                          <p style={{ fontSize: '9px', color: T.colors.textMuted, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.label}</p>
                                          <p style={{ fontSize: '14px', fontWeight: '600', color: T.colors.textSecondary, margin: 0, fontFamily: "'SF Mono', monospace" }}>{f.value}</p>
                                        </div>
                                      ))}
                                    </div>
                                    <div style={{ marginTop: '6px', background: T.colors.surfaceRaised, border: `1px solid ${T.colors.border}`, borderRadius: T.radius.sm, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: '12px', color: T.colors.textSecondary }}>Total Court Expense</span>
                                      <span style={{ fontSize: '14px', fontWeight: '700', color: T.colors.textPrimary, fontFamily: "'SF Mono', monospace" }}>R {courtExp.toLocaleString()}</span>
                                    </div>
                                  </div>

                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                      <SubLabel>Drinks Provided</SubLabel>
                                      <AddBtn label='+ Add drink' onClick={() => setExp(ev.id, p => ({ ...p, drinks: [...p.drinks, { drinkName: '', qty: 0, unitPrice: 0 }] }))} />
                                    </div>
                                    {exp.drinks.map((d, i) => (
                                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 24px', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                                        <select value={d.drinkName} style={{ ...darkInp }} onChange={e => {
                                          const sel = DRINK_PRICE_LIST.find(x => x.name === e.target.value)
                                          setExp(ev.id, p => { const drinks = [...p.drinks]; drinks[i] = { ...drinks[i], drinkName: e.target.value, unitPrice: sel?.price ?? 0 }; return { ...p, drinks } })
                                        }}>
                                          <option value=''>Select drink...</option>
                                          {DRINK_PRICE_LIST.map(dr => <option key={dr.name} value={dr.name}>{dr.name} — R{dr.price}</option>)}
                                        </select>
                                        <input type='number' min={0} value={d.qty || ''} placeholder='Qty' style={{ ...darkInp, textAlign: 'center' }}
                                          onChange={e => setExp(ev.id, p => { const drinks = [...p.drinks]; drinks[i] = { ...drinks[i], qty: Number(e.target.value) }; return { ...p, drinks } })} />
                                        <button onClick={() => setExp(ev.id, p => ({ ...p, drinks: p.drinks.filter((_, j) => j !== i) }))} style={{ background: 'none', border: 'none', color: T.colors.textMuted, cursor: 'pointer', fontSize: '16px', padding: 0 }}>×</button>
                                      </div>
                                    ))}
                                    {drinkTotal > 0 && <TotalLine label="Drink total" value={drinkTotal.toFixed(2)} />}
                                  </div>

                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                      <SubLabel>Balls Used</SubLabel>
                                      <AddBtn label='+ Add balls' onClick={() => setExp(ev.id, p => ({ ...p, balls: [...p.balls, { ballName: '', qty: 0, unitPrice: 0 }] }))} />
                                    </div>
                                    {exp.balls.map((b, i) => (
                                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 24px', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                                        <select value={b.ballName} style={{ ...darkInp }} onChange={e => {
                                          const sel = BALL_PRICE_LIST.find(x => x.name === e.target.value)
                                          setExp(ev.id, p => { const balls = [...p.balls]; balls[i] = { ...balls[i], ballName: e.target.value, unitPrice: sel?.price ?? 0 }; return { ...p, balls } })
                                        }}>
                                          <option value=''>Select balls...</option>
                                          {BALL_PRICE_LIST.map(bl => <option key={bl.name} value={bl.name}>{bl.name} — R{bl.price}</option>)}
                                        </select>
                                        <input type='number' min={0} value={b.qty || ''} placeholder='Qty' style={{ ...darkInp, textAlign: 'center' }}
                                          onChange={e => setExp(ev.id, p => { const balls = [...p.balls]; balls[i] = { ...balls[i], qty: Number(e.target.value) }; return { ...p, balls } })} />
                                        <button onClick={() => setExp(ev.id, p => ({ ...p, balls: p.balls.filter((_, j) => j !== i) }))} style={{ background: 'none', border: 'none', color: T.colors.textMuted, cursor: 'pointer', fontSize: '16px', padding: 0 }}>×</button>
                                      </div>
                                    ))}
                                    {ballTotal > 0 && <TotalLine label="Balls total" value={ballTotal.toFixed(2)} />}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                      <SubLabel>Adhoc Expenses</SubLabel>
                                      <AddBtn label='+ Add row' onClick={() => setExp(ev.id, p => ({ ...p, adhoc: [...p.adhoc, { description: '', amount: 0 }] }))} />
                                    </div>
                                    <p style={{ fontSize: '11px', color: T.colors.textMuted, margin: '0 0 8px' }}>Prizes, Playtomic wallets, paramedic, catering, etc.</p>
                                    {exp.adhoc.map((a, i) => (
                                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 24px', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                                        <input type='number' min={0} value={a.amount || ''} placeholder='R 0' style={darkInp}
                                          onChange={e => setExp(ev.id, p => { const adhoc = [...p.adhoc]; adhoc[i] = { ...adhoc[i], amount: Number(e.target.value) }; return { ...p, adhoc } })} />
                                        <input type='text' value={a.description} placeholder='Description' style={darkInp}
                                          onChange={e => setExp(ev.id, p => { const adhoc = [...p.adhoc]; adhoc[i] = { ...adhoc[i], description: e.target.value }; return { ...p, adhoc } })} />
                                        <button onClick={() => setExp(ev.id, p => ({ ...p, adhoc: p.adhoc.filter((_, j) => j !== i) }))} style={{ background: 'none', border: 'none', color: T.colors.textMuted, cursor: 'pointer', fontSize: '16px', padding: 0 }}>×</button>
                                      </div>
                                    ))}
                                    {adhocTotal > 0 && <TotalLine label="Adhoc total" value={adhocTotal.toFixed(2)} />}
                                  </div>

                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                      <SubLabel>Sponsors</SubLabel>
                                      <AddBtn label='+ Add sponsor' onClick={() => setExp(ev.id, p => ({ ...p, sponsors: [...p.sponsors, defaultSponsor()] }))} />
                                    </div>

                                    {exp.sponsors.length === 0 && (
                                      <p style={{ fontSize: '12px', color: T.colors.textMuted, fontStyle: 'italic', margin: 0 }}>No sponsors added yet.</p>
                                    )}

                                    {exp.sponsors.map((sp, i) => (
                                      <div key={i} style={{ background: T.colors.surfaceRaised, border: `1px solid ${T.colors.border}`, borderRadius: T.radius.md, padding: '14px', marginBottom: '10px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 24px', gap: '6px', marginBottom: '10px', alignItems: 'center' }}>
                                          <input type='text' value={sp.name} placeholder='Sponsor name' style={darkInp}
                                            onChange={e => setExp(ev.id, p => { const sponsors = [...p.sponsors]; sponsors[i] = { ...sponsors[i], name: e.target.value }; return { ...p, sponsors } })} />
                                          <input type='number' min={0} value={sp.amount || ''} placeholder='Amount' style={darkInp}
                                            onChange={e => setExp(ev.id, p => { const sponsors = [...p.sponsors]; sponsors[i] = { ...sponsors[i], amount: Number(e.target.value) }; return { ...p, sponsors } })} />
                                          <button onClick={() => setExp(ev.id, p => ({ ...p, sponsors: p.sponsors.filter((_, j) => j !== i) }))} style={{ background: 'none', border: 'none', color: T.colors.textMuted, cursor: 'pointer', fontSize: '16px', padding: 0 }}>×</button>
                                        </div>
                                        <div style={{ display: 'flex', gap: '16px', marginBottom: '10px' }}>
                                          {[{ key: 'invoiced', label: 'Invoiced' }, { key: 'paid', label: 'Paid' }].map(f => (
                                            <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: T.colors.textSecondary }}>
                                              <input type='checkbox' checked={(sp as any)[f.key]} style={{ accentColor: T.colors.red, width: '14px', height: '14px' }}
                                                onChange={e => setExp(ev.id, p => { const sponsors = [...p.sponsors]; sponsors[i] = { ...sponsors[i], [f.key]: e.target.checked }; return { ...p, sponsors } })} />
                                              {f.label}
                                            </label>
                                          ))}
                                        </div>
                                        <p style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Proof of Payment</p>
                                        {sp.popFileName ? (
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: T.colors.greenGlow, border: `1px solid rgba(34,197,94,0.2)`, borderRadius: T.radius.sm }}>
                                            <span>📎</span>
                                            <span style={{ fontSize: '12px', color: T.colors.green, fontWeight: '600', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sp.popFileName}</span>
                                            <button onClick={() => setExp(ev.id, p => { const sponsors = [...p.sponsors]; sponsors[i] = { ...sponsors[i], popFile: null, popFileName: '' }; return { ...p, sponsors } })} style={{ background: 'none', border: 'none', color: T.colors.textMuted, cursor: 'pointer', fontSize: '14px', padding: 0 }}>×</button>
                                          </div>
                                        ) : (
                                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: T.colors.surface, border: `1px dashed ${T.colors.borderBright}`, borderRadius: T.radius.sm, cursor: 'pointer' }}>
                                            <span>📎</span>
                                            <span style={{ fontSize: '12px', color: T.colors.textMuted }}>Attach POP (PDF, JPG, PNG)</span>
                                            <input type='file' accept='.pdf,.jpg,.jpeg,.png' style={{ display: 'none' }}
                                              onChange={e => {
                                                const file = e.target.files?.[0]; if (!file) return
                                                setExp(ev.id, p => { const sponsors = [...p.sponsors]; sponsors[i] = { ...sponsors[i], popFile: file, popFileName: file.name }; return { ...p, sponsors } })
                                              }} />
                                          </label>
                                        )}
                                      </div>
                                    ))}
                                    {sponsorTotal > 0 && <TotalLine label="Sponsor total" value={sponsorTotal.toLocaleString()} green />}
                                  </div>
                                </div>
                              </div>

                              <div style={{ marginTop: '20px', padding: '16px 20px', borderRadius: T.radius.md, background: T.colors.surfaceRaised, border: `1px solid ${T.colors.borderBright}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                {[
                                  { label: 'Revenue',    value: `R ${revenue.toLocaleString()}`,                        color: T.colors.textPrimary, glow: false },
                                  { label: 'Court Exp',  value: `R ${courtExp.toLocaleString()}`,                       color: T.colors.textSecondary, glow: false },
                                  { label: 'Other Exp',  value: `R ${(drinkTotal + ballTotal + adhocTotal).toFixed(0)}`, color: T.colors.textSecondary, glow: false },
                                  { label: 'Sponsor In', value: sponsorTotal > 0 ? `R ${sponsorTotal.toLocaleString()}` : '—', color: sponsorTotal > 0 ? T.colors.green : T.colors.textMuted, glow: sponsorTotal > 0 },
                                  { label: 'P&L',        value: `R ${pl.toFixed(0)}`,     color: pl       >= 0 ? T.colors.green : T.colors.red, glow: true },
                                  { label: 'Net Profit', value: `R ${netProfit.toFixed(0)}`, color: netProfit >= 0 ? T.colors.green : T.colors.red, glow: true },
                                ].map((s, i, arr) => (
                                  <div key={s.label} style={{ textAlign: 'center', flex: 1, borderRight: i < arr.length - 1 ? `1px solid ${T.colors.border}` : 'none', paddingRight: i < arr.length - 1 ? '8px' : 0 }}>
                                    <p style={{ fontSize: '9px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 5px' }}>{s.label}</p>
                                    <p style={{ fontSize: '14px', fontWeight: '700', color: s.color, margin: 0, fontFamily: "'SF Mono', monospace", textShadow: s.glow ? `0 0 8px ${s.color}55` : 'none' }}>{s.value}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {(() => {
                      const wEv      = MOCK_EVENTS.filter(e => e.week === week)
                      const wRev     = wEv.reduce((s, e) => s + calcRevenue(e), 0)
                      const wExp     = wEv.reduce((s, e) => s + calcTotalExp(e, e.id), 0)
                      const wPL      = wEv.reduce((s, e) => s + calcPL(e, e.id), 0)
                      const wRoyalty = wEv.reduce((s, e) => s + calcRoyalty(e, e.id), 0)
                      const wNet     = wPL - wRoyalty
                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(5, 110px)', gap: '8px', padding: '10px 16px', background: T.colors.surfaceRaised, border: `1px solid ${T.colors.borderBright}`, borderRadius: T.radius.md, marginTop: '6px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: T.colors.textSecondary, fontFamily: "'SF Mono', monospace" }}>Week {week} Totals</span>
                          <span style={{ fontSize: '11px', color: T.colors.textSecondary, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>Rev R {wRev.toLocaleString()}</span>
                          <span style={{ fontSize: '11px', color: T.colors.textMuted,     textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>Exp R {wExp.toFixed(0)}</span>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: wPL  >= 0 ? T.colors.green : T.colors.red, textAlign: 'right', fontFamily: "'SF Mono', monospace", textShadow: `0 0 6px ${wPL >= 0 ? T.colors.green : T.colors.red}44` }}>P&L R {wPL.toFixed(0)}</span>
                          <span style={{ fontSize: '11px', color: T.colors.textMuted,     textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>-6% R {wRoyalty.toFixed(0)}</span>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: wNet >= 0 ? T.colors.green : T.colors.red, textAlign: 'right', fontFamily: "'SF Mono', monospace", textShadow: `0 0 6px ${wNet >= 0 ? T.colors.green : T.colors.red}44` }}>Net R {wNet.toFixed(0)}</span>
                        </div>
                      )
                    })()}
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

function SortHeader({ label, col, sortBy, sortDir, onClick, align }: {
  label: string; col: string; sortBy: string; sortDir: 'asc' | 'desc'; onClick: () => void; align?: 'left' | 'right'
}) {
  const active = sortBy === col
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
      display: 'flex', alignItems: 'center', gap: '4px', padding: 0,
      justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
      width: '100%',
    }}>
      <span style={{ fontSize: '10px', color: active ? T.colors.red : T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: active ? '700' : '400' }}>{label}</span>
      {active && (sortDir === 'desc' ? <ChevronDown size={11} color={T.colors.red} /> : <ChevronUp size={11} color={T.colors.red} />)}
    </button>
  )
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