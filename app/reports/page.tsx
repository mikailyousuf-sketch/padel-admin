'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import OccupancyPanel from './OccupancyPanel'
import { theme } from '../components/theme'
import { getSelectedScope } from '@/lib/scope/actions'
import { currentMonthRange, businessDate } from '@/lib/reporting/dates'
import { COMPANY_SCOPE } from '@/lib/scope/constants'
import {
  listEventsForScope, listPlayersForScope, listKpiTargets,
  type ReportEventRow, type ReportPlayerRow, type KpiTargetRow,
} from './actions'

const T = theme

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
  const isCompleted = e.event_date < businessDate()
  return { revenue, totalExp, sponsorTotal, pl, royalty, net, status: isCompleted ? 'Completed' : 'Upcoming' }
}

export default function Reports() {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const [scope, setScope]           = useState<string | null>(null)
  const [loadingReal, setLoadingReal] = useState(true)
  const [realEvents, setRealEvents]   = useState<ReportEventRow[]>([])
  const [realPlayers, setRealPlayers] = useState<ReportPlayerRow[]>([])
  const [kpiTargets, setKpiTargets]   = useState<KpiTargetRow[]>([])

  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    async function load() {
      const s = await getSelectedScope()
      if (!s) { router.push('/select-club'); return }
      setScope(s)

      const now = new Date()
      const { from: monthStart, to: monthEnd } = currentMonthRange(now)

      const [events, players, targets] = await Promise.all([
        listEventsForScope(s, monthStart, monthEnd),
        listPlayersForScope(s),
        listKpiTargets(),
      ])

      setRealEvents(events)
      setRealPlayers(players)
      setKpiTargets(targets)

      setLoadingReal(false)
    }
    load().catch(() => { setLoadError('Unable to load events and player KPIs. Please refresh or contact your administrator.'); setLoadingReal(false) })
  }, [router])

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
            {scopeIsCompany && ' · Entire Company'}
          </p>
        </div>

        {scope && <OccupancyPanel key={scope} scope={scope} />}
        {loadError && <p role="alert" style={{ color: T.colors.red }}>{loadError}</p>}

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
            <span style={{ fontSize: '11px', color: T.colors.textMuted }}>Stored monthly game counts</span>
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
