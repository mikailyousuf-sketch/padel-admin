'use client'

import { useState } from 'react'
import { theme } from '../components/theme'

const T = theme

const defaultClubs = [
  { id: 1,  name: 'Ballito',     weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 3, hasPickleball: false, pickleballCourts: 0, dailyTarget: 8500,  peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00', courtRate: 500, venueHireRate: 8000, cafeName: '', cafeEmail: '' },
  { id: 2,  name: 'Bedfordview', weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 3, hasPickleball: false, pickleballCourts: 0, dailyTarget: 8500,  peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00', courtRate: 500, venueHireRate: 8000, cafeName: '', cafeEmail: '' },
  { id: 3,  name: 'Centurion',   weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 4, hasPickleball: false, pickleballCourts: 0, dailyTarget: 11000, peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00', courtRate: 500, venueHireRate: 10000, cafeName: '', cafeEmail: '' },
  { id: 4,  name: 'Durbanville', weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 3, hasPickleball: false, pickleballCourts: 0, dailyTarget: 8500,  peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00', courtRate: 500, venueHireRate: 8000, cafeName: '', cafeEmail: '' },
  { id: 5,  name: 'Epicentre',   weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 5, hasPickleball: false, pickleballCourts: 0, dailyTarget: 14000, peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00', courtRate: 500, venueHireRate: 12000, cafeName: '', cafeEmail: '' },
  { id: 6,  name: 'Gateway',     weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 6, hasPickleball: false, pickleballCourts: 0, dailyTarget: 16500, peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00', courtRate: 500, venueHireRate: 14000, cafeName: '', cafeEmail: '' },
  { id: 7,  name: 'George',      weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 3, hasPickleball: false, pickleballCourts: 0, dailyTarget: 8500,  peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00', courtRate: 500, venueHireRate: 8000, cafeName: '', cafeEmail: '' },
  { id: 8,  name: 'Glen',        weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 3, hasPickleball: true,  pickleballCourts: 3,  dailyTarget: 9500,  peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00', courtRate: 500, venueHireRate: 9000, cafeName: '', cafeEmail: '' },
  { id: 9,  name: 'Groenkloof',  weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 5, hasPickleball: false, pickleballCourts: 0, dailyTarget: 14000, peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00', courtRate: 500, venueHireRate: 12000, cafeName: '', cafeEmail: '' },
  { id: 10, name: 'Huddle',      weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 6, hasPickleball: false, pickleballCourts: 0, dailyTarget: 16500, peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00', courtRate: 500, venueHireRate: 14000, cafeName: '', cafeEmail: '' },
  { id: 11, name: 'Lorraine',    weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 2, hasPickleball: false, pickleballCourts: 0, dailyTarget: 6000,  peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00', courtRate: 500, venueHireRate: 6000, cafeName: '', cafeEmail: '' },
  { id: 12, name: 'Lourensford', weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 4, hasPickleball: true,  pickleballCourts: 2,  dailyTarget: 11500, peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00', courtRate: 500, venueHireRate: 10000, cafeName: '', cafeEmail: '' },
  { id: 13, name: 'Lonehill',    weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 4, hasPickleball: false, pickleballCourts: 0, dailyTarget: 11000, peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00', courtRate: 500, venueHireRate: 10000, cafeName: '', cafeEmail: '' },
  { id: 14, name: 'Old Eds',     weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 4, hasPickleball: false, pickleballCourts: 0, dailyTarget: 11000, peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00', courtRate: 500, venueHireRate: 10000, cafeName: '', cafeEmail: '' },
  { id: 15, name: 'Point',       weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 4, hasPickleball: true,  pickleballCourts: 3,  dailyTarget: 12000, peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00', courtRate: 500, venueHireRate: 11000, cafeName: '', cafeEmail: '' },
  { id: 16, name: 'Randpark',    weekdayOpen: '06:00', weekdayClose: '22:00', weekendOpen: '07:00', weekendClose: '20:00', courts: 4, hasPickleball: false, pickleballCourts: 0, dailyTarget: 11000, peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '22:00', courtRate: 500, venueHireRate: 10000, cafeName: '', cafeEmail: '' },
  { id: 17, name: 'Woodstock',   weekdayOpen: '06:00', weekdayClose: '23:00', weekendOpen: '06:00', weekendClose: '22:00', courts: 3, hasPickleball: false, pickleballCourts: 0, dailyTarget: 10686, peakMorningStart: '06:00', peakMorningEnd: '10:00', peakEveningStart: '15:00', peakEveningEnd: '23:00', courtRate: 500, venueHireRate: 9000, cafeName: '', cafeEmail: '' },
]

type Club = typeof defaultClubs[0]

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
  textTransform: 'uppercase', letterSpacing: '0.07em',
  display: 'block', marginBottom: '7px',
}

const groupTitle = (color = T.colors.textSecondary): React.CSSProperties => ({
  fontSize: '11px', fontWeight: '700', color,
  textTransform: 'uppercase', letterSpacing: '0.08em',
  marginBottom: '16px', paddingBottom: '10px',
  borderBottom: `1px solid ${T.colors.border}`,
})

export default function Settings() {
  const [clubs, setClubs]       = useState<Club[]>(defaultClubs)
  const [saved, setSaved]       = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const update = (id: number, field: string, value: string | number | boolean) => {
    setClubs(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
    setSaved(false)
  }

  const save = () => {
    localStorage.setItem('padel_clubs', JSON.stringify(clubs))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div style={{ minHeight: '100vh', background: T.colors.bg }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 36px' }}>

        {/* ── Page header ── */}
        <div style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.colors.red, boxShadow: T.shadow.redGlowSm }} />
            <span style={{ fontSize: '11px', color: T.colors.red, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Configuration</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: T.colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>Settings</h1>
          <p style={{ fontSize: '13px', color: T.colors.textSecondary, marginTop: '5px' }}>
            Configure operating hours, courts, revenue targets, rates and catering for all 17 clubs
          </p>
        </div>

        {/* ── Club accordion ── */}
        {clubs.map((club, idx) => {
          const isOpen         = expandedId === club.id
          const offPeak        = `${fmt(club.peakMorningEnd)} – ${fmt(club.peakEveningStart)}`
          const wdHrs          = calcHours(club.weekdayOpen, club.weekdayClose)
          const weHrs          = calcHours(club.weekendOpen, club.weekendClose)
          const maxCourtHrs    = wdHrs * club.courts
          const peakMorningHrs = calcHours(club.peakMorningStart, club.peakMorningEnd)
          const peakEveningHrs = calcHours(club.peakEveningStart, club.peakEveningEnd)

          return (
            <div key={club.id} style={{
              background: T.colors.surface,
              borderRadius: T.radius.lg,
              marginBottom: '6px',
              overflow: 'hidden',
              border: `1px solid ${isOpen ? T.colors.red : T.colors.border}`,
              boxShadow: isOpen ? T.shadow.redGlowSm : T.shadow.card,
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}>

              {/* ── Collapsed header ── */}
              <button
                onClick={() => setExpandedId(isOpen ? null : club.id)}
                style={{
                  width: '100%', padding: '14px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: isOpen ? T.colors.surfaceRaised : 'none',
                  border: 'none', cursor: 'pointer',
                  borderBottom: isOpen ? `1px solid ${T.colors.border}` : 'none',
                  fontFamily: 'inherit', transition: 'background 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {/* Club number */}
                  <span style={{
                    fontSize: '11px', fontWeight: '700', color: isOpen ? T.colors.red : T.colors.textMuted,
                    fontFamily: "'SF Mono', monospace", minWidth: '24px',
                  }}>{String(idx + 1).padStart(2, '0')}</span>

                  <span style={{ fontSize: '14px', fontWeight: '700', color: T.colors.textPrimary, minWidth: '100px', textAlign: 'left' }}>{club.name}</span>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <DarkPill label={`${club.courts} courts`} />
                    {club.hasPickleball && <DarkPill label={`${club.pickleballCourts} pickle`} red />}
                    <DarkPill label={`R ${club.dailyTarget.toLocaleString()}`} />
                    <DarkPill label={`R${club.courtRate}/hr`} muted />
                    <DarkPill label={`${fmt(club.weekdayOpen)} – ${fmt(club.weekdayClose)}`} muted />
                    {club.cafeName && <DarkPill label={club.cafeName} />}
                  </div>
                </div>
                <span style={{
                  color: isOpen ? T.colors.red : T.colors.textMuted,
                  fontSize: '16px', display: 'block', flexShrink: 0,
                  transform: isOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease, color 0.15s',
                }}>▾</span>
              </button>

              {/* ── Expanded config ── */}
              {isOpen && (
                <div style={{ padding: '28px 24px' }}>

                  {/* Operating Hours */}
                  <p style={groupTitle()}>Operating Hours</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px', marginBottom: '32px' }}>
                    {[
                      { label: 'Weekday Open',  field: 'weekdayOpen',  val: club.weekdayOpen  },
                      { label: 'Weekday Close', field: 'weekdayClose', val: club.weekdayClose },
                      { label: 'Weekend Open',  field: 'weekendOpen',  val: club.weekendOpen  },
                      { label: 'Weekend Close', field: 'weekendClose', val: club.weekendClose },
                    ].map(f => (
                      <div key={f.field}>
                        <label style={lbl}>{f.label}</label>
                        <input type="time" value={f.val} style={{ ...T.input }} onChange={e => update(club.id, f.field, e.target.value)} />
                      </div>
                    ))}
                  </div>

                  {/* Peak Times */}
                  <p style={groupTitle()}>Peak &amp; Off-Peak Times</p>
                  <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: '-10px 0 16px' }}>
                    Off-peak is derived automatically as the gap between your two peak windows.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    {[
                      { label: 'Morning Start', field: 'peakMorningStart', val: club.peakMorningStart },
                      { label: 'Morning End',   field: 'peakMorningEnd',   val: club.peakMorningEnd   },
                      { label: 'Evening Start', field: 'peakEveningStart', val: club.peakEveningStart },
                      { label: 'Evening End',   field: 'peakEveningEnd',   val: club.peakEveningEnd   },
                    ].map(f => (
                      <div key={f.field}>
                        <label style={lbl}>{f.label}</label>
                        <input type="time" value={f.val} style={{ ...T.input }} onChange={e => update(club.id, f.field, e.target.value)} />
                      </div>
                    ))}
                  </div>

                  {/* Off-peak derived pill */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '10px',
                    background: T.colors.surfaceRaised, border: `1px solid ${T.colors.borderBright}`,
                    borderRadius: T.radius.md, padding: '8px 16px', marginBottom: '32px',
                  }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: T.colors.textMuted }}>Off-Peak (derived)</span>
                    <div style={{ width: '1px', height: '14px', background: T.colors.border }} />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary, fontFamily: "'SF Mono', monospace" }}>{offPeak}</span>
                  </div>

                  {/* Courts & Revenue */}
                  <p style={groupTitle()}>Courts &amp; Revenue</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                    <div>
                      <label style={lbl}>Number of Courts</label>
                      <input type="number" value={club.courts} min={1} max={10} style={{ ...T.input }} onChange={e => update(club.id, 'courts', parseInt(e.target.value))} />
                    </div>
                    <div>
                      <label style={lbl}>Daily Revenue Target (R)</label>
                      <input type="number" value={club.dailyTarget} style={{ ...T.input }} onChange={e => update(club.id, 'dailyTarget', parseInt(e.target.value))} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={lbl}>Pickleball Courts</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                          onClick={() => update(club.id, 'hasPickleball', !club.hasPickleball)}
                          style={{
                            padding: '9px 22px', borderRadius: T.radius.sm,
                            border: `1px solid ${club.hasPickleball ? T.colors.red : T.colors.border}`,
                            background: club.hasPickleball ? T.colors.redGlow : T.colors.surfaceRaised,
                            color: club.hasPickleball ? T.colors.red : T.colors.textSecondary,
                            fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
                            transition: 'all 0.15s ease',
                            boxShadow: club.hasPickleball ? T.shadow.redGlowSm : 'none',
                          }}
                        >{club.hasPickleball ? 'Enabled' : 'Disabled'}</button>
                        {club.hasPickleball && (
                          <input type="number" value={club.pickleballCourts} min={1} max={10}
                            placeholder="No. of pickleball courts"
                            onChange={e => update(club.id, 'pickleballCourts', parseInt(e.target.value))}
                            style={{ ...T.input, width: '200px' }} />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quote Generator Rates — NEW */}
                  <p style={groupTitle()}>Quote Generator Rates</p>
                  <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: '-10px 0 16px' }}>
                    Used to auto-calculate court hire and venue exclusivity pricing in the Quote Generator.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '32px' }}>
                    <div>
                      <label style={lbl}>Court Rate (R / hour)</label>
                      <input type="number" value={club.courtRate} min={0} style={{ ...T.input }} onChange={e => update(club.id, 'courtRate', parseInt(e.target.value))} />
                    </div>
                    <div>
                      <label style={lbl}>Venue Hire Rate (R, full exclusivity)</label>
                      <input type="number" value={club.venueHireRate} min={0} style={{ ...T.input }} onChange={e => update(club.id, 'venueHireRate', parseInt(e.target.value))} />
                    </div>
                  </div>

                  {/* Catering Partner — NEW */}
                  <p style={groupTitle()}>Catering Partner</p>
                  <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: '-10px 0 16px' }}>
                    The club doesn't handle catering directly. If this club has an on-site cafe, their details will be referenced and CC'd on quotes that include catering.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '32px' }}>
                    <div>
                      <label style={lbl}>Cafe / Caterer Name (optional)</label>
                      <input value={club.cafeName} placeholder="e.g. Bean There Cafe" style={{ ...T.input }} onChange={e => update(club.id, 'cafeName', e.target.value)} />
                    </div>
                    <div>
                      <label style={lbl}>Cafe Contact Email (optional)</label>
                      <input type="email" value={club.cafeEmail} placeholder="cafe@email.com" style={{ ...T.input }} onChange={e => update(club.id, 'cafeEmail', e.target.value)} />
                    </div>
                  </div>

                  {/* Calculated values */}
                  <div style={{ padding: '18px 20px', background: T.colors.bg, borderRadius: T.radius.md, border: `1px solid ${T.colors.border}` }}>
                    <p style={{ fontSize: '10px', fontWeight: '700', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>Calculated Values</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      {[
                        { label: 'Weekday Hours',      value: `${wdHrs} hrs`,           highlight: false },
                        { label: 'Weekend Hours',       value: `${weHrs} hrs`,           highlight: false },
                        { label: 'Max Court Hrs / Day', value: `${maxCourtHrs} hrs`,     highlight: false },
                        { label: 'Peak Morning',        value: `${peakMorningHrs} hrs`,  highlight: false },
                        { label: 'Peak Evening',        value: `${peakEveningHrs} hrs`,  highlight: false },
                        { label: 'Daily Target',        value: `R ${club.dailyTarget.toLocaleString()}`, highlight: true },
                      ].map(item => (
                        <div key={item.label} style={{
                          background: item.highlight ? T.colors.redGlow : T.colors.surfaceRaised,
                          border: `1px solid ${item.highlight ? 'rgba(224,10,9,0.2)' : T.colors.border}`,
                          borderRadius: T.radius.md, padding: '12px 14px',
                        }}>
                          <p style={{ fontSize: '10px', color: T.colors.textMuted, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
                          <p style={{
                            fontSize: '16px', fontWeight: '700', margin: 0,
                            color: item.highlight ? T.colors.red : T.colors.textPrimary,
                            fontFamily: "'SF Mono', monospace",
                            textShadow: item.highlight ? T.shadow.redGlowSm : 'none',
                          }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )
        })}

        {/* ── Save button ── */}
        <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '48px' }}>
          <button onClick={save} style={{
            ...T.btn.primary,
            padding: '12px 36px',
            fontSize: '14px',
            background: saved ? T.colors.green : T.colors.red,
            boxShadow: saved ? '0 0 16px rgba(34,197,94,0.3)' : T.shadow.redGlowSm,
            transition: 'background 0.2s ease, box-shadow 0.2s ease',
          }}>
            {saved ? '✓ Saved' : 'Save All Settings'}
          </button>
          {saved && (
            <span style={{ fontSize: '13px', color: T.colors.green, display: 'flex', alignItems: 'center', gap: '6px', textShadow: '0 0 8px rgba(34,197,94,0.3)' }}>
              All 17 clubs saved successfully
            </span>
          )}
        </div>

      </div>
    </div>
  )
}

// ── Dark pill component ────────────────────────────────────────────────────────
function DarkPill({ label, red, muted }: { label: string; red?: boolean; muted?: boolean }) {
  return (
    <span style={{
      fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: '999px',
      background: red ? T.colors.redGlow : T.colors.surfaceRaised,
      color: red ? T.colors.red : muted ? T.colors.textMuted : T.colors.textSecondary,
      border: `1px solid ${red ? 'rgba(224,10,9,0.2)' : T.colors.border}`,
      fontFamily: muted ? "'SF Mono', monospace" : 'inherit',
    }}>
      {label}
    </span>
  )
}