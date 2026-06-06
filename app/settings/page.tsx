'use client'

import { useState } from 'react'

const VA_RED = '#e00a09'

const defaultClubs = [
  {
    id: 1,
    name: 'Tygervalley',
    weekdayOpen: '06:00',
    weekdayClose: '23:00',
    weekendOpen: '06:00',
    weekendClose: '22:00',
    courts: 3,
    hasPickleball: false,
    pickleballCourts: 0,
    dailyTarget: 10686,
  },
]

type Club = typeof defaultClubs[0]

export default function Settings() {
  const [clubs, setClubs] = useState<Club[]>(defaultClubs)
  const [saved, setSaved] = useState(false)

  const update = (id: number, field: string, value: string | number | boolean) => {
    setClubs(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
    setSaved(false)
  }

  const save = () => {
    localStorage.setItem('padel_clubs', JSON.stringify(clubs))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f4f4f4', padding: '32px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a' }}>Settings</h1>
          <p style={{ fontSize: '14px', color: '#888', marginTop: '4px' }}>Configure each club's operating hours, courts and revenue targets</p>
        </div>

        {clubs.map(club => (
          <div key={club.id} style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #ececec', marginBottom: '16px' }}>

            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>{club.name}</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

              {/* Weekday hours */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Weekday Opening</label>
                <input
                  type="time"
                  value={club.weekdayOpen}
                  onChange={e => update(club.id, 'weekdayOpen', e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Weekday Closing</label>
                <input
                  type="time"
                  value={club.weekdayClose}
                  onChange={e => update(club.id, 'weekdayClose', e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}
                />
              </div>

              {/* Weekend hours */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Weekend Opening</label>
                <input
                  type="time"
                  value={club.weekendOpen}
                  onChange={e => update(club.id, 'weekendOpen', e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Weekend Closing</label>
                <input
                  type="time"
                  value={club.weekendClose}
                  onChange={e => update(club.id, 'weekendClose', e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}
                />
              </div>

              {/* Courts */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Number of Courts</label>
                <input
                  type="number"
                  value={club.courts}
                  min={1}
                  max={10}
                  onChange={e => update(club.id, 'courts', parseInt(e.target.value))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}
                />
              </div>

              {/* Daily target */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Daily Revenue Target (R)</label>
                <input
                  type="number"
                  value={club.dailyTarget}
                  onChange={e => update(club.id, 'dailyTarget', parseInt(e.target.value))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}
                />
              </div>

              {/* Pickleball toggle */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Pickleball Courts</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button
                    onClick={() => update(club.id, 'hasPickleball', !club.hasPickleball)}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      background: club.hasPickleball ? VA_RED : '#e0e0e0',
                      color: club.hasPickleball ? '#fff' : '#888',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >{club.hasPickleball ? 'Enabled' : 'Disabled'}</button>
                  {club.hasPickleball && (
                    <input
                      type="number"
                      value={club.pickleballCourts}
                      min={1}
                      max={5}
                      placeholder="Number of pickleball courts"
                      onChange={e => update(club.id, 'pickleballCourts', parseInt(e.target.value))}
                      style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '14px', fontFamily: 'inherit', outline: 'none', width: '220px' }}
                    />
                  )}
                </div>
              </div>

            </div>

            {/* Calculated summary */}
            <div style={{ marginTop: '24px', padding: '16px', background: '#fafafa', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Calculated Values</p>
              <div style={{ display: 'flex', gap: '32px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#aaa' }}>Weekday operating hours</p>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a1a' }}>
                    {(() => {
                      const [oh, om] = club.weekdayOpen.split(':').map(Number)
                      const [ch, cm] = club.weekdayClose.split(':').map(Number)
                      return ((ch * 60 + cm) - (oh * 60 + om)) / 60
                    })()} hrs
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#aaa' }}>Weekend operating hours</p>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a1a' }}>
                    {(() => {
                      const [oh, om] = club.weekendOpen.split(':').map(Number)
                      const [ch, cm] = club.weekendClose.split(':').map(Number)
                      return ((ch * 60 + cm) - (oh * 60 + om)) / 60
                    })()} hrs
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#aaa' }}>Weekday max court hours</p>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a1a' }}>
                    {(() => {
                      const [oh, om] = club.weekdayOpen.split(':').map(Number)
                      const [ch, cm] = club.weekdayClose.split(':').map(Number)
                      return (((ch * 60 + cm) - (oh * 60 + om)) / 60) * club.courts
                    })()} hrs
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#aaa' }}>Daily target</p>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: VA_RED }}>R {club.dailyTarget}</p>
                </div>
              </div>
            </div>

          </div>
        ))}

        <button
          onClick={save}
          style={{
            padding: '12px 32px',
            background: saved ? '#16a34a' : VA_RED,
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background 0.2s ease',
          }}
        >{saved ? '✓ Saved' : 'Save Settings'}</button>

      </div>
    </main>
  )
}