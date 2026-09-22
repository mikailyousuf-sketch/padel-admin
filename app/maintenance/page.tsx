'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Wrench, AlertTriangle, ChevronDown, ChevronUp, Plus, X,
  Clock, CheckCircle2, Building2, Hammer,
} from 'lucide-react'
import { theme } from '../components/theme'
import {
  listMaintenanceRequests, listClubUpgrades, listActiveClubsForMaintenance,
  createMaintenanceRequest, createClubUpgrade, addMaintenanceQuote, addClubUpgradeQuote,
  type MaintenanceRequestRow, type ClubUpgradeRow,
} from './actions'

const T = theme

// ── Badge helpers ─────────────────────────────────────────────────────────────
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
    <div style={{
      flex: 1, minWidth: '140px', background: T.colors.surface, border: `1px solid ${T.colors.border}`,
      borderRadius: T.radius.lg, padding: '18px 20px',
    }}>
      <p style={{ fontSize: '11px', color: T.colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>{label}</p>
      <p style={{ fontSize: '26px', fontWeight: 700, color, margin: 0, fontFamily: "'SF Mono', monospace", letterSpacing: '-0.02em' }}>{value}</p>
    </div>
  )
}

const REQUEST_FILTERS = ['all', 'open', 'in_progress', 'completed'] as const
type RequestFilter = typeof REQUEST_FILTERS[number]

