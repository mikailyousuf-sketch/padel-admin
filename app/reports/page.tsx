'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'

const VA_RED = '#e00a09'

const peakData: { [key: string]: { day: string; peak: number; offpeak: number }[] } = {
  'This Week': [
    { day: 'Monday', peak: 85, offpeak: 40 },
    { day: 'Tuesday', peak: 60, offpeak: 30 },
    { day: 'Wednesday', peak: 90, offpeak: 45 },
    { day: 'Thursday', peak: 75, offpeak: 35 },
    { day: 'Friday', peak: 95, offpeak: 50 },
    { day: 'Saturday', peak: 100, offpeak: 70 },
    { day: 'Sunday', peak: 80, offpeak: 55 },
  ],
  'Last Week': [
    { day: 'Monday', peak: 70, offpeak: 35 },
    { day: 'Tuesday', peak: 55, offpeak: 25 },
    { day: 'Wednesday', peak: 80, offpeak: 40 },
    { day: 'Thursday', peak: 65, offpeak: 30 },
    { day: 'Friday', peak: 90, offpeak: 45 },
    { day: 'Saturday', peak: 95, offpeak: 65 },
    { day: 'Sunday', peak: 75, offpeak: 50 },
  ],
  'This Month': [
    { day: 'Week 1', peak: 78, offpeak: 38 },
    { day: 'Week 2', peak: 82, offpeak: 42 },
    { day: 'Week 3', peak: 88, offpeak: 48 },
    { day: 'Week 4', peak: 92, offpeak: 52 },
  ],
}

const occupancyData: { [key: string]: { label: string; occupancy: number; revenue: number }[] } = {
  'Yesterday': [
    { label: 'Court 1', occupancy: 82, revenue: 4200 },
    { label: 'Court 2', occupancy: 76, revenue: 3800 },
    { label: 'Court 3', occupancy: 90, revenue: 4500 },
    { label: 'Court 4', occupancy: 65, revenue: 3200 },
  ],
  'Past Week': [
    { label: 'Monday', occupancy: 70, revenue: 12400 },
    { label: 'Tuesday', occupancy: 55, revenue: 9800 },
    { label: 'Wednesday', occupancy: 80, revenue: 14200 },
    { label: 'Thursday', occupancy: 75, revenue: 13100 },
    { label: 'Friday', occupancy: 95, revenue: 18600 },
    { label: 'Saturday', occupancy: 100, revenue: 21000 },
    { label: 'Sunday', occupancy: 88, revenue: 17400 },
  ],
  'Past Month': [
    { label: 'Week 1', occupancy: 72, revenue: 68400 },
    { label: 'Week 2', occupancy: 78, revenue: 74200 },
    { label: 'Week 3', occupancy: 85, revenue: 81600 },
    { label: 'Week 4', occupancy: 91, revenue: 87800 },
  ],
}

const events = [
  { name: 'Corporate Tournament', revenue: 18500, cost: 6200, date: '2 Jun', status: 'Completed' },
  { name: 'Club Championship', revenue: 12000, cost: 4500, date: '18 May', status: 'Completed' },
  { name: 'Ladies Social Evening', revenue: 4800, cost: 1200, date: '10 May', status: 'Completed' },
  { name: 'Junior Academy Day', revenue: 6500, cost: 2800, date: '3 May', status: 'Completed' },
  { name: 'Business League Round 1', revenue: 9200, cost: 3100, date: '14 Jun', status: 'Upcoming' },
]

