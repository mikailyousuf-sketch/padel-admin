'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, ChevronRight, Building2, Wrench, Hammer,
} from 'lucide-react'
import { theme } from '../components/theme'
import {
  listMaintenanceRequests, listClubUpgrades, listActiveClubsForMaintenance,
  type MaintenanceRequestRow, type ClubUpgradeRow,
} from '../maintenance/actions'

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

function ClubCard({ clubId, name, openRequests, urgentRequests, pendingUpgrades }: {
  clubId: string; name: string; openRequests: number; urgentRequests: number; pendingUpgrades: number
}) {
  const [hovered, setHovered] = useState(false)
  const hasActivity = openRequests > 0 || pendingUpgrades > 0

  return (
    <Link href={`/infrastructure/${clubId}`} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: T.colors.surface,
          border: `1px solid ${urgentRequests > 0 ? 'rgba(239,68,68,0.4)' : hovered ? T.colors.borderBright : T.colors.border}`,
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

        {hasActivity ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wrench size={12} color={T.colors.textMuted} />
              <span style={{ fontSize: '12px', color: T.colors.textSecondary }}>
                {openRequests} open request{openRequests === 1 ? '' : 's'}
              </span>
              {urgentRequests > 0 && (
                <span style={{ ...T.badge.red, padding: '2px 8px', borderRadius: T.radius.pill, fontSize: '10px', fontWeight: 700 }}>
                  {urgentRequests} urgent
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Hammer size={12} color={T.colors.textMuted} />
              <span style={{ fontSize: '12px', color: T.colors.textSecondary }}>
                {pendingUpgrades} upgrade{pendingUpgrades === 1 ? '' : 's'} pending
              </span>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: 0 }}>Clean queue</p>
        )}
      </div>
    </Link>
  )
}

export default function InfrastructureClient() {
  const [requests, setRequests] = useState<MaintenanceRequestRow[]>([])
  const [upgrades, setUpgrades] = useState<ClubUpgradeRow[]>([])
  const [clubs, setClubs] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const refresh = async () => {
    const [r, u, cl] = await Promise.allSettled([
      listMaintenanceRequests(), listClubUpgrades(), listActiveClubsForMaintenance(),
    ])
    if (r.status === 'fulfilled') setRequests(r.value)
    else console.error('listMaintenanceRequests failed:', r.reason)
    if (u.status === 'fulfilled') setUpgrades(u.value)
    else console.error('listClubUpgrades failed:', u.reason)
    if (cl.status === 'fulfilled') setClubs(cl.value)
    else console.error('listActiveClubsForMaintenance failed:', cl.reason)
    const failed = [r, u, cl].find(x => x.status === 'rejected') as PromiseRejectedResult | undefined
    setLoadError(failed ? (failed.reason?.message ?? 'Failed to load data — check console.') : null)
  }

  useEffect(() => { refresh().finally(() => setLoading(false)) }, [])

  const perClubStats = useMemo(() => {
    const map = new Map<string, { openRequests: number; urgentRequests: number; pendingUpgrades: number }>()
    for (const r of requests) {
      if (r.status === 'completed' || r.status === 'rejected') continue
      const s = map.get(r.club_id) ?? { openRequests: 0, urgentRequests: 0, pendingUpgrades: 0 }
      s.openRequests += 1
      if (r.priority === 'urgent') s.urgentRequests += 1
      map.set(r.club_id, s)
    }
    for (const u of upgrades) {
      if (u.status === 'complete' || u.status === 'declined') continue
      const s = map.get(u.club_id) ?? { openRequests: 0, urgentRequests: 0, pendingUpgrades: 0 }
      s.pendingUpgrades += 1
      map.set(u.club_id, s)
    }
    return map
  }, [requests, upgrades])

  const totalOpen = requests.filter(r => r.status !== 'completed' && r.status !== 'rejected').length
  const totalUrgent = requests.filter(r => r.priority === 'urgent' && r.status !== 'completed' && r.status !== 'rejected').length
  const totalUpgradesPending = upgrades.filter(u => u.status !== 'complete' && u.status !== 'declined').length
  const awaitingQuoteDecision = requests.filter(r =>
    r.status !== 'completed' && r.status !== 'rejected' && r.quotes?.length > 0 && !r.selected_quote_id
  ).length

  // Clubs sorted so anything with an urgent item floats to the top.
  const sortedClubs = useMemo(() => {
    return [...clubs].sort((a, b) => {
      const au = perClubStats.get(a.id)?.urgentRequests ?? 0
      const bu = perClubStats.get(b.id)?.urgentRequests ?? 0
      if (au !== bu) return bu - au
      return a.name.localeCompare(b.name)
    })
  }, [clubs, perClubStats])

  return (
    <div style={{ minHeight: '100vh', background: T.colors.bg }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: T.space.pagePadding }}>

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: T.colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
            Infrastructure
          </h1>
          <p style={{ fontSize: '13px', color: T.colors.textSecondary, marginTop: '5px' }}>
            Select a club to review its requests, upgrades, and quotes.
          </p>
        </div>

        {loadError && (
          <div style={{ ...T.card, borderColor: 'rgba(239,68,68,0.3)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={16} color={T.colors.red} />
            <span style={{ fontSize: '13px', color: T.colors.textSecondary }}>Couldn't load some data: {loadError}.</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <MiniStat label="Open Requests" value={loading ? '—' : totalOpen} />
          <MiniStat label="Urgent" value={loading ? '—' : totalUrgent} tone="red" />
          <MiniStat label="Awaiting Quote Decision" value={loading ? '—' : awaitingQuoteDecision} tone="amber" />
          <MiniStat label="Upgrades Pending" value={loading ? '—' : totalUpgradesPending} tone="green" />
        </div>

        {loading ? (
          <p style={{ fontSize: '13px', color: T.colors.textMuted }}>Loading clubs…</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
            {sortedClubs.map(c => {
              const s = perClubStats.get(c.id) ?? { openRequests: 0, urgentRequests: 0, pendingUpgrades: 0 }
              return (
                <ClubCard
                  key={c.id}
                  clubId={c.id}
                  name={c.name}
                  openRequests={s.openRequests}
                  urgentRequests={s.urgentRequests}
                  pendingUpgrades={s.pendingUpgrades}
                />
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}