'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Users, ChevronDown, ChevronUp, ChevronLeft, Calendar, AlertCircle,
  CheckCircle2, Building2, Plus, X, DollarSign,
} from 'lucide-react'
import { theme } from '../../components/theme'
import {
  listStaffForClub, listLeaveRequests, listHrIncidents, listStaffCompensation,
  createStaffMember, updateStaffStatus, decideLeaveRequest, updateIncidentStatus,
  upsertStaffCompensation,
  type StaffMemberRow, type LeaveRequestRow, type HrIncidentRow, type StaffCompensationRow,
} from '../../hr/actions'

const T = theme

const leaveStatusBadge: Record<string, keyof typeof T.badge> = {
  submitted: 'blue', approved: 'green', rejected: 'red', cancelled: 'muted',
}
const incidentStatusBadge: Record<string, keyof typeof T.badge> = {
  open: 'blue', under_review: 'amber', resolved: 'green', escalated: 'red',
}
const staffStatusBadge: Record<string, keyof typeof T.badge> = {
  active: 'green', on_leave: 'amber', suspended: 'red', terminated: 'muted',
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
    <div style={{ flex: 1, minWidth: '140px', background: T.colors.surface, border: `1px solid ${T.colors.border}`, borderRadius: T.radius.lg, padding: '18px 20px' }}>
      <p style={{ fontSize: '11px', color: T.colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>{label}</p>
      <p style={{ fontSize: '26px', fontWeight: 700, color, margin: 0, fontFamily: "'SF Mono', monospace", letterSpacing: '-0.02em' }}>{value}</p>
    </div>
  )
}

export default function ClubHrFinanceClient({ clubId }: { clubId: string }) {
  const isUnassigned = clubId === 'unassigned'
  const [open, setOpen] = useState({ leave: true, incidents: true, roster: true, comp: false })
  const [staff, setStaff] = useState<StaffMemberRow[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestRow[]>([])
  const [incidents, setIncidents] = useState<HrIncidentRow[]>([])
  const [compensation, setCompensation] = useState<StaffCompensationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showStaffForm, setShowStaffForm] = useState(false)
  const [leaveFilter, setLeaveFilter] = useState<'pending' | 'all'>('pending')
  const [incidentFilter, setIncidentFilter] = useState<'open' | 'all'>('open')

  const refresh = async () => {
    const [s, l, i, c] = await Promise.allSettled([
      listStaffForClub(), listLeaveRequests(), listHrIncidents(), listStaffCompensation(),
    ])
    let clubStaffIds: Set<string> = new Set()
    if (s.status === 'fulfilled') {
      const filtered = s.value.filter(x => isUnassigned ? x.club_id === null : x.club_id === clubId)
      setStaff(filtered)
      clubStaffIds = new Set(filtered.map(x => x.id))
    }
    if (l.status === 'fulfilled') setLeaveRequests(l.value.filter(x => x.club_id === clubId))
    if (i.status === 'fulfilled') setIncidents(i.value.filter(x => x.club_id === clubId))
    if (c.status === 'fulfilled') setCompensation(c.value.filter(x => clubStaffIds.has(x.staff_id)))
    const failed = [s, l, i, c].find(x => x.status === 'rejected') as PromiseRejectedResult | undefined
    setLoadError(failed ? (failed.reason?.message ?? 'Failed to load data — check console.') : null)
  }

  useEffect(() => { refresh().finally(() => setLoading(false)) }, [])
  const toggle = (id: keyof typeof open) => setOpen(prev => ({ ...prev, [id]: !prev[id] }))

  const clubName = isUnassigned ? 'Unassigned / HQ' : (staff[0]?.clubs?.name ?? 'This Club')

  const visibleLeave = useMemo(
    () => leaveFilter === 'pending' ? leaveRequests.filter(l => l.status === 'submitted') : leaveRequests,
    [leaveRequests, leaveFilter]
  )
  const visibleIncidents = useMemo(
    () => incidentFilter === 'open' ? incidents.filter(i => i.status === 'open' || i.status === 'under_review') : incidents,
    [incidents, incidentFilter]
  )

  const activeStaffCount = staff.filter(s => s.status !== 'terminated').length
  const pendingLeaveCount = leaveRequests.filter(l => l.status === 'submitted').length
  const openIncidentCount = incidents.filter(i => i.status === 'open' || i.status === 'under_review').length
  const compByStaffId = useMemo(() => new Map(compensation.map(c => [c.staff_id, c])), [compensation])

  async function handleCompChange(staffId: string, rate: string, frequency: string) {
    const parsed = parseFloat(rate)
    if (isNaN(parsed)) return
    await upsertStaffCompensation(staffId, parsed, frequency)
    refresh()
  }

  async function handleCreateStaff(formData: FormData) {
    await createStaffMember(formData)
    setShowStaffForm(false)
    refresh()
  }
  async function handleStaffStatus(id: string, status: string) {
    await updateStaffStatus(id, status)
    refresh()
  }
  async function handleLeaveDecision(id: string, status: 'approved' | 'rejected') {
    await decideLeaveRequest(id, status)
    refresh()
  }
  async function handleIncidentStatus(id: string, status: string) {
    await updateIncidentStatus(id, status)
    refresh()
  }

  return (
    <div style={{ minHeight: '100vh', background: T.colors.bg }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: T.space.pagePadding }}>

        <Link href="/hr-finance" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', color: T.colors.textSecondary, fontSize: '13px' }}>
            <ChevronLeft size={14} /> All Clubs
          </div>
        </Link>

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: T.colors.textPrimary, margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={22} color={T.colors.red} /> {clubName}
          </h1>
          <p style={{ fontSize: '13px', color: T.colors.textSecondary, marginTop: '5px' }}>
            Roster, leave, and incidents for this club only.
          </p>
        </div>

        {loadError && (
          <div style={{ ...T.card, borderColor: 'rgba(239,68,68,0.3)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={16} color={T.colors.red} />
            <span style={{ fontSize: '13px', color: T.colors.textSecondary }}>Couldn't load some data: {loadError}.</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <MiniStat label="Active Staff" value={loading ? '—' : activeStaffCount} />
          <MiniStat label="Pending Leave" value={loading ? '—' : pendingLeaveCount} tone="amber" />
          <MiniStat label="Open Incidents" value={loading ? '—' : openIncidentCount} tone="red" />
        </div>

        <Section title="Leave Approvals" open={open.leave} onToggle={() => toggle('leave')} badge={String(pendingLeaveCount)}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
            {(['pending', 'all'] as const).map(f => (
              <button key={f} onClick={() => setLeaveFilter(f)} style={T.periodBtn(leaveFilter === f)}>{label(f)}</button>
            ))}
          </div>
          {loading ? (
            <p style={{ fontSize: '13px', color: T.colors.textMuted }}>Loading…</p>
          ) : visibleLeave.length === 0 ? (
            <p style={{ fontSize: '13px', color: T.colors.textMuted }}>Nothing in this view.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {visibleLeave.map(l => (
                <div key={l.id} style={{ padding: '14px 16px', borderRadius: T.radius.md, background: T.colors.surfaceRaised, border: `1px solid ${T.colors.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={13} color={T.colors.textSecondary} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: T.colors.textPrimary }}>{l.staff_members?.full_name ?? 'Unknown'}</span>
                      <span style={{ fontSize: '11px', color: T.colors.textMuted }}>{label(l.leave_type)}</span>
                    </div>
                    <Badge text={l.status} variant={leaveStatusBadge[l.status] ?? 'muted'} />
                  </div>
                  <p style={{ fontSize: '11px', color: T.colors.textMuted, margin: '6px 0 0' }}>{l.start_date} → {l.end_date}</p>
                  {l.reason && <p style={{ fontSize: '12px', color: T.colors.textSecondary, margin: '6px 0 0' }}>{l.reason}</p>}
                  {l.status === 'submitted' && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                      <button onClick={() => handleLeaveDecision(l.id, 'approved')} style={{ ...T.btn.ghost, color: T.colors.green, borderColor: 'rgba(34,197,94,0.3)' }}>Approve</button>
                      <button onClick={() => handleLeaveDecision(l.id, 'rejected')} style={T.btn.ghost}>Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Incident Resolution" open={open.incidents} onToggle={() => toggle('incidents')} badge={String(openIncidentCount)}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
            {(['open', 'all'] as const).map(f => (
              <button key={f} onClick={() => setIncidentFilter(f)} style={T.periodBtn(incidentFilter === f)}>{label(f)}</button>
            ))}
          </div>
          {loading ? (
            <p style={{ fontSize: '13px', color: T.colors.textMuted }}>Loading…</p>
          ) : visibleIncidents.length === 0 ? (
            <p style={{ fontSize: '13px', color: T.colors.textMuted }}>Nothing in this view.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {visibleIncidents.map(i => (
                <div key={i.id} style={{ padding: '14px 16px', borderRadius: T.radius.md, background: T.colors.surfaceRaised, border: `1px solid ${T.colors.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: T.colors.textPrimary }}>
                      {i.staff_members?.full_name ?? 'Unknown'} — {label(i.category)}
                    </span>
                    <Badge text={i.status} variant={incidentStatusBadge[i.status] ?? 'muted'} />
                  </div>
                  <p style={{ fontSize: '12px', color: T.colors.textSecondary, margin: '6px 0 0' }}>{i.description}</p>
                  {(i.status === 'open' || i.status === 'under_review') && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                      {i.status === 'open' && <button onClick={() => handleIncidentStatus(i.id, 'under_review')} style={T.btn.ghost}>Mark Under Review</button>}
                      <button onClick={() => handleIncidentStatus(i.id, 'resolved')} style={{ ...T.btn.ghost, color: T.colors.green, borderColor: 'rgba(34,197,94,0.3)' }}>
                        <CheckCircle2 size={12} style={{ marginRight: '4px', verticalAlign: '-2px' }} /> Resolve
                      </button>
                      <button onClick={() => handleIncidentStatus(i.id, 'escalated')} style={{ ...T.btn.ghost, color: T.colors.red, borderColor: 'rgba(239,68,68,0.3)' }}>Escalate</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Staff Roster" open={open.roster} onToggle={() => toggle('roster')} badge={String(activeStaffCount)}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={() => setShowStaffForm(v => !v)} style={{ ...T.btn.primary, display: 'flex', alignItems: 'center', gap: '6px' }}>
              {showStaffForm ? <X size={14} /> : <Plus size={14} />}
              {showStaffForm ? 'Cancel' : 'Add Staff Member'}
            </button>
          </div>

          {showStaffForm && (
            <form action={handleCreateStaff} style={{ ...T.card, marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input type="hidden" name="clubId" value={isUnassigned ? '' : clubId} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input name="fullName" required placeholder="Full name" style={T.input} />
                <input name="roleTitle" required placeholder="Role title (e.g. Duty Manager)" style={T.input} />
              </div>
              <select name="employmentType" defaultValue="full_time" style={{ ...T.input, cursor: 'pointer' }}>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contractor">Contractor</option>
                <option value="ambassador">Ambassador</option>
              </select>
              <input name="startDate" type="date" style={T.input} />
              <textarea name="notes" placeholder="Notes (optional)" rows={2} style={{ ...T.input, resize: 'vertical' as const }} />
              <button type="submit" style={{ ...T.btn.primary, alignSelf: 'flex-start' }}>Add to Roster</button>
            </form>
          )}

          {loading ? (
            <p style={{ fontSize: '13px', color: T.colors.textMuted }}>Loading…</p>
          ) : staff.length === 0 ? (
            <p style={{ fontSize: '13px', color: T.colors.textMuted }}>No staff on record yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {staff.map(s => (
                <div key={s.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', borderRadius: T.radius.md, background: T.colors.surfaceRaised, border: `1px solid ${T.colors.border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Users size={14} color={T.colors.textSecondary} />
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: T.colors.textPrimary, margin: 0 }}>{s.full_name}</p>
                      <p style={{ fontSize: '11px', color: T.colors.textMuted, margin: '2px 0 0' }}>{s.role_title} · {label(s.employment_type)}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Badge text={s.status} variant={staffStatusBadge[s.status] ?? 'muted'} />
                    {s.status !== 'terminated' && (
                      <select
                        value={s.status}
                        onChange={(e) => handleStaffStatus(s.id, e.target.value)}
                        style={{ ...T.input, width: 'auto', fontSize: '11px', padding: '5px 8px', cursor: 'pointer' }}
                      >
                        <option value="active">Active</option>
                        <option value="on_leave">On Leave</option>
                        <option value="suspended">Suspended</option>
                        <option value="terminated">Terminated</option>
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Compensation" open={open.comp} onToggle={() => toggle('comp')}>
          <p style={{ fontSize: '11px', color: T.colors.textMuted, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <DollarSign size={12} /> Visible only here. Club managers never see this data, even for their own staff.
          </p>
          {loading ? (
            <p style={{ fontSize: '13px', color: T.colors.textMuted }}>Loading…</p>
          ) : staff.filter(s => s.status !== 'terminated').length === 0 ? (
            <p style={{ fontSize: '13px', color: T.colors.textMuted }}>No active staff to set rates for yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {staff.filter(s => s.status !== 'terminated').map(s => {
                const comp = compByStaffId.get(s.id)
                return (
                  <div key={s.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr 140px 130px', gap: '10px', alignItems: 'center',
                    padding: '10px 14px', borderRadius: T.radius.md, background: T.colors.surfaceRaised, border: `1px solid ${T.colors.border}`,
                  }}>
                    <span style={{ fontSize: '13px', color: T.colors.textPrimary, fontWeight: 600 }}>{s.full_name}</span>
                    <input
                      type="number" step="0.01" defaultValue={comp?.monthly_rate ?? ''}
                      placeholder="Monthly rate"
                      onBlur={(e) => handleCompChange(s.id, e.target.value, comp?.pay_frequency ?? 'monthly')}
                      style={{ ...T.input, fontSize: '12px', padding: '7px 10px' }}
                    />
                    <select
                      defaultValue={comp?.pay_frequency ?? 'monthly'}
                      onChange={(e) => handleCompChange(s.id, String(comp?.monthly_rate ?? 0), e.target.value)}
                      style={{ ...T.input, fontSize: '12px', padding: '7px 10px', cursor: 'pointer' }}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="weekly">Weekly</option>
                      <option value="per_session">Per Session</option>
                    </select>
                  </div>
                )
              })}
            </div>
          )}
        </Section>

      </div>
    </div>
  )
}