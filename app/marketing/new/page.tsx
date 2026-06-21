'use client'

import { useState } from 'react'
import { Megaphone, Plus, Calendar, User, ImageIcon, X, MessageSquare, ArrowLeft, FileText, Plus as PlusIcon } from 'lucide-react'
import { theme } from '../../components/theme'

const T = theme

const CLUB_NAMES = ['BALLITO','BEDFORDVIEW','CENTURION','DURBANVILLE','EPICENTRE','GATEWAY','GEORGE','GLEN','GROENKLOOF','HUDDLE','LORRAINE','LOURENSFORD','LONEHILL','OLD EDS','POINT','RANDPARK','WOODSTOCK']

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

const PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'] as const
type Priority = typeof PRIORITIES[number]

const PRIORITY_COLORS: Record<Priority, { color: string; bg: string; border: string }> = {
  Low:    { color: T.colors.textSecondary, bg: T.colors.surfaceRaised, border: T.colors.border },
  Normal: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
  High:   { color: T.colors.amber, bg: T.colors.amberGlow, border: 'rgba(245,158,11,0.2)' },
  Urgent: { color: T.colors.red, bg: T.colors.redGlow, border: 'rgba(224,10,9,0.2)' },
}

type BriefStatus = 'Submitted' | 'In Design' | 'Review' | 'Completed'
const STATUS_COLORS: Record<BriefStatus, { color: string; bg: string; border: string }> = {
  Submitted: { color: T.colors.textSecondary, bg: T.colors.surfaceRaised, border: T.colors.border },
  'In Design': { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
  Review:    { color: T.colors.amber, bg: T.colors.amberGlow, border: 'rgba(245,158,11,0.2)' },
  Completed: { color: T.colors.green, bg: T.colors.greenGlow, border: 'rgba(34,197,94,0.2)' },
}

interface Brief {
  id: number
  club: string
  title: string
  assignee: string
  priority: Priority
  dueDate: string
  description: string
  refImageNames: string[]
  status: BriefStatus
  submittedDate: string
  clickupTaskId?: string
}

const MOCK_BRIEFS: Brief[] = [
  { id: 1, club: 'WOODSTOCK', title: 'Sunrise Saturdays Poster', assignee: 'Design Team', priority: 'High', dueDate: '2026-06-25', description: 'A3 poster for the weekly Saturday social, bright morning theme.', refImageNames: ['sunrise_ref.jpg'], status: 'In Design', submittedDate: '2026-06-15' },
  { id: 2, club: 'CENTURION', title: 'Corporate Tournament Flyer', assignee: 'Amber K', priority: 'Urgent', dueDate: '2026-06-22', description: 'Sponsor-branded flyer for the corporate tournament, include all 4 sponsor logos.', refImageNames: ['sponsor_logo_1.png', 'sponsor_logo_2.png', 'sponsor_logo_3.png'], status: 'Review', submittedDate: '2026-06-14' },
  { id: 3, club: 'GATEWAY', title: 'Junior Academy Social Tile', assignee: 'Design Team', priority: 'Normal', dueDate: '2026-06-30', description: 'Instagram square tile for the junior academy day, playful and colourful.', refImageNames: [], status: 'Submitted', submittedDate: '2026-06-18' },
]

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
  const [briefs, setBriefs]   = useState<Brief[]>(MOCK_BRIEFS)
  const [activeClub, setActiveClub] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const [title, setTitle]       = useState('')
  const [assignee, setAssignee] = useState('')
  const [priority, setPriority] = useState<Priority>('Normal')
  const [dueDate, setDueDate]   = useState('')
  const [description, setDescription] = useState('')
  const [refImages, setRefImages] = useState<File[]>([])

  const resetForm = () => { setTitle(''); setAssignee(''); setPriority('Normal'); setDueDate(''); setDescription(''); setRefImages([]) }

  const addRefImages = (files: FileList | null) => {
    if (!files) return
    setRefImages(prev => [...prev, ...Array.from(files)])
  }
  const removeRefImage = (idx: number) => {
    setRefImages(prev => prev.filter((_, i) => i !== idx))
  }

  const submitBrief = (club: string) => {
    if (!title || !dueDate) return
    const newBrief: Brief = {
      id: Date.now(), club, title, assignee: assignee || 'Design Team', priority, dueDate,
      description, refImageNames: refImages.map(f => f.name),
      status: 'Submitted', submittedDate: new Date().toISOString().split('T')[0],
    }
    setBriefs(prev => [newBrief, ...prev])
    resetForm()
    setShowForm(false)
  }

  if (!activeClub) {
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
              Select a club to submit a design brief · {briefs.length} active briefs
            </p>
          </div>

          <div style={{ ...T.card, marginBottom: '24px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MessageSquare size={16} color={T.colors.textMuted} />
            <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: 0 }}>
              ClickUp not yet connected — each club maps to its own ClickUp folder. Briefs submitted here will sync as tasks once connected.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
            {CLUB_NAMES.map(club => {
              const [c1, c2] = clubGradient(club)
              const clubBriefs = briefs.filter(b => b.club === club)
              const activeCount = clubBriefs.filter(b => b.status !== 'Completed').length
              return (
                <ClubTile
                  key={club}
                  name={club}
                  gradientFrom={c1}
                  gradientTo={c2}
                  count={activeCount}
                  countLabel={activeCount === 1 ? 'active brief' : 'active briefs'}
                  onClick={() => setActiveClub(club)}
                />
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const clubBriefs = briefs.filter(b => b.club === activeClub)
  const [c1, c2] = clubGradient(activeClub)

  return (
    <div style={{ minHeight: '100vh', background: T.colors.bg }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 36px' }}>

        <button onClick={() => { setActiveClub(null); setShowForm(false); resetForm() }} style={{
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
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>{activeClub}</h1>
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
                <select value={priority} onChange={e => setPriority(e.target.value as Priority)} style={{ ...T.input, cursor: 'pointer' }}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
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

            {/* Multi-file reference image upload */}
            <div style={{ marginBottom: '18px' }}>
              <label style={fieldLabel}>Reference Images (optional — sponsor logos, examples, etc.)</label>

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
              <button onClick={() => submitBrief(activeClub)} disabled={!title || !dueDate} style={{ ...T.btn.primary, opacity: (!title || !dueDate) ? 0.4 : 1, cursor: (!title || !dueDate) ? 'not-allowed' : 'pointer' }}>Submit Brief</button>
              <button onClick={() => { setShowForm(false); resetForm() }} style={T.btn.secondary}>Cancel</button>
            </div>
          </div>
        )}

        <p style={{ fontSize: '11px', fontWeight: '700', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
          Briefs for {activeClub}
        </p>

        {clubBriefs.length === 0 ? (
          <div style={{ ...T.card, textAlign: 'center', padding: '32px', color: T.colors.textMuted, fontSize: '13px' }}>
            No briefs submitted for this club yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {clubBriefs.map(brief => {
              const pc = PRIORITY_COLORS[brief.priority]
              const sc = STATUS_COLORS[brief.status]
              return (
                <div key={brief.id} style={{ ...T.card, marginBottom: 0, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: T.colors.textPrimary, margin: 0 }}>{brief.title}</p>
                        <span style={{ fontSize: '9px', fontWeight: '700', padding: '2px 7px', borderRadius: '999px', textTransform: 'uppercase', ...pc }}>{brief.priority}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: T.colors.textSecondary, margin: 0 }}>{brief.description}</p>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: '600', padding: '4px 10px', borderRadius: '999px', whiteSpace: 'nowrap', ...sc }}>{brief.status}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
                    <Meta icon={<User size={11} />} label={brief.assignee} />
                    <Meta icon={<Calendar size={11} />} label={`Due ${new Date(brief.dueDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}`} />
                    {brief.refImageNames.length > 0 && (
                      <Meta icon={<ImageIcon size={11} />} label={`${brief.refImageNames.length} reference image${brief.refImageNames.length > 1 ? 's' : ''}`} />
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