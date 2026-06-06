'use client'

import { useState } from 'react'
import { Users, Calendar, TrendingUp, Clock, ChevronDown, ChevronUp, Menu } from 'lucide-react'
import Image from 'next/image'

const VA_RED = '#e00a09'
const VA_GRAY = '#e7e7e5'

const sections = [
  {
    id: 'overview',
    title: "Today's Overview",
    stats: [
      { label: "Today's Bookings", value: '24', change: '↑ 3 more than yesterday', icon: 'calendar', color: VA_RED },
      { label: 'Court Occupancy', value: '78%', change: '↑ Above weekly average', icon: 'trending', color: '#1a1a1a' },
      { label: 'Active Players', value: '186', change: 'This month', icon: 'users', color: VA_RED },
      { label: 'Peak Hour Today', value: '17:00', change: 'Next peak in 2hrs', icon: 'clock', color: '#1a1a1a' },
    ]
  },
  {
    id: 'peak',
    title: 'Peak vs Off-Peak — This Week',
    data: [
      { day: 'Monday', peak: 85, offpeak: 40 },
      { day: 'Tuesday', peak: 60, offpeak: 30 },
      { day: 'Wednesday', peak: 90, offpeak: 45 },
      { day: 'Thursday', peak: 75, offpeak: 35 },
      { day: 'Friday', peak: 95, offpeak: 50 },
      { day: 'Saturday', peak: 100, offpeak: 70 },
      { day: 'Sunday', peak: 80, offpeak: 55 },
    ]
  },
  {
    id: 'events',
    title: 'Event P&L — This Month',
    events: [
      { name: 'Corporate Tournament', revenue: 18500, cost: 6200, date: '2 Jun' },
      { name: 'Club Championship', revenue: 12000, cost: 4500, date: '18 May' },
      { name: 'Ladies Social Evening', revenue: 4800, cost: 1200, date: '10 May' },
      { name: 'Junior Academy Day', revenue: 6500, cost: 2800, date: '3 May' },
    ]
  }
]

function StatIcon({ type, color }) {
  const props = { size: 20, color }
  if (type === 'calendar') return <Calendar {...props} />
  if (type === 'trending') return <TrendingUp {...props} />
  if (type === 'users') return <Users {...props} />
  if (type === 'clock') return <Clock {...props} />
  return null
}

