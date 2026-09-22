'use client'

import { useState, useEffect } from 'react'
import { ImageIcon, Calendar, User, Clock, MapPin, DollarSign, ChevronDown, ChevronUp, CheckCircle2, Paintbrush, Upload, AlertCircle } from 'lucide-react'
import { theme } from '../../components/theme'
import { listAllBriefs, updateBriefStatus, publishFlyer } from './actions'

const T = theme

const PRIORITY_COLORS: Record<string, { color: string; bg: string }> = {
  low:    { color: T.colors.textSecondary, bg: T.colors.surfaceRaised },
  normal: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  high:   { color: T.colors.amber, bg: T.colors.amberGlow },
  urgent: { color: T.colors.red, bg: T.colors.redGlow },
}
const PRIORITY_LABELS: Record<string, string> = { low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent' }

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted', in_design: 'In Design', review: 'Review', completed: 'Completed',
}
const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  submitted:  { color: T.colors.textSecondary, bg: T.colors.surfaceRaised },
  in_design:  { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  review:     { color: T.colors.amber, bg: T.colors.amberGlow },
  completed:  { color: T.colors.green, bg: T.colors.greenGlow },
}
const STATUS_NEXT: Record<string, string> = {
  submitted: 'in_design', in_design: 'review', review: 'completed',
}
const STATUS_NEXT_LABEL: Record<string, string> = {
  submitted: 'Start Design', in_design: 'Send for Review', review: 'Publish Flyer',
}

const fieldLabel: React.CSSProperties = {
  fontSize: '11px', fontWeight: '600', color: T.colors.textSecondary,
  textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '7px',
}

