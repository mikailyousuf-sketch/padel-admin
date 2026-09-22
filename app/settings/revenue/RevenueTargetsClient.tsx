'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { theme } from '../../components/theme'
import { createClient } from '@/lib/supabase/client'

const T = theme

interface RevenueConfig {
  club_id: string
  name: string
  daily_revenue_target: number
  court_rate: number
  venue_hire_rate: number
  royalty_rate: number
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

export default function RevenueTargetsClient() {
  const supabase = createClient()
  const [clubs, setClubs] = useState<RevenueConfig[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set())
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
  .from('revenue_targets')
  .select('club_id, daily_revenue_target, court_rate, venue_hire_rate, royalty_rate, clubs!inner(name, is_active)')
  .eq('clubs.is_active', true)
  .order('clubs(name)')

      if (error) {
        console.error(error)
        setLoading(false)
        return
      }

      setClubs(
        (data ?? []).map((row: any) => ({
          club_id: row.club_id,
          name: row.clubs?.name ?? '',
          daily_revenue_target: row.daily_revenue_target,
          court_rate: row.court_rate,
          venue_hire_rate: row.venue_hire_rate,
          royalty_rate: row.royalty_rate ?? 0.06,
        }))
      )
      setLoading(false)
    }
    load()
  }, [])

  
  const update = (clubId: string, field: keyof RevenueConfig, value: number) => {
    setClubs(prev => prev.map(c => c.club_id === clubId ? { ...c, [field]: value } : c))
    setDirtyIds(prev => new Set(prev).add(clubId))
    setSaved(false)
    setSaveError(null)
  }

  const save = async () => {
    setSaveError(null)
    const updates = clubs.filter(c => dirtyIds.has(c.club_id))
    if (updates.length === 0) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      return
    }

    const results = await Promise.all(
      updates.map(c =>
        supabase
          .from('revenue_targets')
          .update({
            daily_revenue_target: c.daily_revenue_target,
            court_rate: c.court_rate,
            venue_hire_rate: c.venue_hire_rate,
            royalty_rate: c.royalty_rate,
          })
          .eq('club_id', c.club_id)
      )
    )

    const failed = results.find(r => r.error)
    if (failed?.error) {
      console.error(failed.error)
      // This is the fix: a blocked write (e.g. RLS denying someone without
      // manage_finance) used to fail completely silently — the button just
      // did nothing, with no explanation. Now it says so.
      setSaveError(
        failed.error.message.includes('policy') || failed.error.code === '42501'
          ? "You don't have permission to save changes here. Contact Finance or HOO."
          : `Save failed: ${failed.error.message}`
      )
      return
    }

    setDirtyIds(new Set())
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

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
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: T.colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>Revenue &amp; Targets</h1>
          <p style={{ fontSize: '13px', color: T.colors.textSecondary, marginTop: '5px' }}>
            Daily revenue targets, court hire rate and venue exclusivity pricing — used to calculate Reports targets and Quote Generator pricing
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 130px 110px 28px', padding: '0 16px', marginBottom: '8px' }}>
          {['', 'Club', 'Daily Target', 'Court Rate', ''].map((h, i) => (
            <span key={i} style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
          ))}
        </div>

        {clubs.map((club, idx) => {
          const isOpen = expandedId === club.club_id

          return (
            <div key={club.club_id} style={{
              background: T.colors.surface, borderRadius: T.radius.md, marginBottom: '4px',
              overflow: 'hidden', border: `1px solid ${isOpen ? T.colors.red : T.colors.border}`,
              boxShadow: isOpen ? T.shadow.redGlowSm : 'none',
              transition: 'border-color 0.2s ease',
            }}>

              <button onClick={() => setExpandedId(isOpen ? null : club.club_id)} style={{
                width: '100%', padding: '12px 16px',
                display: 'grid', gridTemplateColumns: '32px 1fr 130px 110px 28px',
                alignItems: 'center', background: isOpen ? T.colors.surfaceRaised : 'none',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              }}>
                <span style={{ fontSize: '11px', color: T.colors.textMuted, fontFamily: "'SF Mono', monospace" }}>{String(idx + 1).padStart(2, '0')}</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: T.colors.textPrimary }}>{club.name}</span>
                <span style={{ fontSize: '13px', color: T.colors.textSecondary, fontFamily: "'SF Mono', monospace" }}>R {club.daily_revenue_target.toLocaleString()}</span>
                <span style={{ fontSize: '13px', color: T.colors.textMuted, fontFamily: "'SF Mono', monospace" }}>R{club.court_rate}/hr</span>
                {isOpen ? <ChevronUp size={14} color={T.colors.textMuted} /> : <ChevronDown size={14} color={T.colors.textMuted} />}
              </button>

              {isOpen && (
                <div style={{ padding: '20px 24px', borderTop: `1px solid ${T.colors.border}` }}>

                  <p style={groupTitle}>Revenue Target</p>
                  <div style={{ marginBottom: '24px' }}>
                    <label style={lbl}>Daily Revenue Target (R)</label>
                    <input type="number" value={club.daily_revenue_target} min={0} style={{ ...T.input, maxWidth: '240px' }}
                      onChange={e => update(club.club_id, 'daily_revenue_target', parseInt(e.target.value) || 0)} />
                  </div>

                  <p style={groupTitle}>Quote Generator Rates</p>
                  <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: '-8px 0 16px' }}>
                    Court hire auto-calculates from courts × hours × this rate. Venue hire is a flat fee for full exclusivity, charged on top of court hire.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={lbl}>Court Rate (R / hour)</label>
                      <input type="number" value={club.court_rate} min={0} style={T.input}
                        onChange={e => update(club.club_id, 'court_rate', parseInt(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label style={lbl}>Venue Hire Rate (R, full exclusivity)</label>
                      <input type="number" value={club.venue_hire_rate} min={0} style={T.input}
                        onChange={e => update(club.club_id, 'venue_hire_rate', parseInt(e.target.value) || 0)} />
                    </div>
                  </div>

                  <p style={{ ...groupTitle, marginTop: '24px' }}>Event Royalty</p>
                  <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: '-8px 0 16px' }}>
                    Deducted from event revenue on the Events P&L page and Reports. Snapshotted onto each event when it's created — changing this won't retroactively alter past events.
                  </p>
                  <div>
                    <label style={lbl}>Royalty Rate (%)</label>
                    <input
                      type="number" min={0} max={100} step="0.1"
                      value={Math.round(club.royalty_rate * 1000) / 10}
                      style={{ ...T.input, maxWidth: '160px' }}
                      onChange={e => update(club.club_id, 'royalty_rate', (parseFloat(e.target.value) || 0) / 100)}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {saveError && (
          <div style={{
            marginTop: '16px', padding: '12px 16px', borderRadius: T.radius.md,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <AlertTriangle size={15} color={T.colors.redStatus} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '13px', color: T.colors.textSecondary }}>{saveError}</span>
          </div>
        )}

        <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '48px' }}>
          <button onClick={save} style={{
            ...T.btn.primary, padding: '12px 32px',
            background: saved ? T.colors.green : T.colors.red,
            boxShadow: saved ? '0 0 16px rgba(34,197,94,0.3)' : T.shadow.redGlowSm,
          }}>
            {saved ? '✓ Saved' : 'Save Revenue & Targets'}
          </button>
          {saved && <span style={{ fontSize: '13px', color: T.colors.green }}>All clubs saved</span>}
        </div>
      </div>
    </div>
  )
}