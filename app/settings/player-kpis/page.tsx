'use client'

import { useState, useEffect } from 'react'
import { Trophy, Plane, Heart, HelpCircle, CheckCircle2, Calendar, Shield, Users } from 'lucide-react'
import { theme } from '../../components/theme'

const T = theme

const CLUB_NAMES = ['BALLITO','BEDFORDVIEW','CENTURION','DURBANVILLE','EPICENTRE','GATEWAY','GEORGE','GLEN','GROENKLOOF','HUDDLE','LORRAINE','LOURENSFORD','LONEHILL','OLD EDS','POINT','RANDPARK','WOODSTOCK']

// ── Tracked categories — only Ambassadors and Staff have real KPI targets.
// All other categories (VAPC Members, VIP, etc.) are customer benefits, not tracked. ──
const TRACKED_CATEGORIES = ['Staff', 'Ambassadors'] as const
type TrackedCategory = typeof TRACKED_CATEGORIES[number]

type PlayerStatus = 'Active' | 'Injured' | 'Travelling' | 'Other'

const STATUS_META: Record<PlayerStatus, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  Active:     { color: T.colors.green, bg: T.colors.greenGlow, border: 'rgba(34,197,94,0.2)', icon: <CheckCircle2 size={12} /> },
  Injured:    { color: T.colors.red,   bg: T.colors.redGlow,   border: 'rgba(224,10,9,0.2)',  icon: <Heart size={12} /> },
  Travelling: { color: '#3b82f6',      bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', icon: <Plane size={12} /> },
  Other:      { color: T.colors.amber, bg: T.colors.amberGlow, border: 'rgba(245,158,11,0.2)', icon: <HelpCircle size={12} /> },
}

interface Player {
  id: number
  name: string
  category: TrackedCategory
  club: string
  openGames: number
  privateGames: number
  status: PlayerStatus
  statusFrom: string | null
  statusTo: string | null
  statusNote: string
}

// Mock roster — same players referenced in Reports' Player Tracker.
// openGames/privateGames will be pulled live from Playtomic once connected;
// for now they're seeded mock activity for the current month.
const MOCK_PLAYERS: Player[] = [
  { id: 1, name: 'Jason Mokoena',      category: 'Staff',       club: 'WOODSTOCK',  openGames: 5, privateGames: 3, status: 'Active', statusFrom: null, statusTo: null, statusNote: '' },
  { id: 2, name: 'Lerato Dlamini',     category: 'Staff',       club: 'WOODSTOCK',  openGames: 7, privateGames: 4, status: 'Active', statusFrom: null, statusTo: null, statusNote: '' },
  { id: 3, name: 'Sipho Ndlovu',       category: 'Ambassadors', club: 'CENTURION',  openGames: 2, privateGames: 1, status: 'Injured', statusFrom: '2026-06-10', statusTo: '2026-06-30', statusNote: 'Ankle sprain during a social match, expected back end of month.' },
  { id: 4, name: 'Anika van der Berg', category: 'Ambassadors', club: 'GATEWAY',    openGames: 4, privateGames: 3, status: 'Active', statusFrom: null, statusTo: null, statusNote: '' },
  { id: 5, name: 'Tariq Hendricks',    category: 'Staff',       club: 'BALLITO',    openGames: 3, privateGames: 2, status: 'Travelling', statusFrom: '2026-06-15', statusTo: '2026-06-22', statusNote: 'Attending coaching certification course.' },
  { id: 6, name: 'Nadia Rousseau',     category: 'Ambassadors', club: 'WOODSTOCK',  openGames: 3, privateGames: 1, status: 'Active', statusFrom: null, statusTo: null, statusNote: '' },
]

const STORAGE_KEY = 'padel_kpi_config'

interface CategoryTarget {
  openGames: number
  privateGames: number
}

interface KPIConfig {
  targets: Record<TrackedCategory, CategoryTarget>
  players: Player[]
}

const defaultConfig: KPIConfig = {
  targets: {
    Staff:       { openGames: 6, privateGames: 4 },
    Ambassadors: { openGames: 4, privateGames: 2 },
  },
  players: MOCK_PLAYERS,
}

const lbl: React.CSSProperties = {
  fontSize: '11px', fontWeight: '600', color: T.colors.textSecondary,
  textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '7px',
}
const groupTitle: React.CSSProperties = {
  fontSize: '11px', fontWeight: '700', color: T.colors.textMuted,
  textTransform: 'uppercase', letterSpacing: '0.08em',
  marginBottom: '14px', paddingBottom: '8px', borderBottom: `1px solid ${T.colors.border}`,
}

function daysActive(from: string | null, to: string | null) {
  if (!from) return null
  const start = new Date(from)
  const end = to ? new Date(to) : new Date()
  return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
}

