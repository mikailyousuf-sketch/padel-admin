'use client'

import { useState, useEffect } from 'react'
import { Trophy, Plane, Heart, HelpCircle, CheckCircle2, Calendar, Shield, Users } from 'lucide-react'
import { theme } from '../../components/theme'
import { createClient } from '@/lib/supabase/client'

const T = theme

const TRACKED_CATEGORIES = ['Staff', 'Ambassadors'] as const
type TrackedCategory = typeof TRACKED_CATEGORIES[number]

// UI label <-> DB value mapping (DB stores lowercase singular)
const CATEGORY_TO_DB: Record<TrackedCategory, string> = { Staff: 'staff', Ambassadors: 'ambassador' }
const DB_TO_CATEGORY: Record<string, TrackedCategory> = { staff: 'Staff', ambassador: 'Ambassadors' }

type PlayerStatus = 'Active' | 'Injured' | 'Travelling' | 'Other'
const STATUS_TO_DB: Record<PlayerStatus, string> = { Active: 'active', Injured: 'injured', Travelling: 'travelling', Other: 'other' }
const DB_TO_STATUS: Record<string, PlayerStatus> = { active: 'Active', injured: 'Injured', travelling: 'Travelling', other: 'Other' }

const STATUS_META: Record<PlayerStatus, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  Active:     { color: T.colors.green, bg: T.colors.greenGlow, border: 'rgba(34,197,94,0.2)', icon: <CheckCircle2 size={12} /> },
  Injured:    { color: T.colors.red,   bg: T.colors.redGlow,   border: 'rgba(224,10,9,0.2)',  icon: <Heart size={12} /> },
  Travelling: { color: '#3b82f6',      bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', icon: <Plane size={12} /> },
  Other:      { color: T.colors.amber, bg: T.colors.amberGlow, border: 'rgba(245,158,11,0.2)', icon: <HelpCircle size={12} /> },
}

interface Player {
  id: string
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

interface CategoryTarget {
  openGames: number
  privateGames: number
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
  const supabase = createClient()
  const [targets, setTargets] = useState<Record<TrackedCategory, CategoryTarget>>({
    Staff: { openGames: 0, privateGames: 0 },
    Ambassadors: { openGames: 0, privateGames: 0 },
  })
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [targetsError, setTargetsError] = useState<string | null>(null)
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<TrackedCategory | 'All'>('All')
  const [filterClub, setFilterClub] = useState<string>('All Clubs')

  async function load() {
    const [targetsRes, playersRes] = await Promise.all([
      supabase.from('kpi_targets').select('category, open_game_target, private_game_target'),
      supabase.from('players').select('id, name, category, status, monthly_open_games, monthly_private_games, status_from, status_to, status_note, clubs(name)'),
    ])

    if (targetsRes.data) {
      const next = { ...targets }
      for (const row of targetsRes.data) {
        const label = DB_TO_CATEGORY[row.category]
        if (label) next[label] = { openGames: row.open_game_target, privateGames: row.private_game_target }
      }
      setTargets(next)
    }

    if (playersRes.data) {
      setPlayers(
        playersRes.data.map((row: any) => ({
          id: row.id,
          name: row.name,
          category: DB_TO_CATEGORY[row.category] ?? 'Staff',
          club: row.clubs?.name?.toUpperCase() ?? '',
          openGames: row.monthly_open_games,
          privateGames: row.monthly_private_games,
          status: DB_TO_STATUS[row.status] ?? 'Active',
          statusFrom: row.status_from,
          statusTo: row.status_to,
          statusNote: row.status_note ?? '',
        }))
      )
    }

    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const updateTarget = (category: TrackedCategory, field: keyof CategoryTarget, value: number) => {
    setTargets(prev => ({ ...prev, [category]: { ...prev[category], [field]: value } }))
    setSaved(false)
  }

  const saveTargets = async () => {
    setTargetsError(null)
    const results = await Promise.all(
      TRACKED_CATEGORIES.map(cat =>
        supabase
          .from('kpi_targets')
          .update({
            open_game_target: targets[cat].openGames,
            private_game_target: targets[cat].privateGames,
          })
          .eq('category', CATEGORY_TO_DB[cat])
      )
    )
    const failed = results.find(r => r.error)
    if (failed?.error) {
      // Most likely cause: this user isn't HOO / doesn't have manage_kpi_targets.
      setTargetsError("You don't have permission to edit global KPI targets — contact HOO.")
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const updatePlayerStatus = async (id: string, updates: Partial<Player>) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))

    const dbUpdate: any = {}
    if (updates.status !== undefined) dbUpdate.status = STATUS_TO_DB[updates.status]
    if (updates.statusFrom !== undefined) dbUpdate.status_from = updates.statusFrom
    if (updates.statusTo !== undefined) dbUpdate.status_to = updates.statusTo
    if (updates.statusNote !== undefined) dbUpdate.status_note = updates.statusNote

    const { error } = await supabase.from('players').update(dbUpdate).eq('id', id)
    if (error) {
      console.error(error)
      // Revert optimistic update on failure (e.g. RLS denied — wrong club)
      load()
    }
  }

  const filteredPlayers = players.filter(p =>
    (filterCategory === 'All' || p.category === filterCategory) &&
    (filterClub === 'All Clubs' || p.club === filterClub)
  )

  const flaggedCount = players.filter(p => p.status !== 'Active').length
  const clubsWithPlayers = ['All Clubs', ...Array.from(new Set(players.map(p => p.club)))]

  if (loading) {
    return <div style={{ minHeight: '100vh', background: T.colors.bg, padding: '32px 36px', color: T.colors.textSecondary }}>Loading...</div>
  }

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

        <div style={{ ...T.card, marginBottom: '24px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Trophy size={16} color={T.colors.textMuted} />
          <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: 0 }}>
            Only Staff and Ambassadors have monthly KPI targets — tracked as open games and private games played, sourced from Playtomic activity. Other categories (VAPC Members, VIP, etc.) are customer benefits and aren't tracked here.
          </p>
        </div>

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
                    <input type="number" min={0} value={targets[cat].openGames} style={T.input}
                      onChange={e => updateTarget(cat, 'openGames', parseInt(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label style={lbl}>Private Games</label>
                    <input type="number" min={0} value={targets[cat].privateGames} style={T.input}
                      onChange={e => updateTarget(cat, 'privateGames', parseInt(e.target.value) || 0)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {targetsError && <p style={{ fontSize: '12px', color: T.colors.red, margin: '12px 0 0' }}>{targetsError}</p>}
          <button onClick={saveTargets} style={{ ...T.btn.primary, marginTop: '16px', padding: '10px 24px' }}>
            {saved ? '✓ Saved' : 'Save Targets'}
          </button>
        </div>

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
            const target = targets[player.category]
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

      </div>
    </div>
  )
}