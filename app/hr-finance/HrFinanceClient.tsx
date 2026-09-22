'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Users, ChevronRight, Building2, Calendar, AlertTriangle,
} from 'lucide-react'
import { theme } from '../components/theme'
import {
  listStaffForClub, listLeaveRequests, listHrIncidents, listStaffCompensation,
  type StaffMemberRow, type LeaveRequestRow, type HrIncidentRow, type StaffCompensationRow,
} from '../hr/actions'
import { listActiveClubsForMaintenance } from '../maintenance/actions'

const T = theme

function MiniStat({ label, value, tone }: { label: string; value: number | string; tone?: 'red' | 'amber' | 'green' }) {
  const color = tone === 'red' ? T.colors.red : tone === 'amber' ? T.colors.amber : tone === 'green' ? T.colors.green : T.colors.textPrimary
  return (
    <div style={{ flex: 1, minWidth: '140px', background: T.colors.surface, border: `1px solid ${T.colors.border}`, borderRadius: T.radius.lg, padding: '18px 20px' }}>
      <p style={{ fontSize: '11px', color: T.colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>{label}</p>
      <p style={{ fontSize: '26px', fontWeight: 700, color, margin: 0, fontFamily: "'SF Mono', monospace", letterSpacing: '-0.02em' }}>{value}</p>
    </div>
  )
}

function ClubCard({ clubId, name, activeStaff, pendingLeave, openIncidents }: {
  clubId: string; name: string; activeStaff: number; pendingLeave: number; openIncidents: number
}) {
  const [hovered, setHovered] = useState(false)
  const hasActivity = pendingLeave > 0 || openIncidents > 0

  return (
    <Link href={`/hr-finance/${clubId}`} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: T.colors.surface,
          border: `1px solid ${openIncidents > 0 ? 'rgba(239,68,68,0.4)' : hovered ? T.colors.borderBright : T.colors.border}`,
          borderRadius: T.radius.lg, padding: '20px 22px', cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: hovered ? T.shadow.cardHover : T.shadow.card,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={15} color={T.colors.textSecondary} />
            <span style={{ fontSize: '14px', fontWeight: 700, color: T.colors.textPrimary }}>{name}</span>
          </div>
          <ChevronRight size={15} color={hovered ? T.colors.red : T.colors.textMuted} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={12} color={T.colors.textMuted} />
            <span style={{ fontSize: '12px', color: T.colors.textSecondary }}>{activeStaff} active staff</span>
          </div>
          {hasActivity ? (
            <>
              {pendingLeave > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={12} color={T.colors.textMuted} />
                  <span style={{ fontSize: '12px', color: T.colors.textSecondary }}>{pendingLeave} leave pending</span>
                </div>
              )}
              {openIncidents > 0 && (
                <span style={{ ...T.badge.red, padding: '2px 8px', borderRadius: T.radius.pill, fontSize: '10px', fontWeight: 700, alignSelf: 'flex-start', marginTop: '2px' }}>
                  {openIncidents} open incident{openIncidents === 1 ? '' : 's'}
                </span>
              )}
            </>
          ) : (
            <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: 0 }}>Nothing outstanding</p>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function HrFinanceClient() {
  const [staff, setStaff] = useState<StaffMemberRow[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestRow[]>([])
  const [incidents, setIncidents] = useState<HrIncidentRow[]>([])
  const [compensation, setCompensation] = useState<StaffCompensationRow[]>([])
  const [clubs, setClubs] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const refresh = async () => {
    const [s, l, i, c, cl] = await Promise.allSettled([
      listStaffForClub(), listLeaveRequests(), listHrIncidents(), listStaffCompensation(), listActiveClubsForMaintenance(),
    ])
    if (s.status === 'fulfilled') setStaff(s.value)
    if (l.status === 'fulfilled') setLeaveRequests(l.value)
    if (i.status === 'fulfilled') setIncidents(i.value)
    if (c.status === 'fulfilled') setCompensation(c.value)
    if (cl.status === 'fulfilled') setClubs(cl.value)
    const failed = [s, l, i, c, cl].find(x => x.status === 'rejected') as PromiseRejectedResult | undefined
    setLoadError(failed ? (failed.reason?.message ?? 'Failed to load data — check console.') : null)
  }

  useEffect(() => { refresh().finally(() => setLoading(false)) }, [])

  const perClubStats = useMemo(() => {
    const map = new Map<string, { activeStaff: number; pendingLeave: number; openIncidents: number }>()
    const unassigned = { activeStaff: 0, pendingLeave: 0, openIncidents: 0 }
    for (const s of staff) {
      if (s.status === 'terminated') continue
      if (s.club_id) {
        const st = map.get(s.club_id) ?? { activeStaff: 0, pendingLeave: 0, openIncidents: 0 }
        st.activeStaff += 1
        map.set(s.club_id, st)
      } else {
        unassigned.activeStaff += 1
      }
    }
    for (const l of leaveRequests) {
      if (l.status !== 'submitted') continue
      const st = map.get(l.club_id) ?? { activeStaff: 0, pendingLeave: 0, openIncidents: 0 }
      st.pendingLeave += 1
      map.set(l.club_id, st)
    }
    for (const i of incidents) {
      if (i.status !== 'open' && i.status !== 'under_review') continue
      const st = map.get(i.club_id) ?? { activeStaff: 0, pendingLeave: 0, openIncidents: 0 }
      st.openIncidents += 1
      map.set(i.club_id, st)
    }
    return { map, unassigned }
  }, [staff, leaveRequests, incidents])

  const sortedClubs = useMemo(() => {
    return [...clubs].sort((a, b) => {
      const ai = perClubStats.map.get(a.id)?.openIncidents ?? 0
      const bi = perClubStats.map.get(b.id)?.openIncidents ?? 0
      if (ai !== bi) return bi - ai
      return a.name.localeCompare(b.name)
    })
  }, [clubs, perClubStats])

  const activeStaffCount = staff.filter(s => s.status !== 'terminated').length
  const pendingLeaveCount = leaveRequests.filter(l => l.status === 'submitted').length
  const openIncidentCount = incidents.filter(i => i.status === 'open' || i.status === 'under_review').length
  const totalMonthlySpend = compensation.reduce((sum, c) => sum + (c.monthly_rate ?? 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: T.colors.bg }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: T.space.pagePadding }}>

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: T.colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
            HR & Finance
          </h1>
          <p style={{ fontSize: '13px', color: T.colors.textSecondary, marginTop: '5px' }}>
            Select a club to review its roster, leave requests, and incidents.
          </p>
        </div>

        {loadError && (
          <div style={{ ...T.card, borderColor: 'rgba(239,68,68,0.3)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={16} color={T.colors.red} />
            <span style={{ fontSize: '13px', color: T.colors.textSecondary }}>Couldn't load some data: {loadError}.</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <MiniStat label="Active Staff" value={loading ? '—' : activeStaffCount} />
          <MiniStat label="Pending Leave" value={loading ? '—' : pendingLeaveCount} tone="amber" />
          <MiniStat label="Open Incidents" value={loading ? '—' : openIncidentCount} tone="red" />
          <MiniStat label="Monthly Payroll" value={loading ? '—' : `R ${totalMonthlySpend.toLocaleString()}`} tone="green" />
        </div>

        {loading ? (
          <p style={{ fontSize: '13px', color: T.colors.textMuted }}>Loading clubs…</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', marginBottom: '28px' }}>
            {sortedClubs.map(c => {
              const s = perClubStats.map.get(c.id) ?? { activeStaff: 0, pendingLeave: 0, openIncidents: 0 }
              return (
                <ClubCard
                  key={c.id}
                  clubId={c.id}
                  name={c.name}
                  activeStaff={s.activeStaff}
                  pendingLeave={s.pendingLeave}
                  openIncidents={s.openIncidents}
                />
              )
            })}
            {perClubStats.unassigned.activeStaff > 0 && (
              <ClubCard
                clubId="unassigned"
                name="Unassigned / HQ"
                activeStaff={perClubStats.unassigned.activeStaff}
                pendingLeave={0}
                openIncidents={0}
              />
            )}
          </div>
        )}

      </div>
    </div>
  )
}