export default function Reports() {
  const [period, setPeriod] = useState('This Week')
  const [occPeriod, setOccPeriod] = useState('Yesterday')

  const exportEventsToExcel = () => {
    const exportData = events.map(ev => ({
      Event: ev.name,
      Date: ev.date,
      Revenue: ev.revenue,
      Cost: ev.cost,
      Profit: ev.revenue - ev.cost,
      Status: ev.status,
    }))
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Event P&L')
    XLSX.writeFile(wb, 'Virgin_Active_Padel_Event_PL.xlsx')
  }

  const exportOccupancyToExcel = () => {
    const exportData = occupancyData[occPeriod].map(row => ({
      Label: row.label,
      Occupancy: `${row.occupancy}%`,
      Revenue: row.revenue,
    }))
    exportData.push({
      Label: 'TOTAL / AVERAGE',
      Occupancy: `${Math.round(occupancyData[occPeriod].reduce((a, r) => a + r.occupancy, 0) / occupancyData[occPeriod].length)}%`,
      Revenue: occupancyData[occPeriod].reduce((a, r) => a + r.revenue, 0),
    })
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `Occupancy ${occPeriod}`)
    XLSX.writeFile(wb, `Virgin_Active_Padel_Occupancy_${occPeriod.replace(' ', '_')}.xlsx`)
  }

  const totalRevenue = events.filter(e => e.status === 'Completed').reduce((a, e) => a + e.revenue, 0)
  const totalCost = events.filter(e => e.status === 'Completed').reduce((a, e) => a + e.cost, 0)
  const totalProfit = totalRevenue - totalCost

  return (
    <main style={{ minHeight: '100vh', background: '#f4f4f4', padding: '32px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a' }}>Reports</h1>
          <p style={{ fontSize: '14px', color: '#888', marginTop: '4px' }}>Peak vs off-peak analysis, occupancy, revenue and event summaries</p>
        </div>

        {/* Peak vs Off-Peak */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #ececec', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>Peak vs Off-Peak Bookings</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['This Week', 'Last Week', 'This Month'].map(p => (
                <button key={p} onClick={() => setPeriod(p)} style={{ padding: '6px 14px', borderRadius: '6px', border: period === p ? 'none' : '1px solid #e0e0e0', background: period === p ? VA_RED : '#fff', color: period === p ? '#fff' : '#888', fontSize: '13px', fontWeight: period === p ? '600' : '400', cursor: 'pointer', fontFamily: 'inherit' }}>{p}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: VA_RED }} />
              <span style={{ fontSize: '13px', color: '#888' }}>Peak (17:00–21:00)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#e7e7e5', border: '1px solid #ccc' }} />
              <span style={{ fontSize: '13px', color: '#888' }}>Off-peak (06:00–16:00)</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {peakData[period].map((row) => (
              <div key={row.day} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '13px', color: '#888', width: '100px', fontWeight: '500' }}>{row.day}</span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ background: '#f0f0f0', borderRadius: '4px', height: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${row.peak}%`, height: '10px', background: VA_RED, borderRadius: '4px' }} />
                  </div>
                  <div style={{ background: '#f0f0f0', borderRadius: '4px', height: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${row.offpeak}%`, height: '10px', background: '#e7e7e5', borderRadius: '4px', border: '1px solid #ccc' }} />
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

        {/* Occupancy and Revenue */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #ececec', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>Occupancy & Revenue</h2>
              <button onClick={exportOccupancyToExcel} style={{ padding: '6px 16px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>Export to Excel</button>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['Yesterday', 'Past Week', 'Past Month'].map(p => (
                <button key={p} onClick={() => setOccPeriod(p)} style={{ padding: '6px 14px', borderRadius: '6px', border: occPeriod === p ? 'none' : '1px solid #e0e0e0', background: occPeriod === p ? VA_RED : '#fff', color: occPeriod === p ? '#fff' : '#888', fontSize: '13px', fontWeight: occPeriod === p ? '600' : '400', cursor: 'pointer', fontFamily: 'inherit' }}>{p}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {occupancyData[occPeriod].map((row) => (
              <div key={row.label} style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: '10px', padding: '16px 20px', borderLeft: `4px solid ${VA_RED}` }}>
                <p style={{ fontSize: '13px', color: '#888', fontWeight: '500', marginBottom: '12px' }}>{row.label}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Occupancy</p>
                    <p style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a' }}>{row.occupancy}%</p>
                    <div style={{ marginTop: '6px', background: '#f0f0f0', borderRadius: '4px', height: '6px', width: '120px', overflow: 'hidden' }}>
                      <div style={{ width: `${row.occupancy}%`, height: '6px', background: VA_RED, borderRadius: '4px' }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue</p>
                    <p style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a' }}>R {row.revenue}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '16px', padding: '14px 20px', borderRadius: '8px', background: '#1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>Total — {occPeriod}</span>
            <div style={{ display: 'flex', gap: '32px' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Occupancy</p>
                <p style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>{Math.round(occupancyData[occPeriod].reduce((a, r) => a + r.occupancy, 0) / occupancyData[occPeriod].length)}%</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Revenue</p>
                <p style={{ fontSize: '16px', fontWeight: '700', color: '#4ade80' }}>R {occupancyData[occPeriod].reduce((a, r) => a + r.revenue, 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Event P&L */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #ececec' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>Event P&L Summary</h2>
            <button onClick={exportEventsToExcel} style={{ padding: '8px 18px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>Export to Excel</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 110px 100px', gap: '0', marginBottom: '12px', padding: '0 12px' }}>
            {['Event', 'Revenue', 'Cost', 'Profit', 'Status'].map(h => (
              <span key={h} style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: h !== 'Event' ? 'right' : 'left' }}>{h}</span>
            ))}
          </div>
          {events.map((ev) => {
            const profit = ev.revenue - ev.cost
            return (
              <div key={ev.name} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 110px 100px', padding: '14px 12px', borderRadius: '8px', marginBottom: '4px', background: '#fafafa', border: '1px solid #f0f0f0', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>{ev.name}</p>
                  <p style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>{ev.date}</p>
                </div>
                <span style={{ fontSize: '14px', color: '#1a1a1a', textAlign: 'right' }}>R {ev.revenue}</span>
                <span style={{ fontSize: '14px', color: '#888', textAlign: 'right' }}>R {ev.cost}</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: profit > 0 ? '#16a34a' : VA_RED, textAlign: 'right' }}>R {profit}</span>
                <span style={{ fontSize: '12px', fontWeight: '600', textAlign: 'right', color: ev.status === 'Completed' ? '#16a34a' : '#f59e0b' }}>{ev.status}</span>
              </div>
            )
          })}
          <div style={{ marginTop: '12px', padding: '14px 12px', borderRadius: '8px', background: '#1a1a1a', display: 'grid', gridTemplateColumns: '1fr 110px 110px 110px 100px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>Total (Completed)</span>
            <span style={{ fontSize: '13px', color: '#fff', textAlign: 'right' }}>R {totalRevenue}</span>
            <span style={{ fontSize: '13px', color: '#aaa', textAlign: 'right' }}>R {totalCost}</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#4ade80', textAlign: 'right' }}>R {totalProfit}</span>
            <span></span>
          </div>
        </div>

      </div>
    </main>
  )
}