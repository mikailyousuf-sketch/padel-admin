'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Coffee } from 'lucide-react'
import { theme } from '../../components/theme'

const T = theme

const defaultClubs = [
  { id: 1,  name: 'Ballito',     cafeName: '', cafeEmail: '', cafePhone: '' },
  { id: 2,  name: 'Bedfordview', cafeName: '', cafeEmail: '', cafePhone: '' },
  { id: 3,  name: 'Centurion',   cafeName: '', cafeEmail: '', cafePhone: '' },
  { id: 4,  name: 'Durbanville', cafeName: '', cafeEmail: '', cafePhone: '' },
  { id: 5,  name: 'Epicentre',   cafeName: '', cafeEmail: '', cafePhone: '' },
  { id: 6,  name: 'Gateway',     cafeName: '', cafeEmail: '', cafePhone: '' },
  { id: 7,  name: 'George',      cafeName: '', cafeEmail: '', cafePhone: '' },
  { id: 8,  name: 'Glen',        cafeName: '', cafeEmail: '', cafePhone: '' },
  { id: 9,  name: 'Groenkloof',  cafeName: '', cafeEmail: '', cafePhone: '' },
  { id: 10, name: 'Huddle',      cafeName: '', cafeEmail: '', cafePhone: '' },
  { id: 11, name: 'Lorraine',    cafeName: '', cafeEmail: '', cafePhone: '' },
  { id: 12, name: 'Lourensford', cafeName: '', cafeEmail: '', cafePhone: '' },
  { id: 13, name: 'Lonehill',    cafeName: '', cafeEmail: '', cafePhone: '' },
  { id: 14, name: 'Old Eds',     cafeName: '', cafeEmail: '', cafePhone: '' },
  { id: 15, name: 'Point',       cafeName: '', cafeEmail: '', cafePhone: '' },
  { id: 16, name: 'Randpark',    cafeName: '', cafeEmail: '', cafePhone: '' },
  { id: 17, name: 'Woodstock',   cafeName: '', cafeEmail: '', cafePhone: '' },
]

type CateringConfig = typeof defaultClubs[0]

const lbl: React.CSSProperties = {
  fontSize: '11px', fontWeight: '600', color: T.colors.textSecondary,
  textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '7px',
}
const groupTitle: React.CSSProperties = {
  fontSize: '11px', fontWeight: '700', color: T.colors.textMuted,
  textTransform: 'uppercase', letterSpacing: '0.08em',
  marginBottom: '14px', paddingBottom: '8px', borderBottom: `1px solid ${T.colors.border}`,
}

// Local storage key — namespaced separately. The Quote Generator reads cafeName/cafeEmail
// from this key when a quote includes catering, to reference + CC the cafe automatically.
const STORAGE_KEY = 'padel_catering_config'

export default function CateringPartnersPage() {
  const [clubs, setClubs] = useState<CateringConfig[]>(defaultClubs)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setClubs(JSON.parse(stored))
  }, [])

  const update = (id: number, field: string, value: string) => {
    setClubs(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
    setSaved(false)
  }

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clubs))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const configuredCount = clubs.filter(c => c.cafeName).length

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
            {configuredCount} of 17 clubs have an on-site cafe configured
          </p>
        </div>

        {/* ── Explainer ── */}
        <div style={{ ...T.card, marginBottom: '20px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Coffee size={16} color={T.colors.textMuted} />
          <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: 0 }}>
            Clubs don't handle catering directly — it goes through each club's own on-site cafe. If configured here, the cafe's details are referenced on any quote that includes catering, and their email is automatically CC'd.
          </p>
        </div>

        {/* ── Table header ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr 28px', padding: '0 16px', marginBottom: '8px' }}>
          {['', 'Club', 'Cafe Partner', ''].map((h, i) => (
            <span key={i} style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
          ))}
        </div>

        {clubs.map((club, idx) => {
          const isOpen = expandedId === club.id
          const hasCafe = !!club.cafeName

          return (
            <div key={club.id} style={{
              background: T.colors.surface, borderRadius: T.radius.md, marginBottom: '4px',
              overflow: 'hidden', border: `1px solid ${isOpen ? T.colors.red : T.colors.border}`,
              boxShadow: isOpen ? T.shadow.redGlowSm : 'none',
              transition: 'border-color 0.2s ease',
            }}>

              <button onClick={() => setExpandedId(isOpen ? null : club.id)} style={{
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
                    {club.cafeName}
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
                      <input value={club.cafeName} placeholder="e.g. Bean There Cafe" style={T.input}
                        onChange={e => update(club.id, 'cafeName', e.target.value)} />
                    </div>
                    <div>
                      <label style={lbl}>Contact Email</label>
                      <input type="email" value={club.cafeEmail} placeholder="cafe@email.com" style={T.input}
                        onChange={e => update(club.id, 'cafeEmail', e.target.value)} />
                    </div>
                    <div>
                      <label style={lbl}>Contact Phone</label>
                      <input value={club.cafePhone} placeholder="082 000 0000" style={T.input}
                        onChange={e => update(club.id, 'cafePhone', e.target.value)} />
                    </div>
                  </div>
                  {!club.cafeName && (
                    <p style={{ fontSize: '11px', color: T.colors.textMuted, margin: '14px 0 0', fontStyle: 'italic' }}>
                      Leave blank if this club has no on-site catering partner. Quotes for this club won't show a catering reference.
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}

        <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '48px' }}>
          <button onClick={save} style={{
            ...T.btn.primary, padding: '12px 32px',
            background: saved ? T.colors.green : T.colors.red,
            boxShadow: saved ? '0 0 16px rgba(34,197,94,0.3)' : T.shadow.redGlowSm,
          }}>
            {saved ? '✓ Saved' : 'Save Catering Partners'}
          </button>
          {saved && <span style={{ fontSize: '13px', color: T.colors.green }}>All 17 clubs saved</span>}
        </div>
      </div>
    </div>
  )
}