export default function Home() {
  const [open, setOpen] = useState({ overview: true, peak: true, events: true })
  const [menuOpen, setMenuOpen] = useState(false)

  const toggle = (id) => setOpen(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <main style={{ minHeight: '100vh', background: '#f4f4f4' }}>

      {/* Top Nav */}
      <nav style={{
        background: '#fff',
        borderBottom: `3px solid ${VA_RED}`,
        padding: '0 32px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Image src="/Logo.png" alt="Virgin Active" width={300} height={158} style={{ objectFit: 'contain' }} />
          <div style={{ width: '1px', height: '32px', background: VA_GRAY }} />
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Padel Club Manager</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: '#888' }}>Tygervalley Club</span>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: VA_RED, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: '600'
          }}>CM</div>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Page header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a' }}>Club Dashboard</h1>
          <p style={{ fontSize: '14px', color: '#888', marginTop: '4px' }}>Friday, 6 June 2025</p>
        </div>

        {/* Sections */}
        {sections.map((section) => (
          <div key={section.id} style={{
            background: '#fff',
            borderRadius: '12px',
            marginBottom: '16px',
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            border: '1px solid #ececec'
          }}>

            {/* Section header */}
            <button
              onClick={() => toggle(section.id)}
              style={{
                width: '100%',
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderBottom: open[section.id] ? '1px solid #f0f0f0' : 'none'
              }}
            >
              <span style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a1a' }}>{section.title}</span>
              {open[section.id]
                ? <ChevronUp size={18} color="#888" />
                : <ChevronDown size={18} color="#888" />}
            </button>

            {/* Section content */}
            {open[section.id] && (
              <div style={{ padding: '24px' }}>

                {/* Stats grid */}
                {section.stats && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    {section.stats.map((stat) => (
                      <div key={stat.label} style={{
                        background: '#fafafa',
                        border: '1px solid #ececec',
                        borderRadius: '10px',
                        padding: '20px',
                        borderTop: `3px solid ${stat.color}`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ fontSize: '12px', color: '#888', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</span>
                          <StatIcon type={stat.icon} color={stat.color} />
                        </div>
                        <p style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a' }}>{stat.value}</p>
                        <p style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>{stat.change}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Peak chart */}
                {section.data && (
                  <div>
                    <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: VA_RED }} />
                        <span style={{ fontSize: '13px', color: '#888' }}>Peak (17:00–21:00)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: VA_GRAY, border: '1px solid #ccc' }} />
                        <span style={{ fontSize: '13px', color: '#888' }}>Off-peak (06:00–16:00)</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {section.data.map((row) => (
                        <div key={row.day} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ fontSize: '13px', color: '#888', width: '90px', fontWeight: '500' }}>{row.day}</span>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ background: '#f0f0f0', borderRadius: '4px', height: '10px', overflow: 'hidden' }}>
                              <div style={{ width: `${row.peak}%`, height: '10px', background: VA_RED, borderRadius: '4px' }} />
                            </div>
                            <div style={{ background: '#f0f0f0', borderRadius: '4px', height: '10px', overflow: 'hidden' }}>
                              <div style={{ width: `${row.offpeak}%`, height: '10px', background: VA_GRAY, borderRadius: '4px', border: '1px solid #ccc' }} />
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '80px', textAlign: 'right' }}>
                            <span style={{ fontSize: '12px', color: VA_RED, fontWeight: '600' }}>{row.peak}%</span>
                            <span style={{ fontSize: '12px', color: '#aaa' }}>{row.offpeak}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Events P&L */}
                {section.events && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px', gap: '0', marginBottom: '12px', padding: '0 12px' }}>
                      <span style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Event</span>
                      <span style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Revenue</span>
                      <span style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Cost</span>
                      <span style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Profit</span>
                    </div>
                    {section.events.map((ev) => {
                      const profit = ev.revenue - ev.cost
                      return (
                        <div key={ev.name} style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 120px 120px 120px',
                          padding: '14px 12px',
                          borderRadius: '8px',
                          marginBottom: '4px',
                          background: '#fafafa',
                          border: '1px solid #f0f0f0',
                          alignItems: 'center'
                        }}>
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>{ev.name}</p>
                            <p style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>{ev.date}</p>
                          </div>
                          <span style={{ fontSize: '14px', color: '#1a1a1a', textAlign: 'right' }}>R {ev.revenue.toLocaleString()}</span>
                          <span style={{ fontSize: '14px', color: '#888', textAlign: 'right' }}>R {ev.cost.toLocaleString()}</span>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: profit > 0 ? '#16a34a' : VA_RED, textAlign: 'right' }}>R {profit.toLocaleString()}</span>
                        </div>
                      )
                    })}
                    <div style={{
                      marginTop: '12px',
                      padding: '14px 12px',
                      borderRadius: '8px',
                      background: '#1a1a1a',
                      display: 'grid',
                      gridTemplateColumns: '1fr 120px 120px 120px'
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>Total</span>
                      <span style={{ fontSize: '13px', color: '#fff', textAlign: 'right' }}>R {section.events.reduce((a, e) => a + e.revenue, 0).toLocaleString()}</span>
                      <span style={{ fontSize: '13px', color: '#aaa', textAlign: 'right' }}>R {section.events.reduce((a, e) => a + e.cost, 0).toLocaleString()}</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#4ade80', textAlign: 'right' }}>R {section.events.reduce((a, e) => a + (e.revenue - e.cost), 0).toLocaleString()}</span>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}