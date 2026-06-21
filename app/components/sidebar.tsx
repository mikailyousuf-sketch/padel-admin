'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BarChart2, Calendar,
  Sparkles, Settings as SettingsIcon, ChevronLeft, ChevronRight,
  ChevronDown, MessageSquare, Zap, Megaphone, ImagePlus,
  RefreshCw, Shield, Building2, DollarSign, Coffee, Trophy,
} from 'lucide-react'
import { theme } from './theme'

const T = theme

const NAV_GROUPS = [
  {
    id: 'admin',
    label: 'Admin',
    icon: Shield,
    items: [
      { label: 'Dashboard', href: '/',         icon: LayoutDashboard },
      { label: 'Reports',   href: '/reports',  icon: BarChart2       },
      { label: 'Events',    href: '/events',   icon: Calendar        },
    ],
  },
  {
    id: 'ai',
    label: 'AI Assistant',
    icon: Sparkles,
    items: [
      { label: 'Quote Generator',      href: '/assistant/quotes',    icon: Zap           },
      { label: 'WhatsApp Automation',  href: '/assistant/whatsapp',  icon: MessageSquare },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: Megaphone,
    items: [
      { label: 'New Flyer Design', href: '/marketing/new',    icon: ImagePlus  },
      { label: 'Flyer Updates',    href: '/marketing/update', icon: RefreshCw  },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: SettingsIcon,
    items: [
      { label: 'Club Configuration', href: '/settings/clubs',       icon: Building2  },
      { label: 'Revenue & Targets',  href: '/settings/revenue',     icon: DollarSign },
      { label: 'Catering Partners',  href: '/settings/catering',    icon: Coffee     },
      { label: 'Player KPI Targets', href: '/settings/player-kpis', icon: Trophy     },
    ],
  },
]

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  darkMode: boolean
}

export default function Sidebar({ collapsed, setCollapsed, darkMode }: SidebarProps) {
  const pathname = usePathname()

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    admin: true, settings: false, ai: false, marketing: false,
  })

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const surface = darkMode ? '#0d0d0d' : '#111111'
  const border  = darkMode ? '#1a1a1a' : '#222222'

  return (
    <aside style={{
      width: collapsed ? '64px' : '220px',
      minHeight: '100vh',
      background: surface,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s ease',
      position: 'fixed',
      top: 0, left: 0,
      zIndex: 200,
      overflow: 'hidden',
      borderRight: `1px solid ${border}`,
    }}>

      {/* ── Logo ── */}
      <div style={{
        padding: '0 16px',
        borderBottom: `1px solid ${border}`,
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        height: '56px', overflow: 'hidden', flexShrink: 0,
      }}>
        {collapsed ? (
          <div style={{
            width: '28px', height: '28px', background: T.colors.red,
            borderRadius: '6px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff', fontWeight: '700',
            fontSize: '13px', flexShrink: 0,
            boxShadow: T.shadow.redGlowSm,
          }}>P</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <span style={{ color: T.colors.red, fontWeight: '700', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Virgin Active</span>
            <span style={{ color: '#333', fontWeight: '500', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Padel Club Manager</span>
          </div>
        )}
      </div>

      {/* ── Nav groups ── */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV_GROUPS.map(group => {
          const isGroupOpen  = openGroups[group.id]
          const GroupIcon    = group.icon
          const hasActive    = group.items.some(item => pathname === item.href)

          return (
            <div key={group.id} style={{ marginBottom: '4px' }}>

              <button
                onClick={() => !collapsed && toggleGroup(group.id)}
                title={collapsed ? group.label : undefined}
                style={{
                  width: '100%', padding: '8px 12px',
                  display: 'flex', alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'space-between',
                  background: hasActive ? T.colors.redGlow : 'transparent',
                  border: `1px solid ${hasActive ? 'rgba(224,10,9,0.15)' : 'transparent'}`,
                  borderRadius: '8px',
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.15s ease',
                  marginBottom: isGroupOpen && !collapsed ? '2px' : '0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <GroupIcon size={15} color={hasActive ? T.colors.red : '#444'} style={{ flexShrink: 0 }} />
                  {!collapsed && (
                    <span style={{
                      fontSize: '11px', fontWeight: '700',
                      color: hasActive ? T.colors.red : '#444',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      whiteSpace: 'nowrap',
                    }}>
                      {group.label}
                    </span>
                  )}
                </div>
                {!collapsed && (
                  <ChevronDown
                    size={12}
                    color="#333"
                    style={{
                      flexShrink: 0,
                      transform: isGroupOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                )}
              </button>

              {(isGroupOpen || collapsed) && (
                <div style={{ paddingLeft: collapsed ? '0' : '8px', overflow: 'hidden' }}>
                  {group.items.map(({ label, href, icon: Icon }) => {
                    const active = pathname === href
                    return (
                      <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                        <div
                          title={collapsed ? label : undefined}
                          style={{
                            display: 'flex', alignItems: 'center',
                            gap: '10px', padding: '8px 12px',
                            borderRadius: '7px', marginBottom: '2px',
                            background: active ? 'rgba(224,10,9,0.12)' : 'transparent',
                            color: active ? T.colors.red : '#444',
                            cursor: 'pointer',
                            transition: 'all 0.12s ease',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            whiteSpace: 'nowrap', overflow: 'hidden',
                            borderLeft: active && !collapsed ? `2px solid ${T.colors.red}` : '2px solid transparent',
                            boxShadow: active ? T.shadow.redGlowSm : 'none',
                          }}
                        >
                          <Icon size={14} style={{ flexShrink: 0 }} />
                          {!collapsed && (
                            <span style={{ fontSize: '13px', fontWeight: active ? '600' : '400', color: active ? T.colors.red : '#555' }}>
                              {label}
                            </span>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}

              <div style={{ height: '1px', background: border, margin: '6px 4px' }} />
            </div>
          )
        })}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          margin: '12px 8px', padding: '9px',
          background: '#161616', border: `1px solid ${border}`,
          borderRadius: '8px', color: '#333', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'border-color 0.15s ease',
        }}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

    </aside>
  )
}