export default function MarketingTeamPage() {
  const [briefs, setBriefs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [publishingId, setPublishingId] = useState<string | null>(null)

  // Publish form state
  const [flyerEventName, setFlyerEventName] = useState('')
  const [flyerDate, setFlyerDate] = useState('')
  const [flyerTime, setFlyerTime] = useState('')
  const [flyerPrice, setFlyerPrice] = useState('')
  const [flyerLocation, setFlyerLocation] = useState('')
  const [flyerImage, setFlyerImage] = useState<File | null>(null)

  async function reload() {
    setBriefs(await listAllBriefs())
    setLoading(false)
  }

  useEffect(() => { reload() }, [])

  async function handleStatusAdvance(briefId: string, currentStatus: string) {
    const next = STATUS_NEXT[currentStatus]
    if (!next || next === 'completed') return // 'completed' is only triggered via publish
    await updateBriefStatus(briefId, next)
    await reload()
  }

  function openPublish(briefId: string) {
    setPublishingId(briefId)
    setFlyerEventName(''); setFlyerDate(''); setFlyerTime('')
    setFlyerPrice(''); setFlyerLocation(''); setFlyerImage(null)
  }

  async function handlePublish(brief: any) {
    if (!flyerEventName || !flyerImage) return
    const formData = new FormData()
    formData.set('briefId', brief.id)
    formData.set('clubId', brief.club_id)
    formData.set('eventName', flyerEventName)
    formData.set('eventDate', flyerDate)
    formData.set('eventTime', flyerTime)
    formData.set('price', flyerPrice)
    formData.set('location', flyerLocation)
    formData.set('imageName', flyerImage.name)
    await publishFlyer(formData)
    setPublishingId(null)
    await reload()
  }

  const urgent = briefs.filter(b => b.priority === 'urgent').length
  const inDesign = briefs.filter(b => b.status === 'in_design').length
  const inReview = briefs.filter(b => b.status === 'review').length

  if (loading) {
    return <div style={{ minHeight: '100vh', background: T.colors.bg, padding: '32px 36px', color: T.colors.textSecondary }}>Loading...</div>
  }

  return (
    <div style={{ minHeight: '100vh', background: T.colors.bg }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 36px' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 10px rgba(168,85,247,0.4)' }} />
            <span style={{ fontSize: '11px', color: '#a855f7', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Marketing Team</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: T.colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>Design Queue</h1>
          <p style={{ fontSize: '13px', color: T.colors.textSecondary, marginTop: '5px' }}>
            Active briefs across all clubs — design in Canva, publish here when ready
          </p>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
          {[
            { label: 'Total Active', value: String(briefs.length), color: T.colors.textPrimary },
            { label: 'Urgent', value: String(urgent), color: urgent > 0 ? T.colors.red : T.colors.textMuted },
            { label: 'In Design', value: String(inDesign), color: '#3b82f6' },
            { label: 'In Review', value: String(inReview), color: T.colors.amber },
          ].map(s => (
            <div key={s.label} style={{ ...T.card, padding: '14px 18px', marginBottom: 0 }}>
              <p style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>{s.label}</p>
              <p style={{ fontSize: '22px', fontWeight: '700', color: s.color, margin: 0, fontFamily: "'SF Mono', monospace" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Canva integration placeholder */}
        <div style={{ ...T.card, marginBottom: '24px', padding: '16px 20px', border: `1px dashed ${T.colors.borderBright}`, display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: T.colors.surfaceRaised, border: `1px solid ${T.colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Paintbrush size={16} color={T.colors.textMuted} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary, margin: '0 0 3px' }}>Canva Integration</p>
            <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: 0 }}>
              AI-assisted design generation via Canva API — pending company API credentials. Once live, select a brief below and generate a draft design directly in Canva from this workspace.
            </p>
          </div>
          <span style={{ fontSize: '10px', fontWeight: '700', padding: '4px 10px', borderRadius: '999px', background: T.colors.amberGlow, color: T.colors.amber, whiteSpace: 'nowrap' }}>
            Pending credentials
          </span>
        </div>

        {/* Brief queue */}
        {briefs.length === 0 ? (
          <div style={{ ...T.card, textAlign: 'center', padding: '48px', color: T.colors.textMuted }}>
            No active briefs — all caught up.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {briefs.map(brief => {
              const isOpen = expandedId === brief.id
              const isPublishing = publishingId === brief.id
              const pc = PRIORITY_COLORS[brief.priority] ?? PRIORITY_COLORS.normal
              const sc = STATUS_COLORS[brief.status] ?? STATUS_COLORS.submitted
              const refImages: string[] = brief.ref_image_names ?? []
              const nextStatus = STATUS_NEXT[brief.status]
              const nextLabel = STATUS_NEXT_LABEL[brief.status]

              return (
                <div key={brief.id} style={{
                  background: T.colors.surface, borderRadius: T.radius.lg,
                  border: `1px solid ${isOpen ? '#a855f7' : T.colors.border}`,
                  boxShadow: isOpen ? '0 0 14px rgba(168,85,247,0.12)' : T.shadow.card,
                  overflow: 'hidden',
                }}>
                  {/* Collapsed row */}
                  <div onClick={() => setExpandedId(isOpen ? null : brief.id)} style={{
                    display: 'grid', gridTemplateColumns: '80px 1fr 100px 120px 100px 24px',
                    alignItems: 'center', padding: '14px 18px', cursor: 'pointer', gap: '14px',
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: T.colors.textSecondary, fontFamily: "'SF Mono', monospace" }}>
                      {brief.clubs?.name?.toUpperCase() ?? ''}
                    </span>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary, margin: 0 }}>{brief.title}</p>
                      <p style={{ fontSize: '11px', color: T.colors.textMuted, margin: '2px 0 0' }}>{brief.assignee}</p>
                    </div>
                    <span style={{ fontSize: '9px', fontWeight: '700', padding: '3px 9px', borderRadius: '999px', textTransform: 'uppercase', textAlign: 'center', ...pc }}>
                      {PRIORITY_LABELS[brief.priority]}
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: '600', padding: '4px 10px', borderRadius: '999px', textAlign: 'center', ...sc }}>
                      {STATUS_LABELS[brief.status]}
                    </span>
                    <span style={{ fontSize: '11px', color: T.colors.textMuted, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>
                      {brief.due_date ? new Date(brief.due_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) : '—'}
                    </span>
                    {isOpen ? <ChevronUp size={14} color={T.colors.textMuted} /> : <ChevronDown size={14} color={T.colors.textMuted} />}
                  </div>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div style={{ borderTop: `1px solid ${T.colors.border}`, padding: '20px', background: T.colors.bg }}>

                      {/* Description */}
                      <p style={{ fontSize: '12px', color: T.colors.textSecondary, margin: '0 0 16px', lineHeight: 1.6 }}>{brief.description || 'No description provided.'}</p>

                      {/* Ref images */}
                      {refImages.length > 0 && (
                        <div style={{ marginBottom: '16px' }}>
                          <p style={{ fontSize: '10px', fontWeight: '700', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Reference Images</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {refImages.map((name, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: T.colors.textSecondary }}>
                                <ImageIcon size={11} color={T.colors.textMuted} /> {name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Publish form — only shown when brief is in review */}
                      {isPublishing && brief.status === 'review' && (
                        <div style={{ ...T.card, marginBottom: '16px', border: `1px solid rgba(168,85,247,0.3)`, boxShadow: '0 0 12px rgba(168,85,247,0.1)' }}>
                          <p style={{ fontSize: '11px', fontWeight: '700', color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>Publish Flyer to Updates</p>
                          <div style={{ marginBottom: '12px' }}>
                            <label style={fieldLabel}>Event Name</label>
                            <input value={flyerEventName} onChange={e => setFlyerEventName(e.target.value)} style={T.input} placeholder="e.g. Sunrise Saturdays" />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                            <div>
                              <label style={fieldLabel}>Date</label>
                              <input type="date" value={flyerDate} onChange={e => setFlyerDate(e.target.value)} style={T.input} />
                            </div>
                            <div>
                              <label style={fieldLabel}>Time</label>
                              <input type="time" value={flyerTime} onChange={e => setFlyerTime(e.target.value)} style={T.input} />
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                            <div>
                              <label style={fieldLabel}>Price</label>
                              <input value={flyerPrice} onChange={e => setFlyerPrice(e.target.value)} placeholder="e.g. R150" style={T.input} />
                            </div>
                            <div>
                              <label style={fieldLabel}>Location</label>
                              <input value={flyerLocation} onChange={e => setFlyerLocation(e.target.value)} placeholder="e.g. Woodstock Padel Club" style={T.input} />
                            </div>
                          </div>
                          <div style={{ marginBottom: '14px' }}>
                            <label style={fieldLabel}>Final Flyer Image (from Canva)</label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: T.colors.surface, border: `1px dashed ${T.colors.borderBright}`, borderRadius: T.radius.sm, cursor: 'pointer' }}>
                              <Upload size={13} color={T.colors.textMuted} />
                              <span style={{ fontSize: '13px', color: T.colors.textMuted }}>{flyerImage ? flyerImage.name : 'Upload completed Canva design (JPG, PNG)'}</span>
                              <input type="file" accept=".jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => setFlyerImage(e.target.files?.[0] ?? null)} />
                            </label>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handlePublish(brief)} disabled={!flyerEventName || !flyerImage} style={{
                              ...T.btn.primary, background: '#a855f7', boxShadow: '0 0 10px rgba(168,85,247,0.3)',
                              display: 'flex', alignItems: 'center', gap: '6px',
                              opacity: (!flyerEventName || !flyerImage) ? 0.4 : 1,
                              cursor: (!flyerEventName || !flyerImage) ? 'not-allowed' : 'pointer',
                            }}>
                              <CheckCircle2 size={13} /> Publish to Flyer Updates
                            </button>
                            <button onClick={() => setPublishingId(null)} style={T.btn.ghost}>Cancel</button>
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {nextStatus && nextStatus !== 'completed' && (
                          <button
                            onClick={() => handleStatusAdvance(brief.id, brief.status)}
                            style={{ ...T.btn.primary, background: '#a855f7', boxShadow: '0 0 10px rgba(168,85,247,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            {nextLabel}
                          </button>
                        )}
                        {brief.status === 'review' && !isPublishing && (
                          <button
                            onClick={() => openPublish(brief.id)}
                            style={{ ...T.btn.primary, background: T.colors.green, boxShadow: '0 0 10px rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Upload size={13} /> Publish Flyer
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}