export default function PlayerKPITargetsPage() {
  const [config, setConfig] = useState<KPIConfig>(defaultConfig)
  const [saved, setSaved] = useState(false)
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null)
  const [filterCategory, setFilterCategory] = useState<TrackedCategory | 'All'>('All')
  const [filterClub, setFilterClub] = useState<string>('All Clubs')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setConfig(JSON.parse(stored))
  }, [])

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const updateTarget = (category: TrackedCategory, field: keyof CategoryTarget, value: number) => {
    setConfig(prev => ({ ...prev, targets: { ...prev.targets, [category]: { ...prev.targets[category], [field]: value } } }))
    setSaved(false)
  }

  const updatePlayerStatus = (id: number, updates: Partial<Player>) => {
    setConfig(prev => ({
      ...prev,
      players: prev.players.map(p => p.id === id ? { ...p, ...updates } : p),
    }))
    setSaved(false)
  }

  const filteredPlayers = config.players.filter(p =>
    (filterCategory === 'All' || p.category === filterCategory) &&
    (filterClub === 'All Clubs' || p.club === filterClub)
  )

  const flaggedCount = config.players.filter(p => p.status !== 'Active').length
  const clubsWithPlayers = ['All Clubs', ...Array.from(new Set(config.players.map(p => p.club)))]

  return (
    <div style={{ minHeight: '100vh', background: T.colors.bg }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 36px' }}>

        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.colors.red, boxShadow: T.shadow.redGlowSm }} />
            <span style={{ fontSize: '11px', color: T.colors.red, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Settings</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: T.colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>Player KPI Targets</h1>
          <p style={{ fontSize: '13px', color: T.colors.textSecondary, marginTop: '5px' }}>
            Open &amp; private game targets and availability status for Staff &amp; Ambassadors
            {flaggedCount > 0 && <span style={{ color: T.colors.amber }}> · {flaggedCount} flagged unavailable</span>}
          </p>
        </div>

        {/* ── Explainer ── */}
        <div style={{ ...T.card, marginBottom: '24px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Trophy size={16} color={T.colors.textMuted} />
          <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: 0 }}>
            Only Staff and Ambassadors have monthly KPI targets — tracked as open games and private games played, sourced from Playtomic activity. Other categories (VAPC Members, VIP, etc.) are customer benefits and aren't tracked here.
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            CATEGORY TARGETS — HOO sets these
        ══════════════════════════════════════════════════════════════ */}
        <div style={{ ...T.card, marginBottom: '24px', border: `1px solid rgba(168,85,247,0.2)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Shield size={13} color="#a855f7" />
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Head of Operations Only</span>
          </div>
          <p style={groupTitle}>Monthly Game Targets (Global)</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {TRACKED_CATEGORIES.map(cat => (
              <div key={cat}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: T.colors.textPrimary, margin: '0 0 10px' }}>{cat}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={lbl}>Open Games</label>
                    <input type="number" min={0} value={config.targets[cat].openGames} style={T.input}
                      onChange={e => updateTarget(cat, 'openGames', parseInt(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label style={lbl}>Private Games</label>
                    <input type="number" min={0} value={config.targets[cat].privateGames} style={T.input}
                      onChange={e => updateTarget(cat, 'privateGames', parseInt(e.target.value) || 0)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            PLAYER ROSTER & STATUS — Club managers update this
        ══════════════════════════════════════════════════════════════ */}
        <div style={{ ...T.card, marginBottom: '14px', padding: '14px 20px', border: `1px solid rgba(59,130,246,0.2)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={13} color="#3b82f6" />
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Club Manager Access</span>
          </div>
          <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: '6px 0 0' }}>
            Club managers update their own players' availability status below. Targets above are set by Head Office only.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
            Player Roster
          </p>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={filterClub} onChange={e => setFilterClub(e.target.value)} style={{
              padding: '6px 12px', borderRadius: T.radius.sm, border: `1px solid ${T.colors.border}`,
              fontSize: '12px', fontFamily: 'inherit', background: T.colors.surfaceRaised,
              color: T.colors.textPrimary, cursor: 'pointer',
            }}>
              {clubsWithPlayers.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['All', ...TRACKED_CATEGORIES] as const).map(c => (
                <button key={c} onClick={() => setFilterCategory(c)} style={{ ...T.periodBtn(filterCategory === c), fontSize: '11px', padding: '5px 12px' }}>{c}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
          {filteredPlayers.length === 0 && (
            <div style={{ ...T.card, textAlign: 'center', padding: '32px', color: T.colors.textMuted, fontSize: '13px' }}>
              No players match this filter.
            </div>
          )}

          {filteredPlayers.map(player => {
            const meta = STATUS_META[player.status]
            const isEditing = editingStatusId === player.id
            const activeDays = daysActive(player.statusFrom, player.statusTo)
            const target = config.targets[player.category]
            const openPct = target.openGames > 0 ? Math.round((player.openGames / target.openGames) * 100) : 0
            const privatePct = target.privateGames > 0 ? Math.round((player.privateGames / target.privateGames) * 100) : 0

            return (
              <div key={player.id} style={{
                background: T.colors.surface, borderRadius: T.radius.md,
                border: `1px solid ${player.status !== 'Active' ? meta.border : T.colors.border}`,
                padding: '14px 16px', boxShadow: player.status !== 'Active' ? `0 0 8px ${meta.color}22` : 'none',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary, margin: 0 }}>{player.name}</p>
                      <span style={{ fontSize: '10px', color: T.colors.textMuted, fontFamily: "'SF Mono', monospace" }}>{player.category} · {player.club}</span>
                    </div>

                    {/* Open / private game progress */}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: T.colors.textSecondary }}>
                        Open: <strong style={{ color: openPct >= 100 ? T.colors.green : T.colors.textPrimary, fontFamily: "'SF Mono', monospace" }}>{player.openGames}/{target.openGames}</strong>
                      </span>
                      <span style={{ fontSize: '11px', color: T.colors.textSecondary }}>
                        Private: <strong style={{ color: privatePct >= 100 ? T.colors.green : T.colors.textPrimary, fontFamily: "'SF Mono', monospace" }}>{player.privateGames}/{target.privateGames}</strong>
                      </span>
                    </div>

                    {player.status !== 'Active' && player.statusNote && (
                      <p style={{ fontSize: '12px', color: T.colors.textSecondary, margin: '6px 0 0', maxWidth: '460px' }}>{player.statusNote}</p>
                    )}
                    {player.status !== 'Active' && player.statusFrom && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                        <Calendar size={11} color={T.colors.textMuted} />
                        <span style={{ fontSize: '11px', color: T.colors.textMuted, fontFamily: "'SF Mono', monospace" }}>
                          {new Date(player.statusFrom).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                          {player.statusTo ? ` → ${new Date(player.statusTo).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}` : ' → ongoing'}
                          {activeDays !== null && ` · ${activeDays} days`}
                        </span>
                      </div>
                    )}
                  </div>

                  <button onClick={() => setEditingStatusId(isEditing ? null : player.id)} style={{
                    display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
                    fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '999px',
                    border: `1px solid ${meta.border}`, background: meta.bg, color: meta.color,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    {meta.icon} {player.status}
                  </button>
                </div>

                {isEditing && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${T.colors.border}` }}>
                    <p style={{ ...lbl, marginBottom: '10px' }}>Set Status</p>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                      {(Object.keys(STATUS_META) as PlayerStatus[]).map(s => {
                        const m = STATUS_META[s]
                        const active = player.status === s
                        return (
                          <button key={s} onClick={() => updatePlayerStatus(player.id, { status: s, ...(s === 'Active' ? { statusFrom: null, statusTo: null, statusNote: '' } : {}) })} style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            fontSize: '12px', fontWeight: '600', padding: '6px 12px', borderRadius: T.radius.sm,
                            border: `1px solid ${active ? m.color : T.colors.border}`,
                            background: active ? m.bg : T.colors.surfaceRaised,
                            color: active ? m.color : T.colors.textSecondary,
                            cursor: 'pointer', fontFamily: 'inherit',
                          }}>
                            {m.icon} {s}
                          </button>
                        )
                      })}
                    </div>

                    {player.status !== 'Active' && (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                          <div>
                            <label style={lbl}>From</label>
                            <input type="date" value={player.statusFrom ?? ''} style={T.input}
                              onChange={e => updatePlayerStatus(player.id, { statusFrom: e.target.value })} />
                          </div>
                          <div>
                            <label style={lbl}>To (leave blank if ongoing)</label>
                            <input type="date" value={player.statusTo ?? ''} style={T.input}
                              onChange={e => updatePlayerStatus(player.id, { statusTo: e.target.value })} />
                          </div>
                        </div>
                        <div style={{ marginBottom: '4px' }}>
                          <label style={lbl}>Note</label>
                          <textarea value={player.statusNote} rows={2} placeholder="Reason / context..."
                            style={{ ...T.input, resize: 'vertical', fontFamily: 'inherit' }}
                            onChange={e => updatePlayerStatus(player.id, { statusNote: e.target.value })} />
                        </div>
                      </>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                      <button onClick={() => setEditingStatusId(null)} style={{ ...T.btn.ghost, fontSize: '12px' }}>Done</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '48px' }}>
          <button onClick={save} style={{
            ...T.btn.primary, padding: '12px 32px',
            background: saved ? T.colors.green : T.colors.red,
            boxShadow: saved ? '0 0 16px rgba(34,197,94,0.3)' : T.shadow.redGlowSm,
          }}>
            {saved ? '✓ Saved' : 'Save KPI Targets & Status'}
          </button>
          {saved && <span style={{ fontSize: '13px', color: T.colors.green }}>Saved successfully</span>}
        </div>
      </div>
    </div>
  )
}