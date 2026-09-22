'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Sun, Moon, Mail, DollarSign, CheckCircle2, AlertTriangle } from 'lucide-react'
import { theme } from '../../components/theme'
import { createClient } from '@/lib/supabase/client'

const T = theme

interface CourtRate {
  courtNumber: number
  peak: number
  offPeak: number
}

interface ExtrasPricing {
  coachHourly: number
  balls: number
  racketRental: number
  venueHireExclusivity: number
}

interface ClubPricing {
  clubId: string
  name: string
  courtRates: CourtRate[]
  extras: ExtrasPricing
  popEmail: string
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

const DEFAULT_EXTRAS: ExtrasPricing = { coachHourly: 600, balls: 169, racketRental: 60, venueHireExclusivity: 750 }
const DEFAULT_POP_EMAIL = 'accounts@virginactivepadelclub.co.za'

export default function QuotePricingClient() {
  const supabase = createClient()
  const [clubs, setClubs] = useState<ClubPricing[]>([])
  const [expandedClub, setExpandedClub] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [dirtyClubIds, setDirtyClubIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('court_pricing')
        .select('club_id, court_number, peak_rate, offpeak_rate, extras, pop_email, clubs(name)')
        .order('court_number')

      if (error) {
        console.error(error)
        setLoadError(true)
        setLoading(false)
        return
      }

      const grouped = new Map<string, ClubPricing>()
      for (const row of (data ?? []) as any[]) {
        const existing = grouped.get(row.club_id)
        const courtRate: CourtRate = {
          courtNumber: row.court_number,
          peak: row.peak_rate,
          offPeak: row.offpeak_rate,
        }
        if (existing) {
          existing.courtRates.push(courtRate)
        } else {
          grouped.set(row.club_id, {
            clubId: row.club_id,
            name: row.clubs?.name ?? '',
            courtRates: [courtRate],
            extras: { ...DEFAULT_EXTRAS, ...(row.extras ?? {}) },
            popEmail: row.pop_email ?? DEFAULT_POP_EMAIL,
          })
        }
      }

      const list = Array.from(grouped.values()).sort((a, b) => a.name.localeCompare(b.name))
      list.forEach(c => c.courtRates.sort((a, b) => a.courtNumber - b.courtNumber))
      setClubs(list)
      setLoading(false)
    }
    load()
  }, [])

  const markDirty = (clubId: string) => {
    setDirtyClubIds(prev => new Set(prev).add(clubId))
    setSaved(false)
    setSaveError(null)
  }

  const updateCourtRate = (clubId: string, courtIdx: number, field: 'peak' | 'offPeak', value: number) => {
    setClubs(prev => prev.map(c => c.clubId !== clubId ? c : {
      ...c,
      courtRates: c.courtRates.map((r, i) => i === courtIdx ? { ...r, [field]: value } : r),
    }))
    markDirty(clubId)
  }

  const updateExtra = (clubId: string, field: keyof ExtrasPricing, value: number) => {
    setClubs(prev => prev.map(c => c.clubId !== clubId ? c : { ...c, extras: { ...c.extras, [field]: value } }))
    markDirty(clubId)
  }

  const updatePopEmail = (clubId: string, value: string) => {
    setClubs(prev => prev.map(c => c.clubId !== clubId ? c : { ...c, popEmail: value }))
    markDirty(clubId)
  }

  const save = async () => {
    setSaveError(null)
    const toSave = clubs.filter(c => dirtyClubIds.has(c.clubId))
    if (toSave.length === 0) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      return
    }

    setSaving(true)

    const upserts = toSave.flatMap(club =>
      club.courtRates.map(rate => ({
        club_id: club.clubId,
        court_number: rate.courtNumber,
        peak_rate: rate.peak,
        offpeak_rate: rate.offPeak,
        extras: club.extras,
        pop_email: club.popEmail,
      }))
    )

    const { error } = await supabase
      .from('court_pricing')
      .upsert(upserts, { onConflict: 'club_id,court_number' })

    setSaving(false)

    if (error) {
      console.error(error)
      // This used to fail completely silently — the button just sat there.
      // Since writes here require manage_finance or HOO, the most likely
      // cause of a failure is exactly that.
      setSaveError(
        error.code === '42501' || error.message.toLowerCase().includes('policy')
          ? "You don't have permission to save pricing changes. Contact Finance or HOO."
          : `Save failed: ${error.message}`
      )
      return
    }

    setDirtyClubIds(new Set())
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const dirtyCount = dirtyClubIds.size

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: T.colors.bg }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '60px 0', justifyContent: 'center' }}>
            <div style={{
              width: '16px', height: '16px', borderRadius: '50%',
              border: `2px solid ${T.colors.border}`, borderTopColor: T.colors.red,
              animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ fontSize: '13px', color: T.colors.textMuted }}>Loading court pricing...</span>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div style={{ minHeight: '100vh', background: T.colors.bg }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 36px' }}>
          <div style={{ ...T.card, padding: '24px', border: `1px solid rgba(224,10,9,0.3)`, textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: T.colors.red, fontWeight: '600', margin: '0 0 6px' }}>Couldn't load court pricing</p>
            <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: 0 }}>Check your connection and refresh the page.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: T.colors.bg }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 36px' }}>

        {/* ── Page header ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.colors.red, boxShadow: T.shadow.redGlowSm }} />
            <span style={{ fontSize: '11px', color: T.colors.red, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Settings</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: T.colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>Court Pricing</h1>
          <p style={{ fontSize: '13px', color: T.colors.textSecondary, marginTop: '5px' }}>
            Per-court peak/off-peak hourly rates, extras pricing and POP email for the Quote Generator
          </p>
        </div>

        {/* ── Explainer ── */}
        <div style={{ ...T.card, marginBottom: '24px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <DollarSign size={16} color={T.colors.textMuted} />
          <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: 0 }}>
            Rates are per hour. The Quote Generator multiplies by hours requested (e.g. 1.5 hrs, 0.5 hrs). Each court can have its own peak and off-peak rate — courts don't need to match each other.
          </p>
        </div>

        {/* ── Table header ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 90px 28px', padding: '0 16px', marginBottom: '8px' }}>
          {['Club', 'Courts', '', ''].map((h, i) => (
            <span key={i} style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
          ))}
        </div>

        {clubs.map(club => {
          const isOpen = expandedClub === club.clubId
          const isDirty = dirtyClubIds.has(club.clubId)

          return (
            <div key={club.clubId} style={{
              background: T.colors.surface, borderRadius: T.radius.md, marginBottom: '4px',
              overflow: 'hidden',
              border: `1px solid ${isOpen ? T.colors.red : isDirty ? 'rgba(245,158,11,0.4)' : T.colors.border}`,
              boxShadow: isOpen ? T.shadow.redGlowSm : isDirty ? '0 0 8px rgba(245,158,11,0.15)' : 'none',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}>

              <button onClick={() => setExpandedClub(isOpen ? null : club.clubId)} style={{
                width: '100%', padding: '12px 16px',
                display: 'grid', gridTemplateColumns: '1fr 100px 90px 28px',
                alignItems: 'center', background: isOpen ? T.colors.surfaceRaised : 'none',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: T.colors.textPrimary }}>{club.name}</span>
                <span style={{ fontSize: '13px', color: T.colors.textSecondary, fontFamily: "'SF Mono', monospace" }}>{club.courtRates.length} courts</span>
                {isDirty ? (
                  <span style={{
                    fontSize: '10px', fontWeight: '600', padding: '3px 9px', borderRadius: '999px',
                    background: T.colors.amberGlow, color: T.colors.amber, border: '1px solid rgba(245,158,11,0.2)',
                    width: 'fit-content',
                  }}>
                    Unsaved
                  </span>
                ) : <span />}
                {isOpen ? <ChevronUp size={14} color={T.colors.textMuted} /> : <ChevronDown size={14} color={T.colors.textMuted} />}
              </button>

              {isOpen && (
                <div style={{ padding: '20px 24px', borderTop: `1px solid ${T.colors.border}` }}>

                  {/* ── Per-court rates ── */}
                  <p style={groupTitle}>Court Hire Rates (R / hour)</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 1fr', gap: '10px', padding: '0 4px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }} />
                    <span style={{ fontSize: '10px', color: T.colors.red, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '5px' }}><Sun size={11} /> Peak</span>
                    <span style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '5px' }}><Moon size={11} /> Off-Peak</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
                    {club.courtRates.map((rate, idx) => (
                      <div key={rate.courtNumber} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 1fr', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary }}>Court {rate.courtNumber}</span>
                        <input type="number" min={0} value={rate.peak} style={T.input}
                          onChange={e => updateCourtRate(club.clubId, idx, 'peak', parseInt(e.target.value) || 0)} />
                        <input type="number" min={0} value={rate.offPeak} style={T.input}
                          onChange={e => updateCourtRate(club.clubId, idx, 'offPeak', parseInt(e.target.value) || 0)} />
                      </div>
                    ))}
                  </div>

                  {/* ── Extras ── */}
                  <p style={groupTitle}>Extras Pricing (R)</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '28px' }}>
                    <div>
                      <label style={lbl}>Coach / Facilitator (per hour)</label>
                      <input type="number" min={0} value={club.extras.coachHourly} style={T.input}
                        onChange={e => updateExtra(club.clubId, 'coachHourly', parseInt(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label style={lbl}>Balls (per set)</label>
                      <input type="number" min={0} value={club.extras.balls} style={T.input}
                        onChange={e => updateExtra(club.clubId, 'balls', parseInt(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label style={lbl}>Racket Rental (each)</label>
                      <input type="number" min={0} value={club.extras.racketRental} style={T.input}
                        onChange={e => updateExtra(club.clubId, 'racketRental', parseInt(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label style={lbl}>Venue Hire Exclusivity</label>
                      <input type="number" min={0} value={club.extras.venueHireExclusivity} style={T.input}
                        onChange={e => updateExtra(club.clubId, 'venueHireExclusivity', parseInt(e.target.value) || 0)} />
                    </div>
                  </div>

                  {/* ── POP email ── */}
                  <p style={groupTitle}>Proof of Payment Email</p>
                  <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: '-8px 0 12px' }}>
                    Where this club's POP confirmations and HO notifications are sent.
                  </p>
                  <div style={{ position: 'relative', maxWidth: '360px' }}>
                    <Mail size={13} color={T.colors.textMuted} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input type="email" value={club.popEmail} style={{ ...T.input, paddingLeft: '34px' }}
                      onChange={e => updatePopEmail(club.clubId, e.target.value)} />
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

        {/* ── Save bar ── */}
        <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '48px' }}>
          <button onClick={save} disabled={saving} style={{
            ...T.btn.primary, padding: '12px 32px',
            background: saved ? T.colors.green : T.colors.red,
            boxShadow: saved ? '0 0 16px rgba(34,197,94,0.3)' : T.shadow.redGlowSm,
            opacity: saving ? 0.6 : 1,
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            {saving ? (
              <>
                <div style={{ width: '13px', height: '13px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />
                Saving...
              </>
            ) : saved ? (
              <><CheckCircle2 size={15} /> Saved</>
            ) : (
              `Save${dirtyCount > 0 ? ` (${dirtyCount} club${dirtyCount > 1 ? 's' : ''})` : ''}`
            )}
          </button>
          {saved && <span style={{ fontSize: '13px', color: T.colors.green }}>Changes saved successfully</span>}
          {!saved && !saving && dirtyCount === 0 && !saveError && <span style={{ fontSize: '13px', color: T.colors.textMuted }}>No unsaved changes</span>}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}