'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BarChart2,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const VA_RED = '#e00a09'

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Reports', href: '/reports', icon: BarChart2 },
  { label: 'AI Assistant', href: '/assistant', icon: Sparkles },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <aside style={{
      width: collapsed ? '64px' : '220px',
      minHeight: '100vh',
      background: '#1a1a1a',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s ease',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 200,
    }}>

      <div style={{
        padding: '20px 16px',
        borderBottom: '1px solid #2a2a2a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        minHeight: '72px'
      }}>
        {!collapsed && (
          <span style={{
            color: '#fff',
            fontWeight: '700',
            fontSize: '14px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>Padel Admin</span>
        )}
        {collapsed && (
          <div style={{
            width: '32px',
            height: '32px',
            background: VA_RED,
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: '700',
            fontSize: '14px'
          }}>P</div>
        )}
      </div>

      <nav style={{ flex: 1, padding: '16px 8px' }}>
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '8px',
                marginBottom: '4px',
                background: active ? VA_RED : 'transparent',
                color: active ? '#fff' : '#aaa',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}>
                <Icon size={18} />
                {!collapsed && (
                  <span style={{ fontSize: '14px', fontWeight: active ? '600' : '400' }}>
                    {label}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          margin: '16px 8px',
          padding: '10px',
          background: '#2a2a2a',
          border: 'none',
          borderRadius: '8px',
          color: '#aaa',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

    </aside>
  )
}