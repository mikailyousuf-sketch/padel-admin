'use client'

export default function Reports() {
  return (
    <main style={{ minHeight: '100vh', background: '#f4f4f4', padding: '32px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a' }}>Reports</h1>
          <p style={{ fontSize: '14px', color: '#888', marginTop: '4px' }}>Peak vs off-peak analysis and event summaries</p>
        </div>
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          border: '1px solid #ececec',
          color: '#888',
          fontSize: '14px'
        }}>
          Reports coming soon — will connect to Playtomic API data.
        </div>
      </div>
    </main>
  )
}