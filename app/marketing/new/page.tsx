'use client'

import { useState, useEffect } from 'react'
import { Megaphone, Plus, Calendar, User, ImageIcon, X, MessageSquare, ArrowLeft, Plus as PlusIcon } from 'lucide-react'
import { theme } from '../../components/theme'
import { listActiveClubs, listBriefsForClub, listAllBriefCounts, createBrief, completeBrief } from './actions'

const T = theme

const GRADIENTS = [
  ['#e00a09', '#7a0605'], ['#a855f7', '#5b2d8a'], ['#3b82f6', '#1e4e8c'],
  ['#f97316', '#9a4a0c'], ['#16a34a', '#0d5c2c'], ['#0284c7', '#055578'],
  ['#ec4899', '#8c2a5c'], ['#eab308', '#8a6906'],
]
function clubGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % GRADIENTS.length
  return GRADIENTS[hash]
}

const PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const
const PRIORITY_LABELS: Record<string, string> = { low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent' }
const PRIORITY_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  low:    { color: T.colors.textSecondary, bg: T.colors.surfaceRaised, border: T.colors.border },
  normal: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
  high:   { color: T.colors.amber, bg: T.colors.amberGlow, border: 'rgba(245,158,11,0.2)' },
  urgent: { color: T.colors.red, bg: T.colors.redGlow, border: 'rgba(224,10,9,0.2)' },
}

const STATUS_LABELS: Record<string, string> = { submitted: 'Submitted', in_design: 'In Design', review: 'Review', completed: 'Completed' }
const STATUS_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  submitted: { color: T.colors.textSecondary, bg: T.colors.surfaceRaised, border: T.colors.border },
  in_design: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
  review:    { color: T.colors.amber, bg: T.colors.amberGlow, border: 'rgba(245,158,11,0.2)' },
  completed: { color: T.colors.green, bg: T.colors.greenGlow, border: 'rgba(34,197,94,0.2)' },
}

const fieldLabel: React.CSSProperties = {
  fontSize: '11px', fontWeight: '600', color: T.colors.textSecondary,
  textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '7px',
}

function Meta({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: T.colors.textMuted, fontSize: '11px', fontFamily: "'SF Mono', monospace" }}>
      {icon}<span>{label}</span>
    </div>
  )
}

