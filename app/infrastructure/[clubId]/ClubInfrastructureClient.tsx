'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, ChevronDown, ChevronUp, ChevronLeft, Building2, Hammer, Wrench,
  CheckCircle2, Clock, Download,
} from 'lucide-react'
import { theme } from '../../components/theme'
import {
  listMaintenanceRequests, listClubUpgrades,
  updateMaintenanceStatus, selectMaintenanceQuote,
  updateUpgradeStatus, selectUpgradeQuote,
  type MaintenanceRequestRow, type ClubUpgradeRow,
} from '../../maintenance/actions'
import { exportRowsToExcel, downloadBlob } from '@/lib/excel/exportRows'

const T = theme

const priorityBadge: Record<string, keyof typeof T.badge> = {
  urgent: 'red', high: 'amber', medium: 'blue', low: 'muted',
}
const requestStatusBadge: Record<string, keyof typeof T.badge> = {
  submitted: 'blue', under_review: 'amber', approved: 'purple',
  in_progress: 'amber', completed: 'green', rejected: 'red',
}
const upgradeStatusBadge: Record<string, keyof typeof T.badge> = {
  proposed: 'blue', approved: 'purple', in_progress: 'amber',
  complete: 'green', declined: 'red',
}
const label = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
const priorityRank: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

function Badge({ text, variant }: { text: string; variant: keyof typeof T.badge }) {
  return (
    <span style={{
      ...T.badge[variant], padding: '3px 9px', borderRadius: T.radius.pill,
      fontSize: '11px', fontWeight: 600, letterSpacing: '0.02em', whiteSpace: 'nowrap',
    }}>
      {label(text)}
    </span>
  )
}