export default function MaintenancePage() {
  const [open, setOpen] = useState({ requests: true, upgrades: true })
  const [requests, setRequests] = useState<MaintenanceRequestRow[]>([])
  const [upgrades, setUpgrades] = useState<ClubUpgradeRow[]>([])
  const [clubs, setClubs] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<RequestFilter>('open')
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [showUpgradeForm, setShowUpgradeForm] = useState(false)

  const [loadError, setLoadError] = useState<string | null>(null)

  const refresh = async () => {
    const [r, u, c] = await Promise.allSettled([
      listMaintenanceRequests(), listClubUpgrades(), listActiveClubsForMaintenance(),
    ])
    if (r.status === 'fulfilled') setRequests(r.value)
    else console.error('listMaintenanceRequests failed:', r.reason)

    if (u.status === 'fulfilled') setUpgrades(u.value)
    else console.error('listClubUpgrades failed:', u.reason)

    if (c.status === 'fulfilled') setClubs(c.value)
    else console.error('listActiveClubsForMaintenance failed:', c.reason)

    const firstError = [r, u, c].find(x => x.status === 'rejected') as PromiseRejectedResult | undefined
    setLoadError(firstError ? (firstError.reason?.message ?? 'Failed to load data — check console.') : null)

    if (c.status === 'fulfilled' && c.value.length === 0) {
      console.warn('No clubs returned. Check: (1) profiles.is_hoo for this user, (2) club_assignments rows, (3) clubs.is_active flags.')
    }
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [])

  const toggle = (id: keyof typeof open) => setOpen(prev => ({ ...prev, [id]: !prev[id] }))

  const filteredRequests = useMemo(() => {
    if (filter === 'all') return requests
    if (filter === 'open') return requests.filter(r => ['submitted', 'under_review', 'approved'].includes(r.status))
    if (filter === 'in_progress') return requests.filter(r => r.status === 'in_progress')
    return requests.filter(r => r.status === 'completed')
  }, [requests, filter])

  const openCount = requests.filter(r => ['submitted', 'under_review', 'approved'].includes(r.status)).length
  const urgentCount = requests.filter(r => r.priority === 'urgent' && r.status !== 'completed' && r.status !== 'rejected').length
  const inProgressCount = requests.filter(r => r.status === 'in_progress').length
  const upgradesPending = upgrades.filter(u => u.status === 'proposed' || u.status === 'approved' || u.status === 'in_progress').length

  async function handleCreateRequest(formData: FormData) {
    await createMaintenanceRequest(formData)
    setShowRequestForm(false)
    refresh()
  }

  async function handleCreateUpgrade(formData: FormData) {
    await createClubUpgrade(formData)
    setShowUpgradeForm(false)
    refresh()
  }

  const [quoteFormFor, setQuoteFormFor] = useState<string | null>(null)
  const [upgradeQuoteFormFor, setUpgradeQuoteFormFor] = useState<string | null>(null)

  async function handleAddQuote(id: string, formData: FormData) {
    await addMaintenanceQuote(id, {
      vendorName: formData.get('vendorName') as string,
      amount: parseFloat(formData.get('amount') as string) || 0,
      notes: (formData.get('notes') as string) || '',
    })
    setQuoteFormFor(null)
    refresh()
  }

  async function handleAddUpgradeQuote(id: string, formData: FormData) {
    await addClubUpgradeQuote(id, {
      vendorName: formData.get('vendorName') as string,
      amount: parseFloat(formData.get('amount') as string) || 0,
      notes: (formData.get('notes') as string) || '',
    })
    setUpgradeQuoteFormFor(null)
    refresh()
  }

  return (
    <div style={{ minHeight: '100vh', background: T.colors.bg }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: T.space.pagePadding }}>

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: T.colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
            Maintenance & Infrastructure
          </h1>
          <p style={{ fontSize: '13px', color: T.colors.textSecondary, marginTop: '5px' }}>
            Submit and track requests for your club. Sim reviews and approves on the Infrastructure dashboard.
          </p>
        </div>

        {loadError && (
          <div style={{
            ...T.card, borderColor: 'rgba(239,68,68,0.3)', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <AlertTriangle size={16} color={T.colors.red} />
            <span style={{ fontSize: '13px', color: T.colors.textSecondary }}>
              Couldn't load some data: {loadError}. Check the browser console for details.
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <MiniStat label="Open Requests" value={loading ? '—' : openCount} />
          <MiniStat label="Urgent" value={loading ? '—' : urgentCount} tone="red" />
          <MiniStat label="In Progress" value={loading ? '—' : inProgressCount} tone="amber" />
          <MiniStat label="Upgrades Pending" value={loading ? '—' : upgradesPending} tone="green" />
        </div>

        {/* ── Maintenance Requests ─────────────────────────────────────────── */}
        <Section title="Maintenance Requests" open={open.requests} onToggle={() => toggle('requests')} badge={String(openCount)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {REQUEST_FILTERS.map(f => (
                <button key={f} onClick={() => setFilter(f)} style={T.periodBtn(filter === f)}>
                  {f === 'all' ? 'All' : label(f)}
                </button>
              ))}
            </div>
            <button onClick={() => setShowRequestForm(v => !v)} style={{ ...T.btn.primary, display: 'flex', alignItems: 'center', gap: '6px' }}>
              {showRequestForm ? <X size={14} /> : <Plus size={14} />}
              {showRequestForm ? 'Cancel' : 'New Request'}
            </button>
          </div>

          {showRequestForm && (
            <form action={handleCreateRequest} style={{ ...T.card, marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <select name="clubId" required style={{ ...T.input, cursor: 'pointer' }}>
                  <option value="">Select club…</option>
                  {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select name="category" required style={{ ...T.input, cursor: 'pointer' }}>
                  <option value="court_resurfacing">Court Resurfacing</option>
                  <option value="equipment_repair">Equipment Repair</option>
                  <option value="facility_issue">Facility Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <input name="title" required placeholder="Short title (e.g. Court 3 net damaged)" style={T.input} />
              <textarea name="description" placeholder="Describe the issue…" rows={3} style={{ ...T.input, resize: 'vertical' as const }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <select name="priority" defaultValue="medium" style={{ ...T.input, cursor: 'pointer' }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <input name="estimatedCost" type="number" step="0.01" placeholder="Estimated cost (optional)" style={T.input} />
              </div>
              <button type="submit" style={{ ...T.btn.primary, alignSelf: 'flex-start' }}>Submit Request</button>
            </form>
          )}

          {loading ? (
            <p style={{ fontSize: '13px', color: T.colors.textMuted }}>Loading…</p>
          ) : filteredRequests.length === 0 ? (
            <p style={{ fontSize: '13px', color: T.colors.textMuted }}>No requests in this view.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredRequests.map(r => (
                <div key={r.id} style={{
                  background: T.colors.surfaceRaised, border: `1px solid ${T.colors.border}`,
                  borderRadius: T.radius.md, padding: '16px 18px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Wrench size={14} color={T.colors.textSecondary} />
                      <span style={{ fontSize: '14px', fontWeight: 600, color: T.colors.textPrimary }}>{r.title}</span>
                      {r.priority === 'urgent' && <AlertTriangle size={13} color={T.colors.red} />}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Badge text={r.priority} variant={priorityBadge[r.priority] ?? 'muted'} />
                      <Badge text={r.status} variant={requestStatusBadge[r.status] ?? 'muted'} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '14px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', color: T.colors.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Building2 size={11} /> {r.clubs?.name ?? '—'}
                    </span>
                    <span style={{ fontSize: '11px', color: T.colors.textMuted }}>{label(r.category)}</span>
                    {r.estimated_cost != null && (
                      <span style={{ fontSize: '11px', color: T.colors.textMuted, fontFamily: "'SF Mono', monospace" }}>
                        Est. R {r.estimated_cost.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {r.description && (
                    <p style={{ fontSize: '12px', color: T.colors.textSecondary, margin: '8px 0 0' }}>{r.description}</p>
                  )}

                  {/* Quotes — vendor options logged against this request */}
                  {r.quotes && r.quotes.length > 0 && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {r.quotes.map(q => (
                        <div key={q.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '8px 12px', borderRadius: T.radius.sm,
                          background: q.id === r.selected_quote_id ? T.colors.greenGlow : T.colors.bg,
                          border: `1px solid ${q.id === r.selected_quote_id ? 'rgba(34,197,94,0.3)' : T.colors.border}`,
                        }}>
                          <div>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: T.colors.textPrimary }}>{q.vendorName}</span>
                            {q.notes && <span style={{ fontSize: '11px', color: T.colors.textMuted, marginLeft: '8px' }}>{q.notes}</span>}
                          </div>
                          <span style={{ fontSize: '12px', fontFamily: "'SF Mono', monospace", color: q.id === r.selected_quote_id ? T.colors.green : T.colors.textSecondary, fontWeight: 600 }}>
                            R {q.amount.toLocaleString()}{q.id === r.selected_quote_id ? ' ✓ selected' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {(r.status === 'submitted' || r.status === 'under_review') && (
                    <div style={{ marginTop: '10px' }}>
                      {quoteFormFor === r.id ? (
                        <form action={(fd) => handleAddQuote(r.id, fd)} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr auto', gap: '6px', alignItems: 'center' }}>
                          <input name="vendorName" required placeholder="Vendor / supplier name" style={{ ...T.input, fontSize: '12px', padding: '8px 10px' }} />
                          <input name="amount" type="number" step="0.01" required placeholder="Amount" style={{ ...T.input, fontSize: '12px', padding: '8px 10px' }} />
                          <input name="notes" placeholder="Notes (optional)" style={{ ...T.input, fontSize: '12px', padding: '8px 10px' }} />
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button type="submit" style={{ ...T.btn.ghost, padding: '8px 12px' }}>Add</button>
                            <button type="button" onClick={() => setQuoteFormFor(null)} style={{ ...T.btn.ghost, padding: '8px 10px' }}><X size={12} /></button>
                          </div>
                        </form>
                      ) : (
                        <button onClick={() => setQuoteFormFor(r.id)} style={T.btn.ghost}>+ Add Quote</button>
                      )}
                    </div>
                  )}

                  {/* No status controls here — approval/progress is Sim's call on Infrastructure */}
                  {r.status === 'submitted' && (
                    <p style={{ fontSize: '11px', color: T.colors.textMuted, marginTop: '10px' }}>Awaiting Sim's review.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── Club Upgrades ────────────────────────────────────────────────── */}
        <Section title="Club Upgrade Tracker" open={open.upgrades} onToggle={() => toggle('upgrades')} badge={String(upgradesPending)}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={() => setShowUpgradeForm(v => !v)} style={{ ...T.btn.secondary, display: 'flex', alignItems: 'center', gap: '6px' }}>
              {showUpgradeForm ? <X size={14} /> : <Plus size={14} />}
              {showUpgradeForm ? 'Cancel' : 'Propose Upgrade'}
            </button>
          </div>

          {showUpgradeForm && (
            <form action={handleCreateUpgrade} style={{ ...T.card, marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <select name="clubId" required style={{ ...T.input, cursor: 'pointer' }}>
                  <option value="">Select club…</option>
                  {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select name="category" defaultValue="other" style={{ ...T.input, cursor: 'pointer' }}>
                  <option value="court">Court</option>
                  <option value="facility">Facility</option>
                  <option value="equipment">Equipment</option>
                  <option value="technology">Technology</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <input name="title" required placeholder="Upgrade title (e.g. New floodlights, Court 1–4)" style={T.input} />
              <textarea name="description" placeholder="Details, rationale…" rows={3} style={{ ...T.input, resize: 'vertical' as const }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input name="estimatedCost" type="number" step="0.01" placeholder="Estimated cost" style={T.input} />
                <input name="targetDate" type="date" style={T.input} />
              </div>
              <button type="submit" style={{ ...T.btn.primary, alignSelf: 'flex-start' }}>Propose</button>
            </form>
          )}

          {loading ? (
            <p style={{ fontSize: '13px', color: T.colors.textMuted }}>Loading…</p>
          ) : upgrades.length === 0 ? (
            <p style={{ fontSize: '13px', color: T.colors.textMuted }}>No upgrades proposed yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {upgrades.map(u => (
                <div key={u.id} style={{
                  background: T.colors.surfaceRaised, border: `1px solid ${T.colors.border}`,
                  borderRadius: T.radius.md, padding: '16px 18px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Hammer size={14} color={T.colors.textSecondary} />
                      <span style={{ fontSize: '14px', fontWeight: 600, color: T.colors.textPrimary }}>{u.title}</span>
                    </div>
                    <Badge text={u.status} variant={upgradeStatusBadge[u.status] ?? 'muted'} />
                  </div>
                  <div style={{ display: 'flex', gap: '14px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', color: T.colors.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Building2 size={11} /> {u.clubs?.name ?? '—'}
                    </span>
                    <span style={{ fontSize: '11px', color: T.colors.textMuted }}>{label(u.category)}</span>
                    {u.estimated_cost != null && (
                      <span style={{ fontSize: '11px', color: T.colors.textMuted, fontFamily: "'SF Mono', monospace" }}>
                        Est. R {u.estimated_cost.toLocaleString()}
                      </span>
                    )}
                    {u.target_date && (
                      <span style={{ fontSize: '11px', color: T.colors.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} /> Target {u.target_date}
                      </span>
                    )}
                  </div>
                  {u.description && (
                    <p style={{ fontSize: '12px', color: T.colors.textSecondary, margin: '8px 0 0' }}>{u.description}</p>
                  )}

                  {/* Quotes — vendor options logged against this upgrade */}
                  {u.quotes && u.quotes.length > 0 && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {u.quotes.map(q => (
                        <div key={q.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '8px 12px', borderRadius: T.radius.sm,
                          background: q.id === u.selected_quote_id ? T.colors.greenGlow : T.colors.bg,
                          border: `1px solid ${q.id === u.selected_quote_id ? 'rgba(34,197,94,0.3)' : T.colors.border}`,
                        }}>
                          <div>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: T.colors.textPrimary }}>{q.vendorName}</span>
                            {q.notes && <span style={{ fontSize: '11px', color: T.colors.textMuted, marginLeft: '8px' }}>{q.notes}</span>}
                          </div>
                          <span style={{ fontSize: '12px', fontFamily: "'SF Mono', monospace", color: q.id === u.selected_quote_id ? T.colors.green : T.colors.textSecondary, fontWeight: 600 }}>
                            R {q.amount.toLocaleString()}{q.id === u.selected_quote_id ? ' ✓ selected' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {u.status === 'proposed' && (
                    <div style={{ marginTop: '10px' }}>
                      {upgradeQuoteFormFor === u.id ? (
                        <form action={(fd) => handleAddUpgradeQuote(u.id, fd)} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr auto', gap: '6px', alignItems: 'center' }}>
                          <input name="vendorName" required placeholder="Vendor / supplier name" style={{ ...T.input, fontSize: '12px', padding: '8px 10px' }} />
                          <input name="amount" type="number" step="0.01" required placeholder="Amount" style={{ ...T.input, fontSize: '12px', padding: '8px 10px' }} />
                          <input name="notes" placeholder="Notes (optional)" style={{ ...T.input, fontSize: '12px', padding: '8px 10px' }} />
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button type="submit" style={{ ...T.btn.ghost, padding: '8px 12px' }}>Add</button>
                            <button type="button" onClick={() => setUpgradeQuoteFormFor(null)} style={{ ...T.btn.ghost, padding: '8px 10px' }}><X size={12} /></button>
                          </div>
                        </form>
                      ) : (
                        <button onClick={() => setUpgradeQuoteFormFor(u.id)} style={T.btn.ghost}>+ Add Quote</button>
                      )}
                    </div>
                  )}

                  {/* No approval controls here — Sim decides on Infrastructure */}
                  {u.status === 'proposed' && (
                    <p style={{ fontSize: '11px', color: T.colors.textMuted, marginTop: '10px' }}>Awaiting Sim's review.</p>
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