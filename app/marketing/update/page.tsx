'use client'

import { useState, useEffect } from 'react'
import { Megaphone, AlertCircle, Image as ImageIcon, Upload, Clock, MapPin, DollarSign, Calendar, ArrowLeft, MessageSquare, Send, ChevronDown, ChevronUp } from 'lucide-react'
import { theme } from '../../components/theme'
import { listActiveClubs, listFlyerCounts, listFlyersForClub, updateFlyerDraftField, resubmitFlyer, revertFlyer, sendFlyerMessage } from './actions'

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

interface FlyerFields { eventName: string; date: string; time: string; price: string; location: string }
interface FlyerChange { field: keyof FlyerFields; from: string; to: string }

const FIELD_LABELS: Record<keyof FlyerFields, { label: string; icon: React.ReactNode }> = {
  eventName: { label: 'Event Name', icon: <Megaphone size={11} /> },
  date:      { label: 'Date',       icon: <Calendar size={11} /> },
  time:      { label: 'Time',       icon: <Clock size={11} /> },
  price:     { label: 'Price',      icon: <DollarSign size={11} /> },
  location:  { label: 'Location',   icon: <MapPin size={11} /> },
}

const FIELD_TO_COLUMN: Record<keyof FlyerFields, string> = {
  eventName: 'event_name', date: 'event_date', time: 'event_time', price: 'price', location: 'location',
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const hrs = Math.floor(diff / (1000 * 60 * 60))
  if (hrs < 1) return 'Just now'
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function toFields(row: any): FlyerFields {
  return { eventName: row.event_name ?? '', date: row.event_date ?? '', time: row.event_time ?? '', price: row.price ?? '', location: row.location ?? '' }
}
function toLiveFields(row: any): FlyerFields {
  return { eventName: row.live_event_name ?? '', date: row.live_event_date ?? '', time: row.live_event_time ?? '', price: row.live_price ?? '', location: row.live_location ?? '' }
}

export default function FlyerUpdatesPage() {
  const [clubs, setClubs] = useState<{ id: string; name: string }[]>([])
  const [flyerCounts, setFlyerCounts] = useState<Record<string, { total: number; needsUpdate: number }>>({})
  const [activeClubId, setActiveClubId] = useState<string | null>(null)
  const [flyers, setFlyers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const c = await listActiveClubs()
      setClubs(c)
      const counts = await listFlyerCounts()
      const grouped: Record<string, { total: number; needsUpdate: number }> = {}
      counts.forEach((row: any) => {
        if (!grouped[row.club_id]) grouped[row.club_id] = { total: 0, needsUpdate: 0 }
        grouped[row.club_id].total += 1
        if (row.update_needed) grouped[row.club_id].needsUpdate += 1
      })
      setFlyerCounts(grouped)
      setLoading(false)
    }
    init()
  }, [])

  async function openClub(clubId: string) {
    setActiveClubId(clubId)
    const f = await listFlyersForClub(clubId)
    setFlyers(f)
  }

  async function reloadActiveClub() {
    if (!activeClubId) return
    const f = await listFlyersForClub(activeClubId)
    setFlyers(f)
  }

  async function handleFieldChange(flyerId: string, field: keyof FlyerFields, value: string) {
    setFlyers(prev => prev.map(f => f.id === flyerId ? { ...f, [FIELD_TO_COLUMN[field]]: value } : f))
    await updateFlyerDraftField(flyerId, FIELD_TO_COLUMN[field], value)
    await reloadActiveClub()
  }

  async function handleResubmit(flyerId: string, fileName: string) {
    await resubmitFlyer(flyerId, fileName)
    await reloadActiveClub()
  }

  async function handleRevert(flyerId: string) {
    await revertFlyer(flyerId)
    await reloadActiveClub()
  }

  async function handleSendMessage(flyerId: string, text: string) {
    await sendFlyerMessage(flyerId, text)
    await reloadActiveClub()
  }

  function getFlyerChanges(row: any): FlyerChange[] {
    const fields = toFields(row)
    const live = toLiveFields(row)
    const changes: FlyerChange[] = []
    ;(Object.keys(fields) as (keyof FlyerFields)[]).forEach(key => {
      if (fields[key] !== live[key]) changes.push({ field: key, from: live[key], to: fields[key] })
    })
    return changes
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
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.colors.amber, boxShadow: '0 0 10px rgba(245,158,11,0.4)' }} />
              <span style={{ fontSize: '11px', color: T.colors.amber, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Marketing</span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: T.colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>Flyer Updates</h1>
            <p style={{ fontSize: '13px', color: T.colors.textSecondary, marginTop: '5px' }}>
              Select a club to review and update live flyers
            </p>
          </div>

          <div style={{ ...T.card, marginBottom: '24px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MessageSquare size={16} color={T.colors.textMuted} />
            <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: 0 }}>
              Editing a field flags the flyer for the design team. Use the notes thread on each flyer for anything that doesn't fit a field — sizing, colours, extra requests.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
            {clubs.map(club => {
              const [c1, c2] = clubGradient(club.name)
              const counts = flyerCounts[club.id] ?? { total: 0, needsUpdate: 0 }
              return (
                <FlyerClubTile
                  key={club.id}
                  name={club.name.toUpperCase()}
                  gradientFrom={c1}
                  gradientTo={c2}
                  flyerCount={counts.total}
                  needsUpdate={counts.needsUpdate}
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
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 36px' }}>

        <button onClick={() => setActiveClubId(null)} style={{
          display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none',
          color: T.colors.textMuted, cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', padding: 0, marginBottom: '20px',
        }}>
          <ArrowLeft size={14} /> All clubs
        </button>

        <div style={{
          borderRadius: T.radius.lg, padding: '24px 28px', marginBottom: '24px',
          background: `linear-gradient(135deg, ${c1}, ${c2})`,
        }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>Flyer updates</p>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>{activeClubName}</h1>
        </div>

        {flyers.length === 0 ? (
          <div style={{ ...T.card, textAlign: 'center', padding: '32px', color: T.colors.textMuted, fontSize: '13px' }}>
            No flyers uploaded for this club yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {flyers.map(row => (
              <FlyerCard
                key={row.id}
                row={row}
                changes={getFlyerChanges(row)}
                onFieldChange={(field, value) => handleFieldChange(row.id, field, value)}
                onResubmit={(name) => handleResubmit(row.id, name)}
                onRevert={() => handleRevert(row.id)}
                onSendMessage={(text) => handleSendMessage(row.id, text)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FlyerClubTile({ name, gradientFrom, gradientTo, flyerCount, needsUpdate, onClick }: {
  name: string; gradientFrom: string; gradientTo: string
  flyerCount: number; needsUpdate: number; onClick: () => void
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
      {needsUpdate > 0 && (
        <div style={{
          position: 'absolute', top: '12px', right: '12px', zIndex: 2,
          background: 'rgba(0,0,0,0.35)', borderRadius: '999px', padding: '3px 9px',
          display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          <AlertCircle size={11} color="#fde68a" />
          <span style={{ fontSize: '10px', fontWeight: '700', color: '#fde68a' }}>{needsUpdate}</span>
        </div>
      )}
      <ImageIcon size={20} color="rgba(255,255,255,0.85)" style={{ position: 'relative', zIndex: 1 }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: '0 0 4px', letterSpacing: '-0.01em' }}>{name}</p>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', margin: 0 }}>
          {flyerCount > 0 ? `${flyerCount} flyer${flyerCount > 1 ? 's' : ''}` : 'No flyers yet'}
        </p>
      </div>
    </div>
  )
}

function FlyerCard({ row, changes, onFieldChange, onResubmit, onRevert, onSendMessage }: {
  row: any
  changes: FlyerChange[]
  onFieldChange: (field: keyof FlyerFields, value: string) => void
  onResubmit: (newImageName: string) => void
  onRevert: () => void
  onSendMessage: (text: string) => void
}) {
  const fields = toFields(row)
  const needsUpdate = !!row.update_needed
  const [showChat, setShowChat] = useState(false)
  const [draft, setDraft] = useState('')

  function handleSend() {
    if (!draft.trim()) return
    onSendMessage(draft)
    setDraft('')
  }

  return (
    <div style={{
      background: T.colors.surfaceRaised,
      border: `1px solid ${needsUpdate ? T.colors.amber : T.colors.border}`,
      borderRadius: T.radius.md, padding: '14px', overflow: 'hidden',
      boxShadow: needsUpdate ? '0 0 10px rgba(245,158,11,0.15)' : 'none',
      transition: 'border-color 0.2s ease',
    }}>

      <div style={{
        height: '120px', borderRadius: T.radius.sm, marginBottom: '12px',
        background: T.colors.bg, border: `1px solid ${T.colors.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '6px',
      }}>
        {row.image_url ? (
          <>
            <ImageIcon size={20} color={T.colors.textMuted} />
            <span style={{ fontSize: '11px', color: T.colors.textMuted, fontFamily: "'SF Mono', monospace" }}>{row.image_url}</span>
          </>
        ) : (
          <span style={{ fontSize: '12px', color: T.colors.textMuted, fontStyle: 'italic' }}>Awaiting design upload</span>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{
          fontSize: '10px', fontWeight: '700', padding: '3px 9px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.04em',
          ...(needsUpdate ? T.badge.amber : T.badge.green),
        }}>
          {needsUpdate ? 'Update Needed' : 'Live'}
        </span>
        <span style={{ fontSize: '10px', color: T.colors.textMuted, fontFamily: "'SF Mono', monospace" }}>
          {new Date(row.updated_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
        {(Object.keys(fields) as (keyof FlyerFields)[]).map(key => {
          const meta = FIELD_LABELS[key]
          const isChanged = changes.some(c => c.field === key)
          return (
            <div key={key}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: isChanged ? T.colors.amber : T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', fontWeight: isChanged ? '700' : '500' }}>
                {meta.icon} {meta.label}
              </label>
              <input
                type={key === 'date' ? 'date' : key === 'time' ? 'time' : 'text'}
                value={fields[key]}
                onChange={e => onFieldChange(key, e.target.value)}
                style={{
                  ...T.input, padding: '7px 10px', fontSize: '12px',
                  border: `1px solid ${isChanged ? 'rgba(245,158,11,0.4)' : T.colors.border}`,
                  background: isChanged ? T.colors.amberGlow : T.colors.surface,
                }}
              />
            </div>
          )
        })}
      </div>

      {needsUpdate && (
        <div style={{ borderTop: `1px solid ${T.colors.border}`, paddingTop: '12px', marginBottom: '12px' }}>
          <p style={{ fontSize: '10px', fontWeight: '700', color: T.colors.amber, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={11} /> Flagged for ClickUp
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
            {changes.map((c, i) => (
              <p key={i} style={{ fontSize: '11px', color: T.colors.textSecondary, margin: 0 }}>
                <span style={{ color: T.colors.textMuted }}>{FIELD_LABELS[c.field].label}:</span>{' '}
                <span style={{ textDecoration: 'line-through', color: T.colors.textMuted }}>{c.from}</span>
                {' → '}
                <span style={{ color: T.colors.amber, fontWeight: '600' }}>{c.to}</span>
              </p>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <label style={{
              ...T.btn.primary, fontSize: '11px', padding: '7px 12px',
              display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
              background: T.colors.amber, flex: 1, justifyContent: 'center',
            }}>
              <Upload size={11} /> Resubmit Design
              <input type="file" accept=".jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) onResubmit(f.name) }} />
            </label>
            <button onClick={onRevert} style={{ ...T.btn.ghost, fontSize: '11px', padding: '7px 12px' }}>Revert</button>
          </div>
        </div>
      )}

      <div style={{ borderTop: `1px solid ${T.colors.border}`, paddingTop: '10px' }}>
        <button onClick={() => setShowChat(!showChat)} style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 0,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '600', color: T.colors.textSecondary }}>
            <MessageSquare size={12} />
            Notes {row.messages?.length > 0 && `(${row.messages.length})`}
          </span>
          {showChat ? <ChevronUp size={12} color={T.colors.textMuted} /> : <ChevronDown size={12} color={T.colors.textMuted} />}
        </button>

        {showChat && (
          <div style={{ marginTop: '10px' }}>
            {row.messages?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px', maxHeight: '160px', overflowY: 'auto' }}>
                {row.messages.map((msg: any) => (
                  <div key={msg.id} style={{
                    background: msg.role === 'design_team' ? 'rgba(59,130,246,0.08)' : T.colors.surface,
                    border: `1px solid ${msg.role === 'design_team' ? 'rgba(59,130,246,0.15)' : T.colors.border}`,
                    borderRadius: T.radius.sm, padding: '8px 10px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: msg.role === 'design_team' ? '#3b82f6' : T.colors.textSecondary }}>{msg.author_name}</span>
                      <span style={{ fontSize: '9px', color: T.colors.textMuted, fontFamily: "'SF Mono', monospace" }}>{timeAgo(msg.created_at)}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: T.colors.textSecondary, margin: 0, lineHeight: 1.4 }}>{msg.note}</p>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
                placeholder="Message the design team..."
                style={{ ...T.input, flex: 1, padding: '7px 10px', fontSize: '12px' }}
              />
              <button onClick={handleSend} style={{
                ...T.btn.primary, padding: '7px 10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Send size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}