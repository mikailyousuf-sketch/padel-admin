'use client'

import { useState, useEffect, useRef } from 'react'
import { Users, Calendar, TrendingUp, Clock, ChevronDown, ChevronUp, Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { theme } from './components/theme'
import { createClient } from '@/lib/supabase/client'
import { getSelectedScope } from '@/lib/scope/actions'
import { COMPANY_SCOPE } from '@/lib/scope/constants'

const T = theme

function formatTimeLabel(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const hour = h % 12 || 12
  return `${hour}${m > 0 ? `:${String(m).padStart(2, '0')}` : ''}${ampm}`
}

function getLiveDate() {
  return new Date().toLocaleDateString('en-ZA', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

function getLiveTime() {
  return new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
}

// TODO: real booking distribution requires Playtomic API access — mock until then.
const peakChartData = [
  { day: 'Mon', peak: 85, offpeak: 40 },
  { day: 'Tue', peak: 60, offpeak: 30 },
  { day: 'Wed', peak: 90, offpeak: 45 },
  { day: 'Thu', peak: 75, offpeak: 35 },
  { day: 'Fri', peak: 95, offpeak: 50 },
  { day: 'Sat', peak: 100, offpeak: 70 },
  { day: 'Sun', peak: 80, offpeak: 55 },
]

// TODO: needs per-event cost/expense tracking, which lives on the Events page,
// not event_quotes. Wire this up once that page's schema is confirmed.
const mockEvents = [
  { name: 'Corporate Tournament',  revenue: 18500, cost: 6200,  date: '2 Jun'  },
  { name: 'Club Championship',     revenue: 12000, cost: 4500,  date: '18 May' },
  { name: 'Ladies Social Evening', revenue: 4800,  cost: 1200,  date: '10 May' },
  { name: 'Junior Academy Day',    revenue: 6500,  cost: 2800,  date: '3 May'  },
]

type StatCardData = {
  label: string
  value: string
  change: string
  icon: 'calendar' | 'trending' | 'users' | 'clock' | 'zap'
  isRed: boolean
  href?: string
  detail?: string
}

type OpenState = { overview: boolean; peak: boolean; events: boolean }

function Section({ title, open, onToggle, badge, children }: {
  title: string; open: boolean
  onToggle: () => void; badge?: string; children: React.ReactNode
}) {
  return (
    <div style={{ ...T.card, marginBottom: '12px', overflow: 'hidden', padding: 0 }}>
      <button onClick={onToggle} style={{
        width: '100%', padding: '18px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'none', border: 'none', cursor: 'pointer',
        borderBottom: open ? `1px solid ${T.colors.border}` : 'none',
        fontFamily: 'inherit',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary }}>{title}</span>
          {badge && (
            <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '999px', background: T.colors.redGlow, color: T.colors.red, border: `1px solid rgba(224,10,9,0.2)`, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {badge}
            </span>
          )}
        </div>
        {open ? <ChevronUp size={15} color={T.colors.textMuted} /> : <ChevronDown size={15} color={T.colors.textMuted} />}
      </button>
      {open && <div style={{ padding: '24px' }}>{children}</div>}
    </div>
  )
}

function StatCard({ card, active, onClick }: { card: StatCardData; active: boolean; onClick: () => void }) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)

  const iconMap = {
    calendar: <Calendar size={16} color={card.isRed ? T.colors.red : T.colors.textSecondary} />,
    trending: <TrendingUp size={16} color={card.isRed ? T.colors.red : T.colors.textSecondary} />,
    users:    <Users size={16} color={card.isRed ? T.colors.red : T.colors.textSecondary} />,
    clock:    <Clock size={16} color={card.isRed ? T.colors.red : T.colors.textSecondary} />,
    zap:      <Zap size={16} color={card.isRed ? T.colors.red : T.colors.textSecondary} />,
  }

  return (
    <div
      onClick={() => { onClick(); if (card.href) router.push(card.href) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: active ? T.colors.surfaceHover : T.colors.surface,
        border: `1px solid ${active ? T.colors.red : hovered ? T.colors.borderBright : T.colors.border}`,
        borderRadius: T.radius.lg,
        padding: '22px 20px',
        display: 'flex', flexDirection: 'column', gap: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: active
          ? T.shadow.redGlowSm
          : hovered ? T.shadow.cardHover : T.shadow.card,
        position: 'relative', overflow: 'hidden',
        flexShrink: 0,
        width: '220px',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: card.isRed || active
          ? `linear-gradient(90deg, ${T.colors.red}, transparent)`
          : `linear-gradient(90deg, ${T.colors.borderBright}, transparent)`,
        opacity: active || hovered ? 1 : 0.5,
        transition: 'opacity 0.2s ease',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '11px', color: T.colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1.4, maxWidth: '100px' }}>
          {card.label}
        </span>
        <div style={{
          width: '34px', height: '34px', borderRadius: '9px',
          background: card.isRed ? T.colors.redGlow : T.colors.surfaceRaised,
          border: `1px solid ${card.isRed ? 'rgba(224,10,9,0.2)' : T.colors.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {iconMap[card.icon]}
        </div>
      </div>

      <p style={{ fontSize: '28px', fontWeight: '700', color: T.colors.textPrimary, margin: 0, lineHeight: 1, letterSpacing: '-0.03em', fontFamily: "'SF Mono', monospace" }}>
        {card.value}
      </p>

      <p style={{ fontSize: '11px', color: T.colors.textSecondary, margin: 0 }}>{card.change}</p>

      {card.detail && (
        <p style={{ fontSize: '10px', color: T.colors.textMuted, margin: 0, fontFamily: "'SF Mono', monospace" }}>{card.detail}</p>
      )}

      {card.href && (
        <div style={{
          position: 'absolute', bottom: '10px', right: '12px',
          fontSize: '9px', color: active ? T.colors.red : T.colors.textMuted,
          opacity: active || hovered ? 1 : 0, transition: 'opacity 0.2s ease',
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          View →
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen]           = useState<OpenState>({ overview: true, peak: true, events: true })
  const [time, setTime]           = useState(getLiveTime())
  const [mounted, setMounted]     = useState(false)
  const [activeCard, setActiveCard] = useState(0)
  const [showAI, setShowAI]       = useState(false)
  const [aiMode, setAiMode]       = useState<'quote' | 'whatsapp'>('quote')
  const scrollRef                 = useRef<HTMLDivElement>(null)
  const autoSlideRef              = useRef<NodeJS.Timeout | null>(null)

  const [peakTimes, setPeakTimes] = useState({
    morningStart: '06:00',
    morningEnd:   '10:00',
    eveningStart: '15:00',
    eveningEnd:   '22:00',
  })
  const [eventsThisMonth, setEventsThisMonth] = useState(0)
  const [monthlyRevenue, setMonthlyRevenue] = useState(0)
  const [scopeIsCompany, setScopeIsCompany] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setTime(getLiveTime()), 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    async function load() {
      // The choice made at /select-club — a specific club_id, or the
      // company-wide sentinel. If nobody's chosen yet (e.g. cookies were
      // cleared, or someone landed on '/' directly), send them there first
      // rather than silently guessing which club to show.
      const scope = await getSelectedScope()
      if (!scope) {
        router.push('/select-club')
        return
      }
      const isCompany = scope === COMPANY_SCOPE
      setScopeIsCompany(isCompany)

      // Peak window — for a specific club, pull that club's config directly.
      // For company-wide, there's no single "peak window" that makes sense
      // to show, so this falls back to whichever club RLS returns first,
      // purely as a representative sample — the UI below labels it as such.
      const peakQuery = supabase
        .from('club_config')
        .select('peak_morning_start, peak_morning_end, peak_evening_start, peak_evening_end, clubs(name)')

      const { data: configRows } = isCompany
        ? await peakQuery.order('clubs(name)').limit(1)
        : await peakQuery.eq('club_id', scope).limit(1)

      if (configRows && configRows[0]) {
        const row: any = configRows[0]
        setPeakTimes({
          morningStart: row.peak_morning_start,
          morningEnd: row.peak_morning_end,
          eveningStart: row.peak_evening_start,
          eveningEnd: row.peak_evening_end,
        })
      }

      // Events this month + monthly revenue — real, from event_quotes.
      // Company-wide: RLS already scopes this to every club the user can
      // access, so no explicit club filter = correctly aggregated across
      // all of them. Single club: filter explicitly to that club_id.
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

      let quoteQuery = supabase
        .from('event_quotes')
        .select('total, status, event_date')
        .in('status', ['invoiced', 'sent', 'paid'])
        .gte('event_date', monthStart)
        .lte('event_date', monthEnd)

      if (!isCompany) {
        quoteQuery = quoteQuery.eq('club_id', scope)
      }

      const { data: quoteRows } = await quoteQuery

      if (quoteRows) {
        setEventsThisMonth(quoteRows.length)
        setMonthlyRevenue(quoteRows.reduce((sum, q) => sum + (q.total ?? 0), 0))
      }
    }
    load()
  }, [])

  useEffect(() => {
    autoSlideRef.current = setInterval(() => {
      setActiveCard(prev => (prev + 1) % stats.length)
    }, 4000)
    return () => { if (autoSlideRef.current) clearInterval(autoSlideRef.current) }
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      const card = scrollRef.current.children[activeCard] as HTMLElement
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [activeCard])

  const resetAutoSlide = () => {
    if (autoSlideRef.current) clearInterval(autoSlideRef.current)
    autoSlideRef.current = setInterval(() => {
      setActiveCard(prev => (prev + 1) % stats.length)
    }, 4000)
  }

  const goTo = (idx: number) => { setActiveCard(idx); resetAutoSlide() }
  const prev = () => goTo((activeCard - 1 + stats.length) % stats.length)
  const next = () => goTo((activeCard + 1) % stats.length)

  const toggle = (id: keyof OpenState) => setOpen(prev => ({ ...prev, [id]: !prev[id] }))

  const peakLabel    = `${formatTimeLabel(peakTimes.morningStart)}–${formatTimeLabel(peakTimes.morningEnd)} & ${formatTimeLabel(peakTimes.eveningStart)}–${formatTimeLabel(peakTimes.eveningEnd)}`
  const offPeakLabel = `${formatTimeLabel(peakTimes.morningEnd)}–${formatTimeLabel(peakTimes.eveningStart)}`

  const totalRevenue = mockEvents.reduce((a, e) => a + e.revenue, 0)
  const totalCost    = mockEvents.reduce((a, e) => a + e.cost, 0)
  const totalProfit  = totalRevenue - totalCost

  const stats: StatCardData[] = [
    { label: "Today's Bookings",  value: '24',   change: '↑ 3 more than yesterday',  icon: 'calendar', isRed: true,  href: '/reports', detail: 'Tap to view reports' },
    { label: 'Court Occupancy',   value: '78%',  change: '↑ Above weekly average',   icon: 'trending', isRed: false, href: '/reports', detail: 'Tap to view occupancy' },
    { label: 'Active Players',    value: '186',  change: 'This month',               icon: 'users',    isRed: true,  href: '/reports', detail: 'Tap to view player tracker' },
    { label: 'Next Peak Window',  value: formatTimeLabel(peakTimes.eveningStart), change: peakLabel, icon: 'clock', isRed: false, detail: scopeIsCompany ? `Varies by club · Off-peak: ${offPeakLabel}` : `Off-peak: ${offPeakLabel}` },
    { label: 'Events This Month', value: String(eventsThisMonth), change: 'Invoiced, sent or paid', icon: 'zap', isRed: true, href: '/events', detail: 'Tap to view events' },
    { label: 'Monthly Revenue',   value: `R ${Math.round(monthlyRevenue / 1000)}k`, change: 'From event quotes this month', icon: 'trending', isRed: false, href: '/reports', detail: 'Tap to view revenue' },
  ]

  const active = stats[activeCard]

  return (
    <div style={{ minHeight: '100vh', background: T.colors.bg }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 36px' }}>

        <div style={{ marginBottom: '36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: T.colors.red, boxShadow: T.shadow.redGlowSm,
                animation: 'pulse 2s infinite',
              }} />
              <span style={{ fontSize: '11px', color: T.colors.red, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Live</span>
              {scopeIsCompany && (
                <span style={{ fontSize: '10px', color: T.colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', marginLeft: '4px' }}>
                  · Entire Company
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: T.colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
              Club Dashboard
            </h1>
            <p style={{ fontSize: '13px', color: T.colors.textSecondary, marginTop: '5px' }}>{getLiveDate()}</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              padding: '8px 16px', borderRadius: T.radius.md,
              background: T.colors.surface, border: `1px solid ${T.colors.border}`,
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              fontSize: '20px', fontWeight: '600', color: T.colors.textPrimary,
              letterSpacing: '0.05em',
            }}>
              {mounted ? time : '--:--'}
            </div>

            <button
              onClick={() => setShowAI(!showAI)}
              style={{
                ...T.btn.primary,
                display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: showAI ? T.shadow.redGlow : T.shadow.redGlowSm,
                background: showAI ? '#c00807' : T.colors.red,
              }}
            >
              <Zap size={14} />
              AI Assistant
            </button>
          </div>
        </div>

        {showAI && (
          <div style={{
            ...T.card,
            marginBottom: '16px',
            padding: '20px 24px',
            border: `1px solid rgba(224,10,9,0.3)`,
            boxShadow: T.shadow.redGlowSm,
            animation: 'fadeIn 0.2s ease',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Zap size={14} color={T.colors.red} />
                <span style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary }}>Quick AI Actions</span>
              </div>
              <button onClick={() => setShowAI(false)} style={{ background: 'none', border: 'none', color: T.colors.textMuted, cursor: 'pointer', fontSize: '16px', padding: 0 }}>×</button>
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
              {([['quote', 'Generate Quote'], ['whatsapp', 'WhatsApp Alert']] as const).map(([mode, label]) => (
                <button key={mode} onClick={() => setAiMode(mode)} style={{
                  padding: '6px 14px', borderRadius: T.radius.sm, fontFamily: 'inherit', cursor: 'pointer',
                  fontSize: '12px', fontWeight: aiMode === mode ? '600' : '400',
                  background: aiMode === mode ? T.colors.red : T.colors.surfaceRaised,
                  color: aiMode === mode ? '#fff' : T.colors.textSecondary,
                  border: `1px solid ${aiMode === mode ? T.colors.red : T.colors.border}`,
                  transition: 'all 0.15s ease',
                }}>{label}</button>
              ))}
            </div>

            {aiMode === 'quote' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: 0 }}>Quickly generate a customer quote or event proposal.</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    placeholder="Describe the event or booking..."
                    style={{ ...T.input, flex: 1, fontSize: '13px' }}
                  />
                  <button style={{ ...T.btn.primary, padding: '10px 20px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={12} /> Generate
                  </button>
                </div>
                <p style={{ fontSize: '11px', color: T.colors.textMuted, margin: 0 }}>
                  Full quote builder available in <span style={{ color: T.colors.red, cursor: 'pointer' }}>AI Assistant → Quote Generator</span>
                </p>
              </div>
            )}

            {aiMode === 'whatsapp' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: 0 }}>Send a quick court availability or event alert to your community.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: '8px' }}>
                  <input
                    placeholder="Message or topic..."
                    style={{ ...T.input, fontSize: '13px' }}
                  />
                  <select style={{ ...T.input, fontSize: '13px', cursor: 'pointer' }}>
                    <option>Court Availability</option>
                    <option>Event Reminder</option>
                    <option>Custom Message</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ ...T.btn.primary, padding: '9px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={12} /> Send Now
                  </button>
                  <button style={{ ...T.btn.secondary, padding: '9px 20px' }}>Schedule</button>
                </div>
                <p style={{ fontSize: '11px', color: T.colors.textMuted, margin: 0 }}>
                  Full automation in <span style={{ color: T.colors.red, cursor: 'pointer' }}>AI Assistant → WhatsApp Automation</span>
                </p>
              </div>
            )}
          </div>
        )}

        <Section title="Today's Overview" open={open.overview} onToggle={() => toggle('overview')} badge="Live">
          <div style={{ position: 'relative' }}>
            <div
              ref={scrollRef}
              style={{
                display: 'flex', gap: '12px',
                overflowX: 'auto', scrollSnapType: 'x mandatory',
                paddingBottom: '4px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {stats.map((card, idx) => (
                <div key={card.label} style={{ scrollSnapAlign: 'start', flexShrink: 0 }}>
                  <StatCard
                    card={card}
                    active={activeCard === idx}
                    onClick={() => goTo(idx)}
                  />
                </div>
              ))}
            </div>

            <div style={{ position: 'absolute', top: 0, right: 0, bottom: '4px', width: '48px', background: `linear-gradient(to left, ${T.colors.surface}, transparent)`, pointerEvents: 'none', borderRadius: T.radius.lg }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {stats.map((_, idx) => (
                <button key={idx} onClick={() => goTo(idx)} style={{
                  width: activeCard === idx ? '20px' : '6px',
                  height: '6px', borderRadius: '999px',
                  background: activeCard === idx ? T.colors.red : T.colors.borderBright,
                  border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'all 0.25s ease',
                  boxShadow: activeCard === idx ? T.shadow.redGlowSm : 'none',
                }} />
              ))}
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={prev} style={{
                ...T.btn.ghost, padding: '6px 10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ChevronLeft size={14} />
              </button>
              <button onClick={next} style={{
                ...T.btn.ghost, padding: '6px 10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div style={{
            marginTop: '14px', padding: '12px 16px',
            background: T.colors.bg, border: `1px solid ${T.colors.border}`,
            borderRadius: T.radius.md,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: T.colors.red, boxShadow: T.shadow.redGlowSm, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '11px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>{active.label}</p>
                <p style={{ fontSize: '18px', fontWeight: '700', color: T.colors.textPrimary, margin: 0, fontFamily: "'SF Mono', monospace", letterSpacing: '-0.02em' }}>{active.value}</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '12px', color: T.colors.textSecondary, margin: '0 0 3px' }}>{active.change}</p>
              {active.detail && <p style={{ fontSize: '11px', color: T.colors.textMuted, margin: 0 }}>{active.detail}</p>}
            </div>
          </div>
        </Section>

        <Section title="Peak vs Off-Peak — This Week" open={open.peak} onToggle={() => toggle('peak')}>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
            {[
              { label: `Peak  ${peakLabel}`,        color: T.colors.red          },
              { label: `Off-peak  ${offPeakLabel}`, color: T.colors.borderBright },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: l.color, boxShadow: l.color === T.colors.red ? T.shadow.redGlowSm : 'none' }} />
                <span style={{ fontSize: '12px', color: T.colors.textSecondary, fontFamily: "'SF Mono', monospace" }}>{l.label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {peakChartData.map((row, idx) => (
              <div key={row.day} style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'none' : 'translateX(-8px)',
                transition: `opacity 0.4s ease ${idx * 60}ms, transform 0.4s ease ${idx * 60}ms`,
              }}>
                <span style={{ fontSize: '12px', color: T.colors.textSecondary, width: '32px', fontWeight: '500', flexShrink: 0, fontFamily: "'SF Mono', monospace" }}>{row.day}</span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ background: T.colors.surfaceRaised, borderRadius: '4px', height: '12px', overflow: 'hidden' }}>
                    <div style={{ width: `${row.peak}%`, height: '12px', borderRadius: '4px', background: `linear-gradient(90deg, ${T.colors.red}, rgba(224,10,9,0.6))`, boxShadow: '0 0 8px rgba(224,10,9,0.4)', transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
                  </div>
                  <div style={{ background: T.colors.surfaceRaised, borderRadius: '4px', height: '12px', overflow: 'hidden' }}>
                    <div style={{ width: `${row.offpeak}%`, height: '12px', borderRadius: '4px', background: T.colors.borderBright, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1) 0.1s' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '40px', textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: '12px', color: T.colors.red, fontWeight: '700', fontFamily: "'SF Mono', monospace" }}>{row.peak}%</span>
                  <span style={{ fontSize: '11px', color: T.colors.textMuted, fontFamily: "'SF Mono', monospace" }}>{row.offpeak}%</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Event P&L — This Month" open={open.events} onToggle={() => toggle('events')}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 110px', marginBottom: '8px', padding: '0 14px' }}>
            {['Event', 'Revenue', 'Cost', 'Profit'].map((h, i) => (
              <span key={h} style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: i > 0 ? 'right' : 'left' }}>{h}</span>
            ))}
          </div>
          {mockEvents.map((ev, idx) => {
            const profit = ev.revenue - ev.cost
            return (
              <div key={ev.name} style={{
                display: 'grid', gridTemplateColumns: '1fr 110px 110px 110px',
                padding: '13px 14px', borderRadius: T.radius.md, marginBottom: '4px',
                background: idx % 2 === 0 ? T.colors.surfaceRaised : T.colors.surface,
                border: `1px solid ${T.colors.border}`, alignItems: 'center',
              }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary, margin: 0 }}>{ev.name}</p>
                  <p style={{ fontSize: '11px', color: T.colors.textMuted, margin: '3px 0 0', fontFamily: "'SF Mono', monospace" }}>{ev.date}</p>
                </div>
                <span style={{ fontSize: '13px', color: T.colors.textSecondary, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>R {ev.revenue.toLocaleString()}</span>
                <span style={{ fontSize: '13px', color: T.colors.textMuted, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>R {ev.cost.toLocaleString()}</span>
                <span style={{ fontSize: '13px', fontWeight: '700', textAlign: 'right', fontFamily: "'SF Mono', monospace", color: profit > 0 ? T.colors.green : T.colors.red, textShadow: profit > 0 ? '0 0 8px rgba(34,197,94,0.3)' : '0 0 8px rgba(224,10,9,0.3)' }}>
                  R {profit.toLocaleString()}
                </span>
              </div>
            )
          })}
          <div style={{ marginTop: '10px', padding: '16px 14px', borderRadius: T.radius.md, background: T.colors.surfaceRaised, border: `1px solid ${T.colors.borderBright}`, display: 'grid', gridTemplateColumns: '1fr 110px 110px 110px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: T.colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Month Total</span>
            <span style={{ fontSize: '13px', color: T.colors.textPrimary, textAlign: 'right', fontFamily: "'SF Mono', monospace", fontWeight: '600' }}>R {totalRevenue.toLocaleString()}</span>
            <span style={{ fontSize: '13px', color: T.colors.textMuted, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>R {totalCost.toLocaleString()}</span>
            <span style={{ fontSize: '14px', fontWeight: '700', textAlign: 'right', color: T.colors.green, fontFamily: "'SF Mono', monospace", textShadow: '0 0 12px rgba(34,197,94,0.4)' }}>R {totalProfit.toLocaleString()}</span>
          </div>
        </Section>

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(224,10,9,0.4); }
          50% { opacity: 0.5; box-shadow: 0 0 12px rgba(224,10,9,0.2); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}