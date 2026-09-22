'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Coffee, AlertTriangle } from 'lucide-react'
import { theme } from '../../components/theme'
import { createClient } from '@/lib/supabase/client'

const T = theme

interface CateringConfig {
  club_id: string
  name: string
  cafe_name: string
  cafe_email: string
  cafe_phone: string
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

export default function CateringPartnersPage() {
  const supabase = createClient()
  const [clubs, setClubs] = useState<CateringConfig[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set())
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('catering_partners')
        .select('club_id, name, email, phone, clubs!inner(name, is_active)')
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
          cafe_name: row.name ?? '',
          cafe_email: row.email ?? '',
          cafe_phone: row.phone ?? '',
        }))
      )
      setLoading(false)
    }
    load()
  }, [])

  const update = (clubId: string, field: keyof CateringConfig, value: string) => {
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
          .from('catering_partners')
          .update({
            name: c.cafe_name,
            email: c.cafe_email,
            phone: c.cafe_phone,
          })
          .eq('club_id', c.club_id)
      )
    )

    const failed = results.find(r => r.error)
    if (failed?.error) {
      console.error(failed.error)
      // Writes here are scoped to has_club_access — a blocked save almost
      // always means you're trying to edit a club that isn't yours.
      setSaveError(
        failed.error.code === '42501' || failed.error.message.toLowerCase().includes('policy')
          ? "You can only edit catering details for your own club."
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

  const configuredCount = clubs.filter(c => c.cafe_name).length

  return (
    <div style={{ minHeight: '100vh', background: T.colors.bg }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 36px' }}>

        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.colors.red, boxShadow: T.shadow.redGlowSm }} />
            <span style={{ fontSize: '11px', color: T.colors.red, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Settings</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: T.colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>Catering Partners</h1>
          <p style={{ fontSize: '13px', color: T.colors.textSecondary, marginTop: '5px' }}>
            {configuredCount} of {clubs.length} clubs have an on-site cafe configured
          </p>
        </div>

        <div style={{ ...T.card, marginBottom: '20px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Coffee size={16} color={T.colors.textMuted} />
          <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: 0 }}>
            Clubs don't handle catering directly — it goes through each club's own on-site cafe. If configured here, the cafe's details are referenced on any quote that includes catering, and their email is automatically CC'd.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr 28px', padding: '0 16px', marginBottom: '8px' }}>
          {['', 'Club', 'Cafe Partner', ''].map((h, i) => (
            <span key={i} style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
          ))}
        </div>

        {clubs.map((club, idx) => {
          const isOpen = expandedId === club.club_id
          const hasCafe = !!club.cafe_name

          return (
            <div key={club.club_id} style={{
              background: T.colors.surface, borderRadius: T.radius.md, marginBottom: '4px',
              overflow: 'hidden', border: `1px solid ${isOpen ? T.colors.red : T.colors.border}`,
              boxShadow: isOpen ? T.shadow.redGlowSm : 'none',
              transition: 'border-color 0.2s ease',
            }}>

              <button onClick={() => setExpandedId(isOpen ? null : club.club_id)} style={{
                width: '100%', padding: '12px 16px',
                display: 'grid', gridTemplateColumns: '32px 1fr 1fr 28px',
                alignItems: 'center', background: isOpen ? T.colors.surfaceRaised : 'none',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              }}>
                <span style={{ fontSize: '11px', color: T.colors.textMuted, fontFamily: "'SF Mono', monospace" }}>{String(idx + 1).padStart(2, '0')}</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: T.colors.textPrimary }}>{club.name}</span>
                {hasCafe ? (
                  <span style={{
                    fontSize: '12px', fontWeight: '500', color: T.colors.textSecondary,
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.colors.green, flexShrink: 0 }} />
                    {club.cafe_name}
                  </span>
                ) : (
                  <span style={{ fontSize: '12px', color: T.colors.textMuted, fontStyle: 'italic' }}>Not configured</span>
                )}
                {isOpen ? <ChevronUp size={14} color={T.colors.textMuted} /> : <ChevronDown size={14} color={T.colors.textMuted} />}
              </button>

              {isOpen && (
                <div style={{ padding: '20px 24px', borderTop: `1px solid ${T.colors.border}` }}>
                  <p style={groupTitle}>On-Site Cafe / Catering Partner</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={lbl}>Cafe / Caterer Name</label>
                      <input value={club.cafe_name} placeholder="e.g. Bean There Cafe" style={T.input}
                        onChange={e => update(club.club_id, 'cafe_name', e.target.value)} />
                    </div>
                    <div>
                      <label style={lbl}>Contact Email</label>
                      <input type="email" value={club.cafe_email} placeholder="cafe@email.com" style={T.input}
                        onChange={e => update(club.club_id, 'cafe_email', e.target.value)} />
                    </div>
                    <div>
                      <label style={lbl}>Contact Phone</label>
                      <input value={club.cafe_phone} placeholder="082 000 0000" style={T.input}
                        onChange={e => update(club.club_id, 'cafe_phone', e.target.value)} />
                    </div>
                  </div>
                  {!club.cafe_name && (
                    <p style={{ fontSize: '11px', color: T.colors.textMuted, margin: '14px 0 0', fontStyle: 'italic' }}>
                      Leave blank if this club has no on-site catering partner. Quotes for this club won't show a catering reference.
                    </p>
                  )}
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
            {saved ? '✓ Saved' : 'Save Catering Partners'}
          </button>
          {saved && <span style={{ fontSize: '13px', color: T.colors.green }}>All clubs saved</span>}
        </div>
      </div>
    </div>
  )
}