'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './sidebar'
import { Sun, Moon } from 'lucide-react'
import { getHeaderContext } from '@/lib/layout/header-context'
import { BRAND } from '@/lib/config/brand'

// Pages that own their entire screen — no sidebar, no header, no chrome.
// Matched exactly or as a path prefix (so /reset-password?token=... still counts).
const CHROMELESS_ROUTES = ['/login', '/welcome', '/select-club', '/forgot-password', '/reset-password']

// These variables are what actually drive light/dark now. Every page in the
// app reads colors from theme.ts, and theme.ts now emits var(--color-*)
// instead of hardcoded hex for anything mode-sensitive — so defining these
// once, here, fixes light mode everywhere at once instead of needing every
// individual page to be touched.
const THEME_VARS = `
  :root {
    --color-bg: #0a0a0a;
    --color-surface: #111111;
    --color-surface-hover: #161616;
    --color-surface-raised: #1a1a1a;
    --color-border: #222222;
    --color-border-bright: #2e2e2e;
    --color-text-primary: #f0f0f0;
    --color-text-secondary: #888888;
    --color-text-muted: #444444;
  }
  html.light {
    --color-bg: #f4f4f4;
    --color-surface: #ffffff;
    --color-surface-hover: #fafafa;
    --color-surface-raised: #f0f0f0;
    --color-border: #d8d8d8;
    --color-border-bright: #c2c2c2;
    --color-text-primary: #0a0a0a;
    --color-text-secondary: #555555;
    --color-text-muted: #8a8a8a;
  }
`

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [scopeLabel, setScopeLabel] = useState('')
  const [userInitials, setUserInitials] = useState('')

  useEffect(() => {
    document.documentElement.classList.toggle('light', !darkMode)
  }, [darkMode])

  const isChromeless = CHROMELESS_ROUTES.some(
    route => pathname === route || pathname?.startsWith(route + '/')
  )

  // Refetch on every navigation — this is what makes the header update the
  // instant someone picks a club/company on /select-club and lands on '/'.
  useEffect(() => {
    if (isChromeless) return
    getHeaderContext()
      .then(ctx => {
        setScopeLabel(ctx.scopeLabel)
        setUserInitials(ctx.userInitials)
      })
      .catch(() => {
        setScopeLabel('')
        setUserInitials('')
      })
  }, [pathname, isChromeless])

  if (isChromeless) {
    return (
      <>
        <style>{THEME_VARS}</style>
        {children}
      </>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
      <style>{THEME_VARS}</style>

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
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          gap: '16px',
        }}>
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            {scopeLabel || 'Loading…'}
          </span>
          <div style={{ width: '1px', height: '20px', background: 'var(--color-border)' }} />

          {/* Light/dark toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--color-text-muted)',
            }}
          >
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          <div style={{ width: '1px', height: '20px', background: 'var(--color-border)' }} />

          {/* Avatar */}
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: BRAND.primaryColor,
            boxShadow: '0 0 10px rgba(224,10,9,0.4)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff',
            fontSize: '12px', fontWeight: '700',
          }}>
            {userInitials || '··'}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, background: 'var(--color-bg)' }}>
          {children}
        </main>

      </div>
    </div>
  )
}