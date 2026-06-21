'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { theme } from '../../components/theme'

const T = theme

const defaultClubs = [
  { id: 1,  name: 'Ballito',     dailyTarget: 8500,  courtRate: 500, venueHireRate: 8000  },
  { id: 2,  name: 'Bedfordview', dailyTarget: 8500,  courtRate: 500, venueHireRate: 8000  },
  { id: 3,  name: 'Centurion',   dailyTarget: 11000, courtRate: 500, venueHireRate: 10000 },
  { id: 4,  name: 'Durbanville', dailyTarget: 8500,  courtRate: 500, venueHireRate: 8000  },
  { id: 5,  name: 'Epicentre',   dailyTarget: 14000, courtRate: 500, venueHireRate: 12000 },
  { id: 6,  name: 'Gateway',     dailyTarget: 16500, courtRate: 500, venueHireRate: 14000 },
  { id: 7,  name: 'George',      dailyTarget: 8500,  courtRate: 500, venueHireRate: 8000  },
  { id: 8,  name: 'Glen',        dailyTarget: 9500,  courtRate: 500, venueHireRate: 9000  },
  { id: 9,  name: 'Groenkloof',  dailyTarget: 14000, courtRate: 500, venueHireRate: 12000 },
  { id: 10, name: 'Huddle',      dailyTarget: 16500, courtRate: 500, venueHireRate: 14000 },
  { id: 11, name: 'Lorraine',    dailyTarget: 6000,  courtRate: 500, venueHireRate: 6000  },
  { id: 12, name: 'Lourensford', dailyTarget: 11500, courtRate: 500, venueHireRate: 10000 },
  { id: 13, name: 'Lonehill',    dailyTarget: 11000, courtRate: 500, venueHireRate: 10000 },
  { id: 14, name: 'Old Eds',     dailyTarget: 11000, courtRate: 500, venueHireRate: 10000 },
  { id: 15, name: 'Point',       dailyTarget: 12000, courtRate: 500, venueHireRate: 11000 },
  { id: 16, name: 'Randpark',    dailyTarget: 11000, courtRate: 500, venueHireRate: 10000 },
  { id: 17, name: 'Woodstock',   dailyTarget: 10686, courtRate: 500, venueHireRate: 9000  },
]

type RevenueConfig = typeof defaultClubs[0]

const lbl: React.CSSProperties = {
  fontSize: '11px', fontWeight: '600', color: T.colors.textSecondary,
  textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '7px',
}
const groupTitle: React.CSSProperties = {
  fontSize: '11px', fontWeight: '700', color: T.colors.textMuted,
  textTransform: 'uppercase', letterSpacing: '0.08em',
  marginBottom: '14px', paddingBottom: '8px', borderBottom: `1px solid ${T.colors.border}`,
}

// Local storage key — namespaced separately from club config / catering / KPIs.
// The Quote Generator reads courtRate and venueHireRate from this key.
const STORAGE_KEY = 'padel_revenue_config'

export default function RevenueTargetsPage() {
  const [clubs, setClubs] = useState<RevenueConfig[]>(defaultClubs)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setClubs(JSON.parse(stored))
  }, [])

  const update = (id: number, field: string, value: number) => {
    setClubs(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
    setSaved(false)
  }

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clubs))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
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

        {/* ── Table header ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 130px 110px 28px', padding: '0 16px', marginBottom: '8px' }}>
          {['', 'Club', 'Daily Target', 'Court Rate', ''].map((h, i) => (
            <span key={i} style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
          ))}
        </div>

        {clubs.map((club, idx) => {
          const isOpen = expandedId === club.id

          return (
            <div key={club.id} style={{
              background: T.colors.surface, borderRadius: T.radius.md, marginBottom: '4px',
              overflow: 'hidden', border: `1px solid ${isOpen ? T.colors.red : T.colors.border}`,
              boxShadow: isOpen ? T.shadow.redGlowSm : 'none',
              transition: 'border-color 0.2s ease',
            }}>

              <button onClick={() => setExpandedId(isOpen ? null : club.id)} style={{
                width: '100%', padding: '12px 16px',
                display: 'grid', gridTemplateColumns: '32px 1fr 130px 110px 28px',
                alignItems: 'center', background: isOpen ? T.colors.surfaceRaised : 'none',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              }}>
                <span style={{ fontSize: '11px', color: T.colors.textMuted, fontFamily: "'SF Mono', monospace" }}>{String(idx + 1).padStart(2, '0')}</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: T.colors.textPrimary }}>{club.name}</span>
                <span style={{ fontSize: '13px', color: T.colors.textSecondary, fontFamily: "'SF Mono', monospace" }}>R {club.dailyTarget.toLocaleString()}</span>
                <span style={{ fontSize: '13px', color: T.colors.textMuted, fontFamily: "'SF Mono', monospace" }}>R{club.courtRate}/hr</span>
                {isOpen ? <ChevronUp size={14} color={T.colors.textMuted} /> : <ChevronDown size={14} color={T.colors.textMuted} />}
              </button>

              {isOpen && (
                <div style={{ padding: '20px 24px', borderTop: `1px solid ${T.colors.border}` }}>

                  <p style={groupTitle}>Revenue Target</p>
                  <div style={{ marginBottom: '24px' }}>
                    <label style={lbl}>Daily Revenue Target (R)</label>
                    <input type="number" value={club.dailyTarget} min={0} style={{ ...T.input, maxWidth: '240px' }}
                      onChange={e => update(club.id, 'dailyTarget', parseInt(e.target.value) || 0)} />
                  </div>

                  <p style={groupTitle}>Quote Generator Rates</p>
                  <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: '-8px 0 16px' }}>
                    Court hire auto-calculates from courts × hours × this rate. Venue hire is a flat fee for full exclusivity, charged on top of court hire.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={lbl}>Court Rate (R / hour)</label>
                      <input type="number" value={club.courtRate} min={0} style={T.input}
                        onChange={e => update(club.id, 'courtRate', parseInt(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label style={lbl}>Venue Hire Rate (R, full exclusivity)</label>
                      <input type="number" value={club.venueHireRate} min={0} style={T.input}
                        onChange={e => update(club.id, 'venueHireRate', parseInt(e.target.value) || 0)} />
                    </div>
                  </div>
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
            {saved ? '✓ Saved' : 'Save Revenue & Targets'}
          </button>
          {saved && <span style={{ fontSize: '13px', color: T.colors.green }}>All 17 clubs saved</span>}
        </div>
      </div>
    </div>
  )
}