'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { theme } from '../../components/theme'

const T = theme

const defaultClubs = [
  { id: 1,  name: 'Ballito',     weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 3, hasPickleball: false, pickleballCourts: 0, peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00' },
  { id: 2,  name: 'Bedfordview', weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 3, hasPickleball: false, pickleballCourts: 0, peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00' },
  { id: 3,  name: 'Centurion',   weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 4, hasPickleball: false, pickleballCourts: 0, peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00' },
  { id: 4,  name: 'Durbanville', weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 3, hasPickleball: false, pickleballCourts: 0, peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00' },
  { id: 5,  name: 'Epicentre',   weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 5, hasPickleball: false, pickleballCourts: 0, peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00' },
  { id: 6,  name: 'Gateway',     weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 6, hasPickleball: false, pickleballCourts: 0, peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00' },
  { id: 7,  name: 'George',      weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 3, hasPickleball: false, pickleballCourts: 0, peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00' },
  { id: 8,  name: 'Glen',        weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 3, hasPickleball: true,  pickleballCourts: 3,  peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00' },
  { id: 9,  name: 'Groenkloof',  weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 5, hasPickleball: false, pickleballCourts: 0, peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00' },
  { id: 10, name: 'Huddle',      weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 6, hasPickleball: false, pickleballCourts: 0, peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00' },
  { id: 11, name: 'Lorraine',    weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 2, hasPickleball: false, pickleballCourts: 0, peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00' },
  { id: 12, name: 'Lourensford', weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 4, hasPickleball: true,  pickleballCourts: 2,  peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00' },
  { id: 13, name: 'Lonehill',    weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 4, hasPickleball: false, pickleballCourts: 0, peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00' },
  { id: 14, name: 'Old Eds',     weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 4, hasPickleball: false, pickleballCourts: 0, peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00' },
  { id: 15, name: 'Point',       weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 4, hasPickleball: true,  pickleballCourts: 3,  peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00' },
  { id: 16, name: 'Randpark',    weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 4, hasPickleball: false, pickleballCourts: 0, peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00' },
  { id: 17, name: 'Woodstock',   weekdayOpen: '06:00', weekdayClose: '23:00', weekendOpen: '06:00', weekendClose: '22:00', courts: 3, hasPickleball: false, pickleballCourts: 0, peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '23:00' },
]

type ClubConfig = typeof defaultClubs[0]

function calcHours(open: string, close: string) {
  const [oh, om] = open.split(':').map(Number)
  const [ch, cm] = close.split(':').map(Number)
  return ((ch * 60 + cm) - (oh * 60 + om)) / 60
}
function fmt(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const hour = h % 12 || 12
  return `${hour}${m > 0 ? `:${String(m).padStart(2, '0')}` : ''}${ampm}`
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

// Local storage key — namespaced so each settings sub-page only touches its own slice,
// merged together when loaded by other pages that need cross-cutting data
const STORAGE_KEY = 'padel_club_config'

export default function ClubConfigurationPage() {
  const [clubs, setClubs] = useState<ClubConfig[]>(defaultClubs)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setClubs(JSON.parse(stored))
  }, [])

  const update = (id: number, field: string, value: string | number | boolean) => {
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
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: T.colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>Club Configuration</h1>
          <p style={{ fontSize: '13px', color: T.colors.textSecondary, marginTop: '5px' }}>
            Operating hours, court counts and peak times for all 17 clubs
          </p>
        </div>

        {/* ── Table header ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 100px 140px 28px', padding: '0 16px', marginBottom: '8px' }}>
          {['', 'Club', 'Courts', 'Hours', ''].map((h, i) => (
            <span key={i} style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
          ))}
        </div>

        {clubs.map((club, idx) => {
          const isOpen = expandedId === club.id
          const offPeak = `${fmt(club.peakMorningEnd)} – ${fmt(club.peakEveningStart)}`

          return (
            <div key={club.id} style={{
              background: T.colors.surface, borderRadius: T.radius.md, marginBottom: '4px',
              overflow: 'hidden', border: `1px solid ${isOpen ? T.colors.red : T.colors.border}`,
              boxShadow: isOpen ? T.shadow.redGlowSm : 'none',
              transition: 'border-color 0.2s ease',
            }}>

              <button onClick={() => setExpandedId(isOpen ? null : club.id)} style={{
                width: '100%', padding: '12px 16px',
                display: 'grid', gridTemplateColumns: '32px 1fr 100px 140px 28px',
                alignItems: 'center', background: isOpen ? T.colors.surfaceRaised : 'none',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              }}>
                <span style={{ fontSize: '11px', color: T.colors.textMuted, fontFamily: "'SF Mono', monospace" }}>{String(idx + 1).padStart(2, '0')}</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: T.colors.textPrimary }}>{club.name}</span>
                <span style={{ fontSize: '13px', color: T.colors.textSecondary, fontFamily: "'SF Mono', monospace" }}>
                  {club.courts}{club.hasPickleball ? ` +${club.pickleballCourts}p` : ''}
                </span>
                <span style={{ fontSize: '12px', color: T.colors.textMuted, fontFamily: "'SF Mono', monospace" }}>{fmt(club.weekdayOpen)}–{fmt(club.weekdayClose)}</span>
                {isOpen ? <ChevronUp size={14} color={T.colors.textMuted} /> : <ChevronDown size={14} color={T.colors.textMuted} />}
              </button>

              {isOpen && (
                <div style={{ padding: '20px 24px', borderTop: `1px solid ${T.colors.border}` }}>

                  <p style={groupTitle}>Operating Hours</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                    {[
                      { label: 'Weekday Open',  field: 'weekdayOpen',  val: club.weekdayOpen  },
                      { label: 'Weekday Close', field: 'weekdayClose', val: club.weekdayClose },
                      { label: 'Weekend Open',  field: 'weekendOpen',  val: club.weekendOpen  },
                      { label: 'Weekend Close', field: 'weekendClose', val: club.weekendClose },
                    ].map(f => (
                      <div key={f.field}>
                        <label style={lbl}>{f.label}</label>
                        <input type="time" value={f.val} style={T.input} onChange={e => update(club.id, f.field, e.target.value)} />
                      </div>
                    ))}
                  </div>

                  <p style={groupTitle}>Peak &amp; Off-Peak Times</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px', marginBottom: '12px' }}>
                    {[
                      { label: 'Morning Start', field: 'peakMorningStart', val: club.peakMorningStart },
                      { label: 'Morning End',   field: 'peakMorningEnd',   val: club.peakMorningEnd   },
                      { label: 'Evening Start', field: 'peakEveningStart', val: club.peakEveningStart },
                      { label: 'Evening End',   field: 'peakEveningEnd',   val: club.peakEveningEnd   },
                    ].map(f => (
                      <div key={f.field}>
                        <label style={lbl}>{f.label}</label>
                        <input type="time" value={f.val} style={T.input} onChange={e => update(club.id, f.field, e.target.value)} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: T.colors.surfaceRaised, border: `1px solid ${T.colors.borderBright}`, borderRadius: T.radius.md, padding: '8px 16px', marginBottom: '24px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: T.colors.textMuted }}>Off-Peak (derived)</span>
                    <div style={{ width: '1px', height: '14px', background: T.colors.border }} />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary, fontFamily: "'SF Mono', monospace" }}>{offPeak}</span>
                  </div>

                  <p style={groupTitle}>Courts</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={lbl}>Number of Courts</label>
                      <input type="number" value={club.courts} min={1} max={10} style={T.input} onChange={e => update(club.id, 'courts', parseInt(e.target.value))} />
                    </div>
                    <div>
                      <label style={lbl}>Pickleball</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button onClick={() => update(club.id, 'hasPickleball', !club.hasPickleball)} style={{
                          padding: '9px 18px', borderRadius: T.radius.sm,
                          border: `1px solid ${club.hasPickleball ? T.colors.red : T.colors.border}`,
                          background: club.hasPickleball ? T.colors.redGlow : T.colors.surfaceRaised,
                          color: club.hasPickleball ? T.colors.red : T.colors.textSecondary,
                          fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
                        }}>{club.hasPickleball ? 'Enabled' : 'Disabled'}</button>
                        {club.hasPickleball && (
                          <input type="number" value={club.pickleballCourts} min={1} max={10}
                            onChange={e => update(club.id, 'pickleballCourts', parseInt(e.target.value))}
                            style={{ ...T.input, width: '100px' }} />
                        )}
                      </div>
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
            {saved ? '✓ Saved' : 'Save Club Configuration'}
          </button>
          {saved && <span style={{ fontSize: '13px', color: T.colors.green }}>All 17 clubs saved</span>}
        </div>
      </div>
    </div>
  )
}