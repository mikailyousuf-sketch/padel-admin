'use client'

import { useState, useEffect } from 'react'
import {
  Users, ChevronDown, ChevronUp, Plus, X, Calendar, AlertCircle,
} from 'lucide-react'
import { theme } from '../components/theme'
import {
  listStaffForClub, listLeaveRequests, listHrIncidents,
  createLeaveRequest, createHrIncident,
  type StaffMemberRow, type LeaveRequestRow, type HrIncidentRow,
} from './actions'

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

export default function HrPage() {
  const [open, setOpen] = useState({ roster: true, leave: true, incidents: true })
  const [staff, setStaff] = useState<StaffMemberRow[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestRow[]>([])
  const [incidents, setIncidents] = useState<HrIncidentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showLeaveForm, setShowLeaveForm] = useState(false)
  const [showIncidentForm, setShowIncidentForm] = useState(false)

  const refresh = async () => {
    const [s, l, i] = await Promise.allSettled([listStaffForClub(), listLeaveRequests(), listHrIncidents()])
    if (s.status === 'fulfilled') setStaff(s.value)
    else console.error('listStaffForClub failed:', s.reason)
    if (l.status === 'fulfilled') setLeaveRequests(l.value)
    else console.error('listLeaveRequests failed:', l.reason)
    if (i.status === 'fulfilled') setIncidents(i.value)
    else console.error('listHrIncidents failed:', i.reason)

    const failed = [s, l, i].find(x => x.status === 'rejected') as PromiseRejectedResult | undefined
    setLoadError(failed ? (failed.reason?.message ?? 'Failed to load data — check console.') : null)
  }

  useEffect(() => { refresh().finally(() => setLoading(false)) }, [])

  const toggle = (id: keyof typeof open) => setOpen(prev => ({ ...prev, [id]: !prev[id] }))

  async function handleCreateLeave(formData: FormData) {
    await createLeaveRequest(formData)
    setShowLeaveForm(false)
    refresh()
  }
  async function handleCreateIncident(formData: FormData) {
    await createHrIncident(formData)
    setShowIncidentForm(false)
    refresh()
  }

  const activeStaff = staff.filter(s => s.status !== 'terminated')
  const pendingLeave = leaveRequests.filter(l => l.status === 'submitted').length
  const openIncidents = incidents.filter(i => i.status === 'open' || i.status === 'under_review').length

  return (
    <div style={{ minHeight: '100vh', background: T.colors.bg }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: T.space.pagePadding }}>

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: T.colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
            HR
          </h1>
          <p style={{ fontSize: '13px', color: T.colors.textSecondary, marginTop: '5px' }}>
            Your club's roster, leave requests, and incident log. Jade reviews and decides on the HR & Finance dashboard.
          </p>
        </div>

        {loadError && (
          <div style={{ ...T.card, borderColor: 'rgba(239,68,68,0.3)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={16} color={T.colors.red} />
            <span style={{ fontSize: '13px', color: T.colors.textSecondary }}>Couldn't load some data: {loadError}.</span>
          </div>
        )}

        <Section title="Staff Roster" open={open.roster} onToggle={() => toggle('roster')} badge={String(activeStaff.length)}>
          {loading ? (
            <p style={{ fontSize: '13px', color: T.colors.textMuted }}>Loading…</p>
          ) : activeStaff.length === 0 ? (
            <p style={{ fontSize: '13px', color: T.colors.textMuted }}>
              No staff on record for your club yet — ask Jade to add roster entries on the HR & Finance dashboard.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeStaff.map(s => (
                <div key={s.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', borderRadius: T.radius.md,
                  background: T.colors.surfaceRaised, border: `1px solid ${T.colors.border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Users size={14} color={T.colors.textSecondary} />
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: T.colors.textPrimary, margin: 0 }}>{s.full_name}</p>
                      <p style={{ fontSize: '11px', color: T.colors.textMuted, margin: '2px 0 0' }}>{s.role_title} · {label(s.employment_type)}</p>
                    </div>
                  </div>
                  <Badge text={s.status} variant={staffStatusBadge[s.status] ?? 'muted'} />
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Leave Requests" open={open.leave} onToggle={() => toggle('leave')} badge={String(pendingLeave)}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={() => setShowLeaveForm(v => !v)} style={{ ...T.btn.primary, display: 'flex', alignItems: 'center', gap: '6px' }}>
              {showLeaveForm ? <X size={14} /> : <Plus size={14} />}
              {showLeaveForm ? 'Cancel' : 'New Leave Request'}
            </button>
          </div>

          {showLeaveForm && (
            <form action={handleCreateLeave} style={{ ...T.card, marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <select name="staffId" required style={{ ...T.input, cursor: 'pointer' }}>
                  <option value="">Select staff member…</option>
                  {activeStaff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
                <select name="leaveType" required style={{ ...T.input, cursor: 'pointer' }}>
                  <option value="annual">Annual</option>
                  <option value="sick">Sick</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="family_responsibility">Family Responsibility</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {/* club_id is derived from the selected staff member's club server-side in a fuller build;
                  for now it's passed explicitly since staff can belong to more than one context. */}
              <select name="clubId" required style={{ ...T.input, cursor: 'pointer' }}>
                <option value="">Confirm club…</option>
                {[...new Map(activeStaff.filter(s => s.club_id).map(s => [s.club_id, s.clubs?.name])).entries()].map(([id, name]) => (
                  <option key={id} value={id!}>{name}</option>
                ))}
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input name="startDate" type="date" required style={T.input} />
                <input name="endDate" type="date" required style={T.input} />
              </div>
              <textarea name="reason" placeholder="Reason (optional)" rows={2} style={{ ...T.input, resize: 'vertical' as const }} />
              <button type="submit" style={{ ...T.btn.primary, alignSelf: 'flex-start' }}>Submit Request</button>
            </form>
          )}

          {loading ? (
            <p style={{ fontSize: '13px', color: T.colors.textMuted }}>Loading…</p>
          ) : leaveRequests.length === 0 ? (
            <p style={{ fontSize: '13px', color: T.colors.textMuted }}>No leave requests logged yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {leaveRequests.map(l => (
                <div key={l.id} style={{
                  padding: '12px 16px', borderRadius: T.radius.md,
                  background: T.colors.surfaceRaised, border: `1px solid ${T.colors.border}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={13} color={T.colors.textSecondary} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: T.colors.textPrimary }}>
                        {l.staff_members?.full_name ?? 'Unknown'}
                      </span>
                      <span style={{ fontSize: '11px', color: T.colors.textMuted }}>{label(l.leave_type)}</span>
                    </div>
                    <Badge text={l.status} variant={leaveStatusBadge[l.status] ?? 'muted'} />
                  </div>
                  <p style={{ fontSize: '11px', color: T.colors.textMuted, margin: '6px 0 0' }}>
                    {l.start_date} → {l.end_date}
                  </p>
                  {l.reason && <p style={{ fontSize: '12px', color: T.colors.textSecondary, margin: '6px 0 0' }}>{l.reason}</p>}
                  {l.decision_note && <p style={{ fontSize: '11px', color: T.colors.textMuted, margin: '6px 0 0' }}>Jade's note: {l.decision_note}</p>}
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Incident Log" open={open.incidents} onToggle={() => toggle('incidents')} badge={String(openIncidents)}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={() => setShowIncidentForm(v => !v)} style={{ ...T.btn.secondary, display: 'flex', alignItems: 'center', gap: '6px' }}>
              {showIncidentForm ? <X size={14} /> : <Plus size={14} />}
              {showIncidentForm ? 'Cancel' : 'Log Incident'}
            </button>
          </div>

          {showIncidentForm && (
            <form action={handleCreateIncident} style={{ ...T.card, marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <select name="staffId" required style={{ ...T.input, cursor: 'pointer' }}>
                  <option value="">Select staff member…</option>
                  {activeStaff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
                <select name="category" required style={{ ...T.input, cursor: 'pointer' }}>
                  <option value="disciplinary">Disciplinary</option>
                  <option value="grievance">Grievance</option>
                  <option value="performance">Performance</option>
                  <option value="commendation">Commendation</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <select name="clubId" required style={{ ...T.input, cursor: 'pointer' }}>
                <option value="">Confirm club…</option>
                {[...new Map(activeStaff.filter(s => s.club_id).map(s => [s.club_id, s.clubs?.name])).entries()].map(([id, name]) => (
                  <option key={id} value={id!}>{name}</option>
                ))}
              </select>
              <textarea name="description" required placeholder="What happened…" rows={3} style={{ ...T.input, resize: 'vertical' as const }} />
              <button type="submit" style={{ ...T.btn.primary, alignSelf: 'flex-start' }}>Log It</button>
            </form>
          )}

          {loading ? (
            <p style={{ fontSize: '13px', color: T.colors.textMuted }}>Loading…</p>
          ) : incidents.length === 0 ? (
            <p style={{ fontSize: '13px', color: T.colors.textMuted }}>Nothing logged.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {incidents.map(i => (
                <div key={i.id} style={{
                  padding: '12px 16px', borderRadius: T.radius.md,
                  background: T.colors.surfaceRaised, border: `1px solid ${T.colors.border}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: T.colors.textPrimary }}>
                      {i.staff_members?.full_name ?? 'Unknown'} — {label(i.category)}
                    </span>
                    <Badge text={i.status} variant={incidentStatusBadge[i.status] ?? 'muted'} />
                  </div>
                  <p style={{ fontSize: '12px', color: T.colors.textSecondary, margin: '6px 0 0' }}>{i.description}</p>
                  {i.resolution_note && <p style={{ fontSize: '11px', color: T.colors.textMuted, margin: '6px 0 0' }}>Resolution: {i.resolution_note}</p>}
                </div>
              ))}
            </div>
          )}
        </Section>

      </div>
    </div>
  )
}