function Section({ title, open, onToggle, badge, children }: {
  title: string; open: boolean; onToggle: () => void; badge?: string; children: React.ReactNode
}) {
  return (
    <div style={{ ...T.card, marginBottom: '16px', overflow: 'hidden', padding: 0 }}>
      <button onClick={onToggle} style={{
        width: '100%', padding: '18px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'none', border: 'none', cursor: 'pointer',
        borderBottom: open ? `1px solid ${T.colors.border}` : 'none',
        fontFamily: 'inherit',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: T.colors.textPrimary }}>{title}</span>
          {badge && (
            <span style={{
              fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px',
              background: T.colors.redGlow, color: T.colors.red,
              border: '1px solid rgba(224,10,9,0.2)', letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>{badge}</span>
          )}
        </div>
        {open ? <ChevronUp size={15} color={T.colors.textMuted} /> : <ChevronDown size={15} color={T.colors.textMuted} />}
      </button>
      {open && <div style={{ padding: '24px' }}>{children}</div>}
    </div>
  )
}

function MiniStat({ label, value, tone }: { label: string; value: number | string; tone?: 'red' | 'amber' | 'green' }) {
  const color = tone === 'red' ? T.colors.red : tone === 'amber' ? T.colors.amber : tone === 'green' ? T.colors.green : T.colors.textPrimary
  return (
    <div style={{ flex: 1, minWidth: '140px', background: T.colors.surface, border: `1px solid ${T.colors.border}`, borderRadius: T.radius.lg, padding: '18px 20px' }}>
      <p style={{ fontSize: '11px', color: T.colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>{label}</p>
      <p style={{ fontSize: '26px', fontWeight: 700, color, margin: 0, fontFamily: "'SF Mono', monospace", letterSpacing: '-0.02em' }}>{value}</p>
    </div>
  )
}

export default function ClubInfrastructureClient({ clubId }: { clubId: string }) {
  const [open, setOpen] = useState({ requests: true, upgrades: true })
  const [requests, setRequests] = useState<MaintenanceRequestRow[]>([])
  const [upgrades, setUpgrades] = useState<ClubUpgradeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [requestFilter, setRequestFilter] = useState<'needs_action' | 'all' | 'completed' | 'rejected'>('needs_action')
  const [upgradeFilter, setUpgradeFilter] = useState<'pending' | 'all' | 'complete' | 'declined'>('pending')

  const refresh = async () => {
    const [r, u] = await Promise.allSettled([listMaintenanceRequests(), listClubUpgrades()])
    if (r.status === 'fulfilled') setRequests(r.value.filter(x => x.club_id === clubId))
    else console.error('listMaintenanceRequests failed:', r.reason)
    if (u.status === 'fulfilled') setUpgrades(u.value.filter(x => x.club_id === clubId))
    else console.error('listClubUpgrades failed:', u.reason)
    const failed = [r, u].find(x => x.status === 'rejected') as PromiseRejectedResult | undefined
    setLoadError(failed ? (failed.reason?.message ?? 'Failed to load data — check console.') : null)
  }

  useEffect(() => { refresh().finally(() => setLoading(false)) }, [])

  const toggle = (id: keyof typeof open) => setOpen(prev => ({ ...prev, [id]: !prev[id] }))

  const clubName = requests[0]?.clubs?.name ?? upgrades[0]?.clubs?.name ?? 'This Club'

  const actionableRequests = useMemo(() => {
    return requests
      .filter(r => r.status !== 'completed' && r.status !== 'rejected')
      .sort((a, b) => {
        const pr = (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9)
        if (pr !== 0) return pr
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      })
  }, [requests])

  const visibleRequests = useMemo(() => {
    if (requestFilter === 'needs_action') return actionableRequests
    if (requestFilter === 'completed') return requests.filter(r => r.status === 'completed')
    if (requestFilter === 'rejected') return requests.filter(r => r.status === 'rejected')
    return [...requests].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [requests, requestFilter, actionableRequests])

  const upgradesQueue = useMemo(
    () => upgrades.filter(u => u.status !== 'complete' && u.status !== 'declined'),
    [upgrades]
  )

  const visibleUpgrades = useMemo(() => {
    if (upgradeFilter === 'pending') return upgradesQueue
    if (upgradeFilter === 'complete') return upgrades.filter(u => u.status === 'complete')
    if (upgradeFilter === 'declined') return upgrades.filter(u => u.status === 'declined')
    return [...upgrades].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [upgrades, upgradeFilter, upgradesQueue])

  const urgentCount = actionableRequests.filter(r => r.priority === 'urgent').length
  const awaitingQuoteDecision = actionableRequests.filter(r => r.quotes?.length > 0 && !r.selected_quote_id).length
  const upgradesAwaitingApproval = upgrades.filter(u => u.status === 'proposed').length

  async function handleStatus(id: string, status: string) {
    await updateMaintenanceStatus(id, status)
    refresh()
  }
  async function handleQuickApprove(id: string) {
    await updateMaintenanceStatus(id, 'completed')
    refresh()
  }
  async function handleSelectQuote(requestId: string, quoteId: string, amount: number) {
    await selectMaintenanceQuote(requestId, quoteId, amount)
    refresh()
  }
  async function handleUpgradeStatus(id: string, status: string) {
    await updateUpgradeStatus(id, status)
    refresh()
  }
  async function handleSelectUpgradeQuote(upgradeId: string, quoteId: string, amount: number) {
    await selectUpgradeQuote(upgradeId, quoteId, amount)
    refresh()
  }

  async function handleExportRequests() {
    const blob = await exportRowsToExcel({
      title: `MAINTENANCE REQUESTS — ${clubName.toUpperCase()}`,
      subtitle: `${label(requestFilter)} · Generated ${new Date().toLocaleDateString('en-ZA')}`,
      columns: [
        { key: 'title', header: 'Title', width: 30 },
        { key: 'category', header: 'Category', width: 18 },
        { key: 'priority', header: 'Priority', width: 12 },
        { key: 'status', header: 'Status', width: 16 },
        { key: 'estimatedCost', header: 'Est. Cost', width: 14, numFmt: 'R #,##0.00' },
        { key: 'created', header: 'Submitted', width: 14, numFmt: 'dd/mm/yyyy' },
        { key: 'completed', header: 'Completed', width: 14, numFmt: 'dd/mm/yyyy' },
        { key: 'description', header: 'Description', width: 40 },
      ],
      rows: visibleRequests.map(r => ({
        title: r.title,
        category: label(r.category),
        priority: label(r.priority),
        status: label(r.status),
        estimatedCost: r.estimated_cost ?? '',
        created: new Date(r.created_at),
        completed: r.completed_at ? new Date(r.completed_at) : '',
        description: r.description ?? '',
      })),
    })
    downloadBlob(blob, `maintenance-requests-${clubName.toLowerCase().replace(/\s+/g, '-')}.xlsx`)
  }

  return (
    <div style={{ minHeight: '100vh', background: T.colors.bg }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: T.space.pagePadding }}>

        <Link href="/infrastructure" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', color: T.colors.textSecondary, fontSize: '13px' }}>
            <ChevronLeft size={14} /> All Clubs
          </div>
        </Link>

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: T.colors.textPrimary, margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={22} color={T.colors.red} /> {clubName}
          </h1>
          <p style={{ fontSize: '13px', color: T.colors.textSecondary, marginTop: '5px' }}>
            Maintenance requests and upgrades for this club only.
          </p>
        </div>

        {loadError && (
          <div style={{ ...T.card, borderColor: 'rgba(239,68,68,0.3)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={16} color={T.colors.red} />
            <span style={{ fontSize: '13px', color: T.colors.textSecondary }}>Couldn't load some data: {loadError}.</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <MiniStat label="Needs Action" value={loading ? '—' : actionableRequests.length} />
          <MiniStat label="Urgent" value={loading ? '—' : urgentCount} tone="red" />
          <MiniStat label="Awaiting Quote Decision" value={loading ? '—' : awaitingQuoteDecision} tone="amber" />
          <MiniStat label="Upgrades to Approve" value={loading ? '—' : upgradesAwaitingApproval} tone="green" />
        </div>

        <Section title="Maintenance Requests" open={open.requests} onToggle={() => toggle('requests')} badge={String(actionableRequests.length)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['needs_action', 'all', 'completed', 'rejected'] as const).map(f => (
                <button key={f} onClick={() => setRequestFilter(f)} style={T.periodBtn(requestFilter === f)}>
                  {f === 'needs_action' ? 'Needs Action' : label(f)}
                </button>
              ))}
            </div>
            <button
              onClick={handleExportRequests}
              disabled={visibleRequests.length === 0}
              style={{
                ...T.btn.secondary, display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', fontSize: '12px',
                opacity: visibleRequests.length === 0 ? 0.5 : 1,
                cursor: visibleRequests.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              <Download size={13} /> Export to Excel
            </button>
          </div>

          {loading ? (
            <p style={{ fontSize: '13px', color: T.colors.textMuted }}>Loading…</p>
          ) : visibleRequests.length === 0 ? (
            <p style={{ fontSize: '13px', color: T.colors.textMuted }}>Nothing in this view.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {visibleRequests.map(r => (
                <div key={r.id} style={{
                  background: T.colors.surfaceRaised,
                  border: `1px solid ${r.priority === 'urgent' && r.status !== 'completed' && r.status !== 'rejected' ? 'rgba(239,68,68,0.35)' : T.colors.border}`,
                  borderRadius: T.radius.md, padding: '18px 20px',
                  opacity: r.status === 'completed' || r.status === 'rejected' ? 0.75 : 1,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Wrench size={14} color={T.colors.textSecondary} />
                      <span style={{ fontSize: '14px', fontWeight: 600, color: T.colors.textPrimary }}>{r.title}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Badge text={r.priority} variant={priorityBadge[r.priority] ?? 'muted'} />
                      <Badge text={r.status} variant={requestStatusBadge[r.status] ?? 'muted'} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '14px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', color: T.colors.textMuted }}>{label(r.category)}</span>
                    <span style={{ fontSize: '11px', color: T.colors.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} /> {new Date(r.created_at).toLocaleDateString('en-ZA')}
                    </span>
                    {r.completed_at && (
                      <span style={{ fontSize: '11px', color: T.colors.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={11} /> Completed {new Date(r.completed_at).toLocaleDateString('en-ZA')}
                      </span>
                    )}
                  </div>

                  {r.description && (
                    <p style={{ fontSize: '12px', color: T.colors.textSecondary, margin: '8px 0 0' }}>{r.description}</p>
                  )}

                  {r.quotes && r.quotes.length > 0 && (
                    <div style={{ marginTop: '14px' }}>
                      <p style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
                        Quotes ({r.quotes.length})
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {[...r.quotes].sort((a, b) => a.amount - b.amount).map(q => {
                          const isSelected = q.id === r.selected_quote_id
                          return (
                            <div key={q.id} style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '10px 14px', borderRadius: T.radius.sm,
                              background: isSelected ? T.colors.greenGlow : T.colors.bg,
                              border: `1px solid ${isSelected ? 'rgba(34,197,94,0.3)' : T.colors.border}`,
                            }}>
                              <div>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: T.colors.textPrimary }}>{q.vendorName}</span>
                                {q.notes && <span style={{ fontSize: '11px', color: T.colors.textMuted, marginLeft: '10px' }}>{q.notes}</span>}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '13px', fontFamily: "'SF Mono', monospace", fontWeight: 700, color: T.colors.textPrimary }}>
                                  R {q.amount.toLocaleString()}
                                </span>
                                {isSelected ? (
                                  <span style={{ fontSize: '11px', color: T.colors.green, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <CheckCircle2 size={12} /> Selected
                                  </span>
                                ) : r.status !== 'completed' && r.status !== 'rejected' ? (
                                  <button onClick={() => handleSelectQuote(r.id, q.id, q.amount)} style={{ ...T.btn.ghost, padding: '5px 12px' }}>
                                    Select
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {r.status !== 'completed' && r.status !== 'rejected' && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <button
                        onClick={() => handleQuickApprove(r.id)}
                        style={{ ...T.btn.primary, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <CheckCircle2 size={13} /> Quick Approve
                      </button>
                      <span style={{ fontSize: '10px', color: T.colors.textMuted }}>— for simple sign-offs, no workflow needed</span>

                      <span style={{ width: '1px', height: '18px', background: T.colors.border, margin: '0 4px' }} />

                      {r.status === 'submitted' && (
                        <>
                          <button onClick={() => handleStatus(r.id, 'under_review')} style={T.btn.ghost}>Mark Under Review</button>
                          <button onClick={() => handleStatus(r.id, 'rejected')} style={T.btn.ghost}>Reject</button>
                        </>
                      )}
                      {r.status === 'under_review' && !r.selected_quote_id && (
                        <button onClick={() => handleStatus(r.id, 'approved')} style={T.btn.ghost}>Approve Without Quote</button>
                      )}
                      {r.status === 'approved' && (
                        <button onClick={() => handleStatus(r.id, 'in_progress')} style={T.btn.ghost}>Start Work</button>
                      )}
                      {r.status === 'in_progress' && (
                        <button onClick={() => handleStatus(r.id, 'completed')} style={{ ...T.btn.ghost, color: T.colors.green, borderColor: 'rgba(34,197,94,0.3)' }}>
                          Mark Complete
                        </button>
                      )}
                    </div>
                  )}

                  {r.status === 'rejected' && r.resolution_note && (
                    <p style={{ fontSize: '11px', color: T.colors.textMuted, marginTop: '10px' }}>Reason: {r.resolution_note}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Club Upgrades — Approval Queue" open={open.upgrades} onToggle={() => toggle('upgrades')} badge={String(upgradesAwaitingApproval)}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
            {(['pending', 'all', 'complete', 'declined'] as const).map(f => (
              <button key={f} onClick={() => setUpgradeFilter(f)} style={T.periodBtn(upgradeFilter === f)}>
                {label(f)}
              </button>
            ))}
          </div>

          {loading ? (
            <p style={{ fontSize: '13px', color: T.colors.textMuted }}>Loading…</p>
          ) : visibleUpgrades.length === 0 ? (
            <p style={{ fontSize: '13px', color: T.colors.textMuted }}>Nothing in this view.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {visibleUpgrades.map(u => (
                <div key={u.id} style={{
                  background: T.colors.surfaceRaised, border: `1px solid ${T.colors.border}`,
                  borderRadius: T.radius.md, padding: '16px 18px',
                  opacity: u.status === 'complete' || u.status === 'declined' ? 0.75 : 1,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Hammer size={14} color={T.colors.textSecondary} />
                      <span style={{ fontSize: '14px', fontWeight: 600, color: T.colors.textPrimary }}>{u.title}</span>
                    </div>
                    <Badge text={u.status} variant={upgradeStatusBadge[u.status] ?? 'muted'} />
                  </div>
                  <div style={{ display: 'flex', gap: '14px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', color: T.colors.textMuted }}>{label(u.category)}</span>
                    {u.estimated_cost != null && (
                      <span style={{ fontSize: '11px', color: T.colors.textMuted, fontFamily: "'SF Mono', monospace" }}>
                        Est. R {u.estimated_cost.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {u.description && <p style={{ fontSize: '12px', color: T.colors.textSecondary, margin: '8px 0 0' }}>{u.description}</p>}

                  {u.quotes && u.quotes.length > 0 && (
                    <div style={{ marginTop: '14px' }}>
                      <p style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
                        Quotes ({u.quotes.length})
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {[...u.quotes].sort((a, b) => a.amount - b.amount).map(q => {
                          const isSelected = q.id === u.selected_quote_id
                          return (
                            <div key={q.id} style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '10px 14px', borderRadius: T.radius.sm,
                              background: isSelected ? T.colors.greenGlow : T.colors.bg,
                              border: `1px solid ${isSelected ? 'rgba(34,197,94,0.3)' : T.colors.border}`,
                            }}>
                              <div>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: T.colors.textPrimary }}>{q.vendorName}</span>
                                {q.notes && <span style={{ fontSize: '11px', color: T.colors.textMuted, marginLeft: '10px' }}>{q.notes}</span>}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '13px', fontFamily: "'SF Mono', monospace", fontWeight: 700, color: T.colors.textPrimary }}>
                                  R {q.amount.toLocaleString()}
                                </span>
                                {isSelected ? (
                                  <span style={{ fontSize: '11px', color: T.colors.green, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <CheckCircle2 size={12} /> Selected
                                  </span>
                                ) : u.status !== 'complete' && u.status !== 'declined' ? (
                                  <button onClick={() => handleSelectUpgradeQuote(u.id, q.id, q.amount)} style={{ ...T.btn.ghost, padding: '5px 12px' }}>
                                    Select
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {u.status !== 'complete' && u.status !== 'declined' && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                      {u.status === 'proposed' && (
                        <>
                          <button onClick={() => handleUpgradeStatus(u.id, 'approved')} style={T.btn.ghost}>Approve</button>
                          <button onClick={() => handleUpgradeStatus(u.id, 'declined')} style={T.btn.ghost}>Decline</button>
                        </>
                      )}
                      {u.status === 'approved' && (
                        <button onClick={() => handleUpgradeStatus(u.id, 'in_progress')} style={T.btn.ghost}>Start Work</button>
                      )}
                      {u.status === 'in_progress' && (
                        <button onClick={() => handleUpgradeStatus(u.id, 'complete')} style={{ ...T.btn.ghost, color: T.colors.green, borderColor: 'rgba(34,197,94,0.3)' }}>
                          <CheckCircle2 size={12} style={{ marginRight: '4px', verticalAlign: '-2px' }} /> Mark Complete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

      </div>
    </div>
  )
}