export default function NewFlyerDesignPage() {
  const [clubs, setClubs] = useState<{ id: string; name: string }[]>([])
  const [briefCounts, setBriefCounts] = useState<Record<string, number>>({})
  const [activeClubId, setActiveClubId] = useState<string | null>(null)
  const [briefs, setBriefs] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const [title, setTitle] = useState('')
  const [assignee, setAssignee] = useState('')
  const [priority, setPriority] = useState('normal')
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')
  const [refImages, setRefImages] = useState<File[]>([])

  const [completingBriefId, setCompletingBriefId] = useState<string | null>(null)
const [flyerEventName, setFlyerEventName] = useState('')
const [flyerDate, setFlyerDate] = useState('')
const [flyerTime, setFlyerTime] = useState('')
const [flyerPrice, setFlyerPrice] = useState('')
const [flyerLocation, setFlyerLocation] = useState('')
const [flyerImage, setFlyerImage] = useState<File | null>(null)

  useEffect(() => {
    async function init() {
      const c = await listActiveClubs()
      setClubs(c)
      const counts = await listAllBriefCounts()
      const grouped: Record<string, number> = {}
      counts.forEach((row: any) => { grouped[row.club_id] = (grouped[row.club_id] ?? 0) + 1 })
      setBriefCounts(grouped)
      setLoading(false)
    }
    init()
  }, [])

  async function openClub(clubId: string) {
    setActiveClubId(clubId)
    const b = await listBriefsForClub(clubId)
    setBriefs(b)
  }

  function resetForm() { setTitle(''); setAssignee(''); setPriority('normal'); setDueDate(''); setDescription(''); setRefImages([]) }

  function addRefImages(files: FileList | null) {
    if (!files) return
    setRefImages(prev => [...prev, ...Array.from(files)])
  }
  function removeRefImage(idx: number) {
    setRefImages(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmitBrief() {
    if (!title || !dueDate || !activeClubId) return
    const formData = new FormData()
    formData.set('clubId', activeClubId)
    formData.set('title', title)
    formData.set('assignee', assignee || 'Design Team')
    formData.set('priority', priority)
    formData.set('dueDate', dueDate)
    formData.set('description', description)
    refImages.forEach(f => formData.append('refImageNames', f.name))

    await createBrief(formData)
    resetForm()
    setShowForm(false)
    const b = await listBriefsForClub(activeClubId)
    setBriefs(b)
    const counts = await listAllBriefCounts()
    const grouped: Record<string, number> = {}
    counts.forEach((row: any) => { grouped[row.club_id] = (grouped[row.club_id] ?? 0) + 1 })
    setBriefCounts(grouped)
  }

  async function handleCompleteBrief(briefId: string) {
  if (!flyerEventName || !flyerImage) return
  const formData = new FormData()
  formData.set('clubId', activeClubId!)
  formData.set('eventName', flyerEventName)
  formData.set('eventDate', flyerDate)
  formData.set('eventTime', flyerTime)
  formData.set('price', flyerPrice)
  formData.set('location', flyerLocation)
  formData.set('imageName', flyerImage.name)

  await completeBrief(briefId, formData)
  setCompletingBriefId(null)
  setFlyerEventName(''); setFlyerDate(''); setFlyerTime(''); setFlyerPrice(''); setFlyerLocation(''); setFlyerImage(null)

  const b = await listBriefsForClub(activeClubId!)
  setBriefs(b)
}

  if (loading) {
    return <div style={{ minHeight: '100vh', background: T.colors.bg, padding: '32px 36px', color: T.colors.textSecondary }}>Loading...</div>
  }

  if (!activeClubId) {
    return (
      <div style={{ minHeight: '100vh', background: T.colors.bg }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 36px' }}>

          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.colors.red, boxShadow: T.shadow.redGlowSm }} />
              <span style={{ fontSize: '11px', color: T.colors.red, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Marketing</span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: T.colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>New Flyer Design</h1>
            <p style={{ fontSize: '13px', color: T.colors.textSecondary, marginTop: '5px' }}>
              Select a club to submit a design brief
            </p>
          </div>

          <div style={{ ...T.card, marginBottom: '24px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MessageSquare size={16} color={T.colors.textMuted} />
            <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: 0 }}>
              ClickUp not yet connected — each club maps to its own ClickUp folder. Briefs submitted here will sync as tasks once connected.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
            {clubs.map(club => {
              const [c1, c2] = clubGradient(club.name)
              const activeCount = briefCounts[club.id] ?? 0
              return (
                <ClubTile
                  key={club.id}
                  name={club.name.toUpperCase()}
                  gradientFrom={c1}
                  gradientTo={c2}
                  count={activeCount}
                  countLabel={activeCount === 1 ? 'active brief' : 'active briefs'}
                  onClick={() => openClub(club.id)}
                />
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const activeClubName = clubs.find(c => c.id === activeClubId)?.name.toUpperCase() ?? ''
  const [c1, c2] = clubGradient(activeClubName)

  return (
    <div style={{ minHeight: '100vh', background: T.colors.bg }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 36px' }}>

        <button onClick={() => { setActiveClubId(null); setShowForm(false); resetForm() }} style={{
          display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none',
          color: T.colors.textMuted, cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', padding: 0, marginBottom: '20px',
        }}>
          <ArrowLeft size={14} /> All clubs
        </button>

        <div style={{
          borderRadius: T.radius.lg, padding: '24px 28px', marginBottom: '24px',
          background: `linear-gradient(135deg, ${c1}, ${c2})`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>New brief</p>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>{activeClubName}</h1>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff', borderRadius: T.radius.sm, padding: '10px 18px',
            fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <Plus size={14} /> New Brief
          </button>
        </div>

        {showForm && (
          <div style={{ ...T.card, marginBottom: '20px', border: `1px solid rgba(224,10,9,0.3)`, boxShadow: T.shadow.redGlowSm }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary }}>Submit New Brief</span>
              <button onClick={() => { setShowForm(false); resetForm() }} style={{ background: 'none', border: 'none', color: T.colors.textMuted, cursor: 'pointer', fontSize: '18px', padding: 0 }}>×</button>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={fieldLabel}>Brief Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Sunrise Saturdays Poster" style={T.input} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={fieldLabel}>Due Date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={T.input} />
              </div>
              <div>
                <label style={fieldLabel}>Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} style={{ ...T.input, cursor: 'pointer' }}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                </select>
              </div>
              <div>
                <label style={fieldLabel}>Assign To</label>
                <input value={assignee} onChange={e => setAssignee(e.target.value)} placeholder="Design Team" style={T.input} />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={fieldLabel}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the design, theme, dimensions, key info to include..." rows={3} style={{ ...T.input, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={fieldLabel}>Reference Images (optional — sponsor logos, examples, etc.)</label>
              <p style={{ fontSize: '11px', color: T.colors.textMuted, margin: '0 0 8px' }}>Filename only for now — file storage not yet wired.</p>

              {refImages.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                  {refImages.map((file, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: T.colors.surfaceRaised, border: `1px solid ${T.colors.border}`, borderRadius: T.radius.sm }}>
                      <ImageIcon size={13} color={T.colors.textSecondary} />
                      <span style={{ fontSize: '12px', color: T.colors.textSecondary, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                      <button onClick={() => removeRefImage(idx)} style={{ background: 'none', border: 'none', color: T.colors.textMuted, cursor: 'pointer' }}><X size={13} /></button>
                    </div>
                  ))}
                </div>
              )}

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: T.colors.surface, border: `1px dashed ${T.colors.borderBright}`, borderRadius: T.radius.sm, cursor: 'pointer' }}>
                <PlusIcon size={14} color={T.colors.textMuted} />
                <span style={{ fontSize: '13px', color: T.colors.textMuted }}>
                  {refImages.length > 0 ? 'Add more images' : 'Attach reference images (JPG, PNG) — multiple allowed'}
                </span>
                <input type="file" accept=".jpg,.jpeg,.png" multiple style={{ display: 'none' }} onChange={e => addRefImages(e.target.files)} />
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleSubmitBrief} disabled={!title || !dueDate} style={{ ...T.btn.primary, opacity: (!title || !dueDate) ? 0.4 : 1, cursor: (!title || !dueDate) ? 'not-allowed' : 'pointer' }}>Submit Brief</button>
              <button onClick={() => { setShowForm(false); resetForm() }} style={T.btn.secondary}>Cancel</button>
            </div>
          </div>
        )}

        <p style={{ fontSize: '11px', fontWeight: '700', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
          Briefs for {activeClubName}
        </p>

        {briefs.length === 0 ? (
          <div style={{ ...T.card, textAlign: 'center', padding: '32px', color: T.colors.textMuted, fontSize: '13px' }}>
            No briefs submitted for this club yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {briefs.map((brief: any) => {
              const pc = PRIORITY_COLORS[brief.priority] ?? PRIORITY_COLORS.normal
              const sc = STATUS_COLORS[brief.status] ?? STATUS_COLORS.submitted
              const refImageNames: string[] = brief.ref_image_names ?? []
              return (
                <div key={brief.id} style={{ ...T.card, marginBottom: 0, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: T.colors.textPrimary, margin: 0 }}>{brief.title}</p>
                        <span style={{ fontSize: '9px', fontWeight: '700', padding: '2px 7px', borderRadius: '999px', textTransform: 'uppercase', ...pc }}>{PRIORITY_LABELS[brief.priority]}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: T.colors.textSecondary, margin: 0 }}>{brief.description}</p>
                    </div>
                    {brief.status !== 'completed' && (
  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${T.colors.border}` }}>
    {completingBriefId !== brief.id ? (
      <button onClick={() => setCompletingBriefId(brief.id)} style={{ ...T.btn.secondary, fontSize: '12px' }}>
        Mark Complete &amp; Publish Flyer
      </button>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <p style={{ fontSize: '11px', fontWeight: '700', color: T.colors.textMuted, textTransform: 'uppercase', margin: 0 }}>Publish Flyer</p>
        <input placeholder="Event Name" value={flyerEventName} onChange={e => setFlyerEventName(e.target.value)} style={T.input} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <input type="date" value={flyerDate} onChange={e => setFlyerDate(e.target.value)} style={T.input} />
          <input type="time" value={flyerTime} onChange={e => setFlyerTime(e.target.value)} style={T.input} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <input placeholder="Price (e.g. R150)" value={flyerPrice} onChange={e => setFlyerPrice(e.target.value)} style={T.input} />
          <input placeholder="Location" value={flyerLocation} onChange={e => setFlyerLocation(e.target.value)} style={T.input} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: T.colors.surface, border: `1px dashed ${T.colors.borderBright}`, borderRadius: T.radius.sm, cursor: 'pointer' }}>
          <span style={{ fontSize: '13px', color: T.colors.textMuted }}>
            {flyerImage ? flyerImage.name : 'Upload final flyer design (JPG, PNG)'}
          </span>
          <input type="file" accept=".jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => setFlyerImage(e.target.files?.[0] ?? null)} />
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => handleCompleteBrief(brief.id)} disabled={!flyerEventName || !flyerImage} style={{ ...T.btn.primary, opacity: (!flyerEventName || !flyerImage) ? 0.4 : 1 }}>
            Publish to Flyer Updates
          </button>
          <button onClick={() => setCompletingBriefId(null)} style={T.btn.ghost}>Cancel</button>
        </div>
      </div>
    )}
  </div>
)}
                    <span style={{ fontSize: '10px', fontWeight: '600', padding: '4px 10px', borderRadius: '999px', whiteSpace: 'nowrap', ...sc }}>{STATUS_LABELS[brief.status]}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
                    <Meta icon={<User size={11} />} label={brief.assignee} />
                    <Meta icon={<Calendar size={11} />} label={`Due ${brief.due_date ? new Date(brief.due_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) : '—'}`} />
                    {refImageNames.length > 0 && (
                      <Meta icon={<ImageIcon size={11} />} label={`${refImageNames.length} reference image${refImageNames.length > 1 ? 's' : ''}`} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function ClubTile({ name, gradientFrom, gradientTo, count, countLabel, onClick }: {
  name: string; gradientFrom: string; gradientTo: string
  count: number; countLabel: string; onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: T.radius.lg, padding: '20px', cursor: 'pointer',
        background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
        position: 'relative', overflow: 'hidden', minHeight: '120px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? `0 8px 24px ${gradientFrom}55` : '0 2px 8px rgba(0,0,0,0.3)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
      <Megaphone size={20} color="rgba(255,255,255,0.85)" style={{ position: 'relative', zIndex: 1 }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: '0 0 4px', letterSpacing: '-0.01em' }}>{name}</p>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', margin: 0 }}>
          {count > 0 ? `${count} ${countLabel}` : 'No active briefs'}
        </p>
      </div>
    </div>
  )
}