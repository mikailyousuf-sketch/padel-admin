'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { theme } from '../../components/theme'
import { listClubsWithConfig, addClub, updateClubConfig, setClubActive } from './actions'

const T = theme

interface ClubConfig {
  club_id: string
  name: string
  weekday_open: string
  weekday_close: string
  weekend_open: string
  weekend_close: string
  peak_morning_start: string
  peak_morning_end: string
  peak_evening_start: string
  peak_evening_end: string
  court_count: number
  pickleball_court_count: number
  is_active: boolean
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

export default function ClubConfigurationPage() {
  const [clubs, setClubs] = useState<ClubConfig[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddClub, setShowAddClub] = useState(false)

  async function reload() {
    const data = await listClubsWithConfig()
    setClubs(
      (data ?? []).map((row: any) => ({
        club_id: row.club_id,
        name: row.clubs?.name ?? '',
        weekday_open: row.weekday_open,
        weekday_close: row.weekday_close,
        weekend_open: row.weekend_open,
        weekend_close: row.weekend_close,
        peak_morning_start: row.peak_morning_start,
        peak_morning_end: row.peak_morning_end,
        peak_evening_start: row.peak_evening_start,
        peak_evening_end: row.peak_evening_end,
        court_count: row.court_count,
        pickleball_court_count: row.pickleball_court_count,
        is_active: row.clubs?.is_active ?? true,
      }))
    )
    setLoading(false)
  }

  useEffect(() => { reload() }, [])

  async function handleSaveClub(clubId: string, formData: FormData) {
    formData.set('clubId', clubId)
    await updateClubConfig(formData)
    await reload()
    setSavedId(clubId)
    setTimeout(() => setSavedId(null), 2500)
  }

  async function handleToggleActive(clubId: string, currentlyActive: boolean) {
    await setClubActive(clubId, !currentlyActive)
    await reload()
  }

  async function handleAddClub(formData: FormData) {
    await addClub(formData)
    await reload()
    setShowAddClub(false)
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', background: T.colors.bg, padding: '32px 36px', color: T.colors.textSecondary }}>Loading...</div>
  }

  return (
    <div style={{ minHeight: '100vh', background: T.colors.bg }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 36px' }}>

        <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.colors.red, boxShadow: T.shadow.redGlowSm }} />
              <span style={{ fontSize: '11px', color: T.colors.red, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Settings</span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: T.colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>Club Configuration</h1>
            <p style={{ fontSize: '13px', color: T.colors.textSecondary, marginTop: '5px' }}>
              Operating hours, court counts and peak times for all clubs
            </p>
          </div>
          <button onClick={() => setShowAddClub(v => !v)} style={{ ...T.btn.primary, padding: '10px 20px' }}>
            {showAddClub ? 'Cancel' : '+ Add Club'}
          </button>
        </div>

        {showAddClub && (
          <form
            action={handleAddClub}
            style={{
              ...T.card, padding: '20px 24px', marginBottom: '24px',
              border: `1px solid ${T.colors.red}`, display: 'flex', flexDirection: 'column', gap: '14px',
            }}
          >
            <p style={groupTitle}>New Club</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '14px' }}>
              <div>
                <label style={lbl}>Club Name</label>
                <input name="name" type="text" required style={T.input} placeholder="e.g. Stellenbosch" />
              </div>
              <div>
                <label style={lbl}>Court Count</label>
                <input name="courtCount" type="number" min={1} max={10} defaultValue={3} required style={T.input} />
              </div>
            </div>
            <button type="submit" style={{ ...T.btn.primary, alignSelf: 'flex-start' }}>Create Club</button>
            <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: 0 }}>
              Creates default revenue targets, court pricing (R550/R450 peak/off-peak), and catering settings — edit these afterward.
            </p>
          </form>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 100px 140px 28px', padding: '0 16px', marginBottom: '8px' }}>
          {['', 'Club', 'Courts', 'Hours', ''].map((h, i) => (
            <span key={i} style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
          ))}
        </div>

        {clubs.map((club, idx) => {
          const isOpen = expandedId === club.club_id
          const saved = savedId === club.club_id

          return (
            <div key={club.club_id} style={{
              background: T.colors.surface, borderRadius: T.radius.md, marginBottom: '4px',
              overflow: 'hidden', border: `1px solid ${isOpen ? T.colors.red : T.colors.border}`,
              boxShadow: isOpen ? T.shadow.redGlowSm : 'none',
              transition: 'border-color 0.2s ease',
              opacity: club.is_active ? 1 : 0.55,
            }}>

              <button onClick={() => setExpandedId(isOpen ? null : club.club_id)} style={{
                width: '100%', padding: '12px 16px',
                display: 'grid', gridTemplateColumns: '32px 1fr 100px 140px 28px',
                alignItems: 'center', background: isOpen ? T.colors.surfaceRaised : 'none',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              }}>
                <span style={{ fontSize: '11px', color: T.colors.textMuted, fontFamily: "'SF Mono', monospace" }}>{String(idx + 1).padStart(2, '0')}</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: T.colors.textPrimary }}>
                  {club.name}
                  {!club.is_active && (
                    <span style={{
                      marginLeft: '8px', fontSize: '10px', fontWeight: '700', color: T.colors.textMuted,
                      background: T.colors.surfaceRaised, padding: '2px 8px', borderRadius: '4px',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      Hidden
                    </span>
                  )}
                </span>
                <span style={{ fontSize: '13px', color: T.colors.textSecondary, fontFamily: "'SF Mono', monospace" }}>
                  {club.court_count}{club.pickleball_court_count > 0 ? ` +${club.pickleball_court_count}p` : ''}
                </span>
                <span style={{ fontSize: '12px', color: T.colors.textMuted, fontFamily: "'SF Mono', monospace" }}>{fmt(club.weekday_open)}–{fmt(club.weekday_close)}</span>
                {isOpen ? <ChevronUp size={14} color={T.colors.textMuted} /> : <ChevronDown size={14} color={T.colors.textMuted} />}
              </button>

              {isOpen && (
                <form
                  action={(formData) => handleSaveClub(club.club_id, formData)}
                  style={{ padding: '20px 24px', borderTop: `1px solid ${T.colors.border}` }}
                >
                  <p style={groupTitle}>Operating Hours</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                    {[
                      { label: 'Weekday Open', name: 'weekdayOpen', val: club.weekday_open },
                      { label: 'Weekday Close', name: 'weekdayClose', val: club.weekday_close },
                      { label: 'Weekend Open', name: 'weekendOpen', val: club.weekend_open },
                      { label: 'Weekend Close', name: 'weekendClose', val: club.weekend_close },
                    ].map(f => (
                      <div key={f.name}>
                        <label style={lbl}>{f.label}</label>
                        <input name={f.name} type="time" defaultValue={f.val} style={T.input} />
                      </div>
                    ))}
                  </div>

                  <p style={groupTitle}>Peak &amp; Off-Peak Times</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                    {[
                      { label: 'Morning Start', name: 'peakMorningStart', val: club.peak_morning_start },
                      { label: 'Morning End', name: 'peakMorningEnd', val: club.peak_morning_end },
                      { label: 'Evening Start', name: 'peakEveningStart', val: club.peak_evening_start },
                      { label: 'Evening End', name: 'peakEveningEnd', val: club.peak_evening_end },
                    ].map(f => (
                      <div key={f.name}>
                        <label style={lbl}>{f.label}</label>
                        <input name={f.name} type="time" defaultValue={f.val} style={T.input} />
                      </div>
                    ))}
                  </div>

                  <p style={groupTitle}>Courts</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                    <div>
                      <label style={lbl}>Number of Courts</label>
                      <input name="courtCount" type="number" defaultValue={club.court_count} min={1} max={10} style={T.input} />
                    </div>
                    <div>
                      <label style={lbl}>Pickleball Courts</label>
                      <input name="pickleballCourts" type="number" defaultValue={club.pickleball_court_count} min={0} max={10} style={T.input} />
                    </div>
                  </div>

                  <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: '0 0 16px' }}>
                    ⚠️ Reducing court count removes that club's highest-numbered court pricing rows — any custom rates on them are lost.
                  </p>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button type="submit" style={{
                      ...T.btn.primary, padding: '10px 24px',
                      background: saved ? T.colors.green : T.colors.red,
                    }}>
                      {saved ? '✓ Saved' : 'Save Club'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(club.club_id, club.is_active)}
                      style={{
                        padding: '10px 20px', borderRadius: T.radius.sm,
                        border: `1px solid ${T.colors.border}`, background: 'transparent',
                        color: T.colors.textMuted, fontSize: '13px', fontWeight: '600',
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {club.is_active ? 'Hide Club' : 'Unhide Club'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )
        })}

      </div>
    </div>
  )
}