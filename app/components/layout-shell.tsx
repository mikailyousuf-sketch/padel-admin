'use client'

import { useState, useEffect } from 'react'
import Sidebar from './sidebar'
import { Sun, Moon } from 'lucide-react'

const VA_RED = '#e00a09'

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(true)

  useEffect(() => {
    document.documentElement.classList.toggle('light', !darkMode)
  }, [darkMode])

  const bg      = darkMode ? '#0a0a0a' : '#f4f4f4'
  const surface = darkMode ? '#111111' : '#ffffff'
  const border  = darkMode ? '#1e1e1e' : '#ececec'
  const text     = darkMode ? '#f0f0f0' : '#0a0a0a'
  const textMuted= darkMode ? '#888'    : '#666'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: bg }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} darkMode={darkMode} />

      <div style={{
        marginLeft: collapsed ? '64px' : '220px',
        flex: 1, minHeight: '100vh',
        transition: 'margin-left 0.2s ease',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* Top bar */}
        <header style={{
          height: '56px',
          background: surface,
          borderBottom: `1px solid ${border}`,
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          gap: '16px',
        }}>
          <span style={{ fontSize: '13px', color: textMuted }}>Woodstock Club</span>
          <div style={{ width: '1px', height: '20px', background: border }} />

          {/* Light/dark toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: darkMode ? '#1a1a1a' : '#f0f0f0',
              border: `1px solid ${border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: textMuted,
            }}
          >
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          <div style={{ width: '1px', height: '20px', background: border }} />

          {/* Avatar */}
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: VA_RED,
            boxShadow: '0 0 10px rgba(224,10,9,0.4)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff',
            fontSize: '12px', fontWeight: '700',
          }}>CM</div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, background: bg }}>
          {children}
        </main>

      </div>
    </div>
  )
}