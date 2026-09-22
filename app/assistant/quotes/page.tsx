'use client'

import { useState, useEffect } from 'react'
import { FileText, Plus, Send, Eye, AlertCircle, ShoppingBag, Mail, ChevronDown, ChevronUp } from 'lucide-react'
import { theme } from '../../components/theme'
import { listActiveClubs, getClubPricing, listQuotesForClub, createQuote, listProShopRequests, createProShopRequest, ClubPricingRow } from './actions'

const T = theme

const COMPANY = {
  name: 'FI OPERATIONS (PTY) LTD',
  addressLines: ['Leinster Hall', '7 Weltevreden Street', 'Gardens', 'Western Cape', '8001'],
  regNo: '1965/010057/07',
  vat: '4230154066',
  bank: 'First National Bank',
  accountNumber: '630 5620 8995',
}

interface CourtLine { courtIndex: number; session: 'Peak' | 'Off-Peak'; hours: number; discountPct: number }
interface ExtraLine { type: 'Coach' | 'Balls' | 'Racket Rental' | 'Venue Hire Exclusivity'; qty: number; discountPct: number }
interface FreeTextLine { description: string; cost: number; qty: number; discountPct: number }

const defaultCourtLine = (): CourtLine => ({ courtIndex: 0, session: 'Peak', hours: 1, discountPct: 0 })
const defaultExtraLine = (): ExtraLine => ({ type: 'Coach', qty: 1, discountPct: 0 })
const defaultFreeTextLine = (): FreeTextLine => ({ description: '', cost: 0, qty: 1, discountPct: 0 })

const fieldLabel: React.CSSProperties = {
  fontSize: '11px', fontWeight: '600', color: T.colors.textSecondary,
  textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '7px',
}

function calcLineTotal(price: number, qtyOrHours: number, discountPct: number) {
  const perUnitLess = price - price * (discountPct / 100)
  return perUnitLess * qtyOrHours
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const hrs = Math.floor(diff / (1000 * 60 * 60))
  if (hrs < 1) return 'Just now'
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const STAGE_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  sent_back_for_changes: 'Sent Back for Changes',
  approved: 'Approved',
  invoiced: 'Invoiced',
  sent: 'Sent',
  paid: 'Paid',
}

export default function QuoteGeneratorPage1() {
  const [mode, setMode] = useState<'events' | 'proshop'>('events')
  const [clubs, setClubs] = useState<{ id: string; name: string }[]>([])
  const [quotes, setQuotes] = useState<any[]>([])
  const [proShopRequests, setProShopRequests] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showProShopForm, setShowProShopForm] = useState(false)
  const [previewQuote, setPreviewQuote] = useState<any | null>(null)
  const [previewPricing, setPreviewPricing] = useState<ClubPricingRow | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const c = await listActiveClubs()
      setClubs(c)
      if (c.length > 0) setClub(c[0].id)
      await reloadLists()
      setLoading(false)
    }
    init()
  }, [])

  async function reloadLists() {
    setQuotes(await listQuotesForClub())
    setProShopRequests(await listProShopRequests())
  }

  // ── Event quote form state ──────────────────────────────────────────────
  const [club, setClub] = useState('')
  const [pricing, setPricing] = useState<ClubPricingRow | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [eventType, setEventType] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [pax, setPax] = useState(0)
  const [invoicingCompany, setInvoicingCompany] = useState('')
  const [invoicingAddress, setInvoicingAddress] = useState('')
  const [invoicingVat, setInvoicingVat] = useState('')
  const [courtLines, setCourtLines] = useState<CourtLine[]>([defaultCourtLine()])
  const [extraLines, setExtraLines] = useState<ExtraLine[]>([])
  const [freeTextLines, setFreeTextLines] = useState<FreeTextLine[]>([])
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!club) return
    getClubPricing(club).then(setPricing)
  }, [club])

  const resetForm = () => {
    setCustomerName(''); setCustomerPhone(''); setCustomerEmail('')
    setEventType(''); setEventDate(''); setEventTime(''); setPax(0)
    setInvoicingCompany(''); setInvoicingAddress(''); setInvoicingVat('')
    setCourtLines([defaultCourtLine()]); setExtraLines([]); setFreeTextLines([]); setNotes('')
  }

  const calcQuoteTotal = (p: ClubPricingRow | null, lines: { courtLines: CourtLine[]; extraLines: ExtraLine[]; freeTextLines: FreeTextLine[] }) => {
    if (!p) return 0
    let total = 0
    lines.courtLines.forEach(line => {
      const rate = p.courtRates[line.courtIndex]
      const price = line.session === 'Peak' ? rate?.peak ?? 0 : rate?.offPeak ?? 0
      total += calcLineTotal(price, line.hours, line.discountPct)
    })
    lines.extraLines.forEach(line => {
      const priceMap = { Coach: p.extras.coachHourly, Balls: p.extras.balls, 'Racket Rental': p.extras.racketRental, 'Venue Hire Exclusivity': p.extras.venueHireExclusivity }
      total += calcLineTotal(priceMap[line.type], line.qty, line.discountPct)
    })
    lines.freeTextLines.forEach(line => {
      total += calcLineTotal(line.cost, line.qty, line.discountPct)
    })
    return total
  }

  const currentTotal = calcQuoteTotal(pricing, { courtLines, extraLines, freeTextLines })
  const currentExclVat = currentTotal / 1.15
  const currentVat = currentTotal - currentExclVat
  const hasAnyDiscount = [...courtLines, ...extraLines, ...freeTextLines].some(l => l.discountPct > 0)
  const selectedClubName = clubs.find(c => c.id === club)?.name ?? ''

  async function handleSubmit(status: 'draft' | 'pending_approval') {
    if (!customerName || !pricing) return
    await createQuote({
      clubId: club, customerName, customerPhone, customerEmail,
      eventType, eventDate, eventTime, pax,
      invoicingCompany, invoicingAddress, invoicingVat,
      courtLines, extraLines, freeTextLines, notes,
      subtotal: currentTotal, status, popEmail: pricing.popEmail,
    })
    resetForm()
    setShowForm(false)
    await reloadLists()
  }

  async function openPreview(q: any) {
    const p = await getClubPricing(q.club_id)
    setPreviewPricing(p)
    setPreviewQuote(q)
  }

  function previewDraft() {
    setPreviewPricing(pricing)
    setPreviewQuote({
      club_id: club,
      clubs: { name: selectedClubName },
      client_name: customerName, client_phone: customerPhone, client_email: customerEmail,
      event_type: eventType, event_date: eventDate, event_time: eventTime, pax,
      invoicing_company: invoicingCompany, invoicing_address: invoicingAddress, invoicing_vat: invoicingVat,
      line_items: { courtLines, extraLines, freeTextLines },
      notes, created_at: new Date().toISOString(),
    })
  }

  // ── Pro Shop form state ──────────────────────────────────────────────────
  const [psClub, setPsClub] = useState('')
  const [psPersonName, setPsPersonName] = useState('')
  const [psPersonType, setPsPersonType] = useState<'staff' | 'ambassador'>('staff')
  const [psItemType, setPsItemType] = useState('')
  const [psItemName, setPsItemName] = useState('')
  const [psPrice, setPsPrice] = useState(0)
  const [psIluNumber, setPsIluNumber] = useState('')
  const [psDetails, setPsDetails] = useState('')

  useEffect(() => { if (clubs.length > 0 && !psClub) setPsClub(clubs[0].id) }, [clubs])

  const resetProShopForm = () => {
    setPsPersonName(''); setPsPersonType('staff')
    setPsItemType(''); setPsItemName(''); setPsPrice(0); setPsIluNumber(''); setPsDetails('')
  }

  async function submitProShopRequest() {
    if (!psPersonName || !psItemName) return
    const p = await getClubPricing(psClub)
    await createProShopRequest({
      clubId: psClub, personName: psPersonName, personType: psPersonType,
      itemType: psItemType, itemName: psItemName, price: psPrice, iluNumber: psIluNumber,
      details: psDetails, popEmail: p.popEmail,
    })
    resetProShopForm()
    setShowProShopForm(false)
    await reloadLists()
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', background: T.colors.bg, padding: '32px 36px', color: T.colors.textSecondary }}>Loading...</div>
  }

  return (
    <div style={{ minHeight: '100vh', background: T.colors.bg }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 36px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 10px rgba(168,85,247,0.4)' }} />
              <span style={{ fontSize: '11px', color: '#a855f7', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI Assistant</span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: T.colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>Quote Requests</h1>
            <p style={{ fontSize: '13px', color: T.colors.textSecondary, marginTop: '5px' }}>
              Manager → Head Office · Event quotes and pro shop discount requests
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
          {([['events', 'Event Quotes', FileText], ['proshop', 'Pro Shop Discounts', ShoppingBag]] as const).map(([m, label, Icon]) => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: '9px 18px', borderRadius: T.radius.sm, fontFamily: 'inherit', cursor: 'pointer',
              fontSize: '13px', fontWeight: mode === m ? '600' : '400',
              background: mode === m ? '#a855f7' : T.colors.surfaceRaised,
              color: mode === m ? '#fff' : T.colors.textSecondary,
              border: `1px solid ${mode === m ? '#a855f7' : T.colors.border}`,
              display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: mode === m ? '0 0 12px rgba(168,85,247,0.3)' : 'none',
            }}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {mode === 'events' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button onClick={() => setShowForm(!showForm)} style={{
                ...T.btn.primary, background: showForm ? '#8b3fd6' : '#a855f7',
                boxShadow: '0 0 16px rgba(168,85,247,0.3)', display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <Plus size={14} /> New Event Quote
              </button>
            </div>

            {showForm && pricing && (
              <div style={{ ...T.card, marginBottom: '20px', border: `1px solid rgba(168,85,247,0.3)`, boxShadow: '0 0 16px rgba(168,85,247,0.12)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary }}>New Event Quote</span>
                  <button onClick={() => { setShowForm(false); resetForm() }} style={{ background: 'none', border: 'none', color: T.colors.textMuted, cursor: 'pointer', fontSize: '18px', padding: 0 }}>×</button>
                </div>

                <p style={{ fontSize: '10px', fontWeight: '700', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Client Details</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={fieldLabel}>Club</label>
                    <select value={club} onChange={e => setClub(e.target.value)} style={{ ...T.input, cursor: 'pointer' }}>
                      {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={fieldLabel}>Full Name of Client</label>
                    <input value={customerName} onChange={e => setCustomerName(e.target.value)} style={T.input} />
                  </div>
                  <div>
                    <label style={fieldLabel}>Telephone Number</label>
                    <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} style={T.input} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={fieldLabel}>Email Address</label>
                    <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} style={T.input} />
                  </div>
                  <div>
                    <label style={fieldLabel}>Type of Event</label>
                    <input value={eventType} onChange={e => setEventType(e.target.value)} placeholder="e.g. Birthday Tournament" style={T.input} />
                  </div>
                  <div>
                    <label style={fieldLabel}>Date of Event</label>
                    <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} style={T.input} />
                  </div>
                  <div>
                    <label style={fieldLabel}>Time of Event</label>
                    <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} style={T.input} />
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={fieldLabel}>PAX (headcount)</label>
                  <input type="number" min={0} value={pax || ''} onChange={e => setPax(parseInt(e.target.value) || 0)} style={{ ...T.input, maxWidth: '160px' }} />
                </div>

                <p style={{ fontSize: '10px', fontWeight: '700', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Invoicing Details (optional, for corporate bookings)</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                  <div>
                    <label style={fieldLabel}>Company Name</label>
                    <input value={invoicingCompany} onChange={e => setInvoicingCompany(e.target.value)} style={T.input} />
                  </div>
                  <div>
                    <label style={fieldLabel}>Address</label>
                    <input value={invoicingAddress} onChange={e => setInvoicingAddress(e.target.value)} style={T.input} />
                  </div>
                  <div>
                    <label style={fieldLabel}>VAT Number</label>
                    <input value={invoicingVat} onChange={e => setInvoicingVat(e.target.value)} style={T.input} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <p style={{ fontSize: '10px', fontWeight: '700', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Court Hire</p>
                  <button onClick={() => setCourtLines(prev => [...prev, defaultCourtLine()])} style={{ fontSize: '12px', color: '#a855f7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit', padding: 0 }}>+ Add court line</button>
                </div>
                {courtLines.map((line, idx) => {
                  const rate = pricing.courtRates[line.courtIndex]
                  const price = line.session === 'Peak' ? rate?.peak ?? 0 : rate?.offPeak ?? 0
                  const lineTotal = calcLineTotal(price, line.hours, line.discountPct)
                  return (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '110px 100px 90px 70px 110px 24px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                      <select value={line.courtIndex} style={{ ...T.input, padding: '8px 10px', fontSize: '13px' }}
                        onChange={e => setCourtLines(prev => prev.map((l, i) => i === idx ? { ...l, courtIndex: parseInt(e.target.value) } : l))}>
                        {pricing.courtRates.map((_, ci) => <option key={ci} value={ci}>Court {ci + 1}</option>)}
                      </select>
                      <select value={line.session} style={{ ...T.input, padding: '8px 10px', fontSize: '13px' }}
                        onChange={e => setCourtLines(prev => prev.map((l, i) => i === idx ? { ...l, session: e.target.value as 'Peak' | 'Off-Peak' } : l))}>
                        <option value="Peak">Peak</option>
                        <option value="Off-Peak">Off-Peak</option>
                      </select>
                      <input type="number" min={0} step={0.5} value={line.hours} placeholder="Hours" style={{ ...T.input, padding: '8px 10px', fontSize: '13px', textAlign: 'center' }}
                        onChange={e => setCourtLines(prev => prev.map((l, i) => i === idx ? { ...l, hours: parseFloat(e.target.value) || 0 } : l))} />
                      <input type="number" min={0} max={100} value={line.discountPct || ''} placeholder="Disc%" style={{ ...T.input, padding: '8px 10px', fontSize: '13px', textAlign: 'center' }}
                        onChange={e => setCourtLines(prev => prev.map((l, i) => i === idx ? { ...l, discountPct: parseInt(e.target.value) || 0 } : l))} />
                      <span style={{ fontSize: '13px', color: T.colors.textPrimary, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>R {lineTotal.toFixed(0)}</span>
                      <button onClick={() => setCourtLines(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: T.colors.textMuted, cursor: 'pointer', fontSize: '16px', padding: 0 }}>×</button>
                    </div>
                  )
                })}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', marginBottom: '10px' }}>
                  <p style={{ fontSize: '10px', fontWeight: '700', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Extras</p>
                  <button onClick={() => setExtraLines(prev => [...prev, defaultExtraLine()])} style={{ fontSize: '12px', color: '#a855f7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit', padding: 0 }}>+ Add extra</button>
                </div>
                {extraLines.map((line, idx) => {
                  const priceMap = { Coach: pricing.extras.coachHourly, Balls: pricing.extras.balls, 'Racket Rental': pricing.extras.racketRental, 'Venue Hire Exclusivity': pricing.extras.venueHireExclusivity }
                  const lineTotal = calcLineTotal(priceMap[line.type], line.qty, line.discountPct)
                  return (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 70px 110px 24px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                      <select value={line.type} style={{ ...T.input, padding: '8px 10px', fontSize: '13px' }}
                        onChange={e => setExtraLines(prev => prev.map((l, i) => i === idx ? { ...l, type: e.target.value as ExtraLine['type'] } : l))}>
                        {(['Coach', 'Balls', 'Racket Rental', 'Venue Hire Exclusivity'] as const).map(t => <option key={t} value={t}>{t} — R{priceMap[t]}</option>)}
                      </select>
                      <input type="number" min={1} value={line.qty} placeholder="Qty" style={{ ...T.input, padding: '8px 10px', fontSize: '13px', textAlign: 'center' }}
                        onChange={e => setExtraLines(prev => prev.map((l, i) => i === idx ? { ...l, qty: parseInt(e.target.value) || 1 } : l))} />
                      <input type="number" min={0} max={100} value={line.discountPct || ''} placeholder="Disc%" style={{ ...T.input, padding: '8px 10px', fontSize: '13px', textAlign: 'center' }}
                        onChange={e => setExtraLines(prev => prev.map((l, i) => i === idx ? { ...l, discountPct: parseInt(e.target.value) || 0 } : l))} />
                      <span style={{ fontSize: '13px', color: T.colors.textPrimary, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>R {lineTotal.toFixed(0)}</span>
                      <button onClick={() => setExtraLines(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: T.colors.textMuted, cursor: 'pointer', fontSize: '16px', padding: 0 }}>×</button>
                    </div>
                  )
                })}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', marginBottom: '10px' }}>
                  <p style={{ fontSize: '10px', fontWeight: '700', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Other Items (prizes, etc.)</p>
                  <button onClick={() => setFreeTextLines(prev => [...prev, defaultFreeTextLine()])} style={{ fontSize: '12px', color: '#a855f7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit', padding: 0 }}>+ Add item</button>
                </div>
                {freeTextLines.map((line, idx) => {
                  const lineTotal = calcLineTotal(line.cost, line.qty, line.discountPct)
                  return (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 60px 70px 110px 24px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                      <input value={line.description} placeholder="Description" style={{ ...T.input, padding: '8px 10px', fontSize: '13px' }}
                        onChange={e => setFreeTextLines(prev => prev.map((l, i) => i === idx ? { ...l, description: e.target.value } : l))} />
                      <input type="number" min={0} value={line.cost || ''} placeholder="Cost" style={{ ...T.input, padding: '8px 10px', fontSize: '13px' }}
                        onChange={e => setFreeTextLines(prev => prev.map((l, i) => i === idx ? { ...l, cost: parseFloat(e.target.value) || 0 } : l))} />
                      <input type="number" min={1} value={line.qty} placeholder="Qty" style={{ ...T.input, padding: '8px 10px', fontSize: '13px', textAlign: 'center' }}
                        onChange={e => setFreeTextLines(prev => prev.map((l, i) => i === idx ? { ...l, qty: parseInt(e.target.value) || 1 } : l))} />
                      <input type="number" min={0} max={100} value={line.discountPct || ''} placeholder="Disc%" style={{ ...T.input, padding: '8px 10px', fontSize: '13px', textAlign: 'center' }}
                        onChange={e => setFreeTextLines(prev => prev.map((l, i) => i === idx ? { ...l, discountPct: parseInt(e.target.value) || 0 } : l))} />
                      <span style={{ fontSize: '13px', color: T.colors.textPrimary, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>R {lineTotal.toFixed(0)}</span>
                      <button onClick={() => setFreeTextLines(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: T.colors.textMuted, cursor: 'pointer', fontSize: '16px', padding: 0 }}>×</button>
                    </div>
                  )
                })}

                {hasAnyDiscount && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: T.colors.amberGlow, border: '1px solid rgba(245,158,11,0.2)', borderRadius: T.radius.sm, marginTop: '16px' }}>
                    <AlertCircle size={13} color={T.colors.amber} />
                    <span style={{ fontSize: '12px', color: T.colors.amber }}>This quote includes a discount — Head Office approval is required before it can be invoiced.</span>
                  </div>
                )}

                <div style={{ marginTop: '16px' }}>
                  <label style={fieldLabel}>Additional Notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...T.input, resize: 'vertical', fontFamily: 'inherit' }} />
                </div>

                <div style={{ marginTop: '20px', padding: '14px 18px', background: T.colors.surfaceRaised, border: `1px solid ${T.colors.borderBright}`, borderRadius: T.radius.md, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Total Excl. VAT</p>
                    <p style={{ fontSize: '14px', color: T.colors.textSecondary, margin: 0, fontFamily: "'SF Mono', monospace" }}>R {currentExclVat.toFixed(2)}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>VAT</p>
                    <p style={{ fontSize: '14px', color: T.colors.textSecondary, margin: 0, fontFamily: "'SF Mono', monospace" }}>R {currentVat.toFixed(2)}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Total Incl. VAT</p>
                    <p style={{ fontSize: '20px', fontWeight: '700', color: T.colors.textPrimary, margin: 0, fontFamily: "'SF Mono', monospace" }}>R {currentTotal.toFixed(2)}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button onClick={previewDraft} style={{ ...T.btn.secondary, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Eye size={13} /> Preview Quote
                  </button>
                  <button onClick={() => handleSubmit('pending_approval')} disabled={!customerName} style={{
                    ...T.btn.primary, background: '#a855f7', boxShadow: '0 0 12px rgba(168,85,247,0.3)',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    opacity: !customerName ? 0.4 : 1, cursor: !customerName ? 'not-allowed' : 'pointer',
                  }}>
                    <Send size={13} /> Send to Head Office
                  </button>
                  <button onClick={() => handleSubmit('draft')} disabled={!customerName} style={{ ...T.btn.ghost, opacity: !customerName ? 0.4 : 1 }}>Save Draft</button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {quotes.length === 0 && (
                <div style={{ ...T.card, textAlign: 'center', padding: '40px', color: T.colors.textMuted }}>No event quotes yet.</div>
              )}
              {quotes.map((quote: any) => {
                const isOpen = expandedId === quote.id
                const total = quote.total ?? 0
                const stageLabel = STAGE_LABELS[quote.status] ?? quote.status
                const stageColor = quote.status === 'draft' ? T.colors.textSecondary : quote.status === 'pending_approval' ? T.colors.amber : T.colors.red
                const stageBg = quote.status === 'draft' ? T.colors.surfaceRaised : quote.status === 'pending_approval' ? T.colors.amberGlow : T.colors.redGlow
                const emailLog = quote.email_log ?? []

                return (
                  <div key={quote.id} style={{ background: T.colors.surface, borderRadius: T.radius.lg, border: `1px solid ${isOpen ? '#a855f7' : T.colors.border}`, overflow: 'hidden' }}>
                    <div onClick={() => setExpandedId(isOpen ? null : quote.id)} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 130px 100px 24px', alignItems: 'center', padding: '14px 18px', cursor: 'pointer', gap: '14px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: T.colors.textSecondary, fontFamily: "'SF Mono', monospace" }}>{quote.clubs?.name ?? ''}</span>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary, margin: 0 }}>{quote.client_name}</p>
                        <p style={{ fontSize: '11px', color: T.colors.textMuted, margin: '3px 0 0', fontFamily: "'SF Mono', monospace" }}>
                          {quote.event_date ? new Date(quote.event_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) : 'No date'} · R {total.toFixed(0)}
                        </p>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: '600', padding: '4px 10px', borderRadius: '999px', textAlign: 'center', color: stageColor, background: stageBg }}>{stageLabel}</span>
                      <span style={{ fontSize: '11px', color: T.colors.textMuted, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>{timeAgo(quote.created_at)}</span>
                      {isOpen ? <ChevronUp size={14} color={T.colors.textMuted} /> : <ChevronDown size={14} color={T.colors.textMuted} />}
                    </div>

                    {isOpen && (
                      <div style={{ borderTop: `1px solid ${T.colors.border}`, padding: '16px 18px', background: T.colors.bg, display: 'flex', gap: '10px' }}>
                        <button onClick={() => openPreview(quote)} style={{ ...T.btn.secondary, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                          <Eye size={12} /> Preview
                        </button>
                        {emailLog.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: T.colors.textMuted }}>
                            <Mail size={11} /> Sent to {emailLog[emailLog.length - 1].to} · {timeAgo(emailLog[emailLog.length - 1].timestamp)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {mode === 'proshop' && (
          <>
            <div style={{ ...T.card, marginBottom: '20px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShoppingBag size={16} color={T.colors.textMuted} />
              <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: 0 }}>
                For staff and ambassador discounts on pro shop items. Head Office reviews and sends back an invoice — no client involved in this flow.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button onClick={() => setShowProShopForm(!showProShopForm)} style={{ ...T.btn.primary, background: showProShopForm ? '#8b3fd6' : '#a855f7', boxShadow: '0 0 16px rgba(168,85,247,0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={14} /> New Discount Request
              </button>
            </div>

            {showProShopForm && (
              <div style={{ ...T.card, marginBottom: '20px', border: `1px solid rgba(168,85,247,0.3)`, boxShadow: '0 0 16px rgba(168,85,247,0.12)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary }}>New Pro Shop Discount Request</span>
                  <button onClick={() => { setShowProShopForm(false); resetProShopForm() }} style={{ background: 'none', border: 'none', color: T.colors.textMuted, cursor: 'pointer', fontSize: '18px', padding: 0 }}>×</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={fieldLabel}>Club</label>
                    <select value={psClub} onChange={e => setPsClub(e.target.value)} style={{ ...T.input, cursor: 'pointer' }}>
                      {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={fieldLabel}>Person Name</label>
                    <input value={psPersonName} onChange={e => setPsPersonName(e.target.value)} style={T.input} />
                  </div>
                  <div>
                    <label style={fieldLabel}>Type</label>
                    <select value={psPersonType} onChange={e => setPsPersonType(e.target.value as 'staff' | 'ambassador')} style={{ ...T.input, cursor: 'pointer' }}>
                      <option value="staff">Staff</option>
                      <option value="ambassador">Ambassador</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={fieldLabel}>Item Type</label>
                    <input value={psItemType} onChange={e => setPsItemType(e.target.value)} placeholder="e.g. Racket, Apparel, Balls" style={T.input} />
                  </div>
                  <div>
                    <label style={fieldLabel}>Item Name</label>
                    <input value={psItemName} onChange={e => setPsItemName(e.target.value)} placeholder="e.g. Adidas Metalbone HRD+ 2026" style={T.input} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={fieldLabel}>Price (R)</label>
                    <input type="number" min={0} value={psPrice || ''} onChange={e => setPsPrice(parseFloat(e.target.value) || 0)} style={T.input} />
                  </div>
                  <div>
                    <label style={fieldLabel}>ILU Number</label>
                    <input value={psIluNumber} onChange={e => setPsIluNumber(e.target.value)} style={T.input} />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={fieldLabel}>Additional Details</label>
                  <textarea value={psDetails} onChange={e => setPsDetails(e.target.value)} rows={2} style={{ ...T.input, resize: 'vertical', fontFamily: 'inherit' }} />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={submitProShopRequest} disabled={!psPersonName || !psItemName} style={{
                    ...T.btn.primary, background: '#a855f7', boxShadow: '0 0 12px rgba(168,85,247,0.3)',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    opacity: (!psPersonName || !psItemName) ? 0.4 : 1,
                  }}>
                    <Send size={13} /> Send to Head Office
                  </button>
                  <button onClick={() => { setShowProShopForm(false); resetProShopForm() }} style={T.btn.secondary}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {proShopRequests.length === 0 && (
                <div style={{ ...T.card, textAlign: 'center', padding: '40px', color: T.colors.textMuted }}>No discount requests yet.</div>
              )}
              {proShopRequests.map((req: any) => (
                <div key={req.id} style={{ ...T.card, marginBottom: 0, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary, margin: 0 }}>{req.item_name}</p>
                        <span style={{ fontSize: '9px', fontWeight: '700', padding: '2px 7px', borderRadius: '999px', background: T.colors.surfaceRaised, color: T.colors.textSecondary }}>{req.person_type}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: T.colors.textSecondary, margin: 0 }}>{req.person_name} · {req.clubs?.name} · R{req.price?.toFixed(0)} · ILU {req.ilu_number}</p>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: '600', padding: '4px 10px', borderRadius: '999px', background: req.status === 'invoice_received' ? T.colors.greenGlow : T.colors.amberGlow, color: req.status === 'invoice_received' ? T.colors.green : T.colors.amber }}>
                      {req.status === 'invoice_received' ? 'Invoice Received' : 'Pending Approval'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {previewQuote && previewPricing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '32px' }}>
          <div style={{ background: '#fff', borderRadius: '8px', maxWidth: '640px', width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '40px', color: '#1a1a1a', fontFamily: "'Arial', sans-serif" }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <p style={{ fontWeight: '700', fontSize: '14px', margin: 0 }}>{COMPANY.name}</p>
                {COMPANY.addressLines.map((l, i) => <p key={i} style={{ fontSize: '12px', margin: '2px 0', color: '#555' }}>{l}</p>)}
                <p style={{ fontSize: '11px', margin: '8px 0 0', color: '#888' }}>REG NO# {COMPANY.regNo}</p>
                <p style={{ fontSize: '11px', margin: '2px 0', color: '#888' }}>VAT: {COMPANY.vat}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: '700', fontSize: '16px', margin: 0 }}>{(previewQuote.clubs?.name ?? '').toUpperCase()} - QUOTE</p>
                <p style={{ fontSize: '11px', color: '#888', margin: '8px 0 0' }}>DATE: {new Date(previewQuote.created_at).toLocaleDateString('en-ZA')}</p>
              </div>
            </div>

            <p style={{ fontWeight: '700', fontSize: '12px', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '8px' }}>CLIENT DETAILS</p>
            <table style={{ width: '100%', fontSize: '12px', marginBottom: '20px' }}>
              <tbody>
                <tr><td style={{ padding: '2px 0', color: '#888' }}>FULL NAME</td><td>{previewQuote.client_name}</td></tr>
                <tr><td style={{ padding: '2px 0', color: '#888' }}>PHONE</td><td>{previewQuote.client_phone}</td></tr>
                <tr><td style={{ padding: '2px 0', color: '#888' }}>EMAIL</td><td>{previewQuote.client_email}</td></tr>
                <tr><td style={{ padding: '2px 0', color: '#888' }}>TYPE OF EVENT</td><td>{previewQuote.event_type}</td></tr>
                <tr><td style={{ padding: '2px 0', color: '#888' }}>DATE</td><td>{previewQuote.event_date}</td></tr>
                <tr><td style={{ padding: '2px 0', color: '#888' }}>TIME</td><td>{previewQuote.event_time}</td></tr>
                <tr><td style={{ padding: '2px 0', color: '#888' }}>PAX</td><td>{previewQuote.pax}</td></tr>
              </tbody>
            </table>

            {previewQuote.invoicing_company && (
              <>
                <p style={{ fontWeight: '700', fontSize: '12px', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '8px' }}>INVOICING DETAILS</p>
                <table style={{ width: '100%', fontSize: '12px', marginBottom: '20px' }}>
                  <tbody>
                    <tr><td style={{ padding: '2px 0', color: '#888' }}>COMPANY</td><td>{previewQuote.invoicing_company}</td></tr>
                    <tr><td style={{ padding: '2px 0', color: '#888' }}>ADDRESS</td><td>{previewQuote.invoicing_address}</td></tr>
                    <tr><td style={{ padding: '2px 0', color: '#888' }}>VAT NUMBER</td><td>{previewQuote.invoicing_vat}</td></tr>
                  </tbody>
                </table>
              </>
            )}

            <p style={{ fontWeight: '700', fontSize: '12px', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '8px' }}>EVENT REQUIREMENTS</p>
            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', marginBottom: '16px' }}>
              <thead>
                <tr style={{ background: '#1a1a1a', color: '#fff' }}>
                  <th style={{ padding: '6px', textAlign: 'left' }}>Item</th>
                  <th style={{ padding: '6px', textAlign: 'right' }}>Price</th>
                  <th style={{ padding: '6px', textAlign: 'right' }}>Qty/Hrs</th>
                  <th style={{ padding: '6px', textAlign: 'right' }}>Disc%</th>
                  <th style={{ padding: '6px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(previewQuote.line_items?.courtLines ?? []).map((line: CourtLine, i: number) => {
                  const rate = previewPricing.courtRates[line.courtIndex]
                  const price = line.session === 'Peak' ? rate?.peak ?? 0 : rate?.offPeak ?? 0
                  const total = calcLineTotal(price, line.hours, line.discountPct)
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '6px' }}>Court {line.courtIndex + 1} Hire / {line.session}</td>
                      <td style={{ padding: '6px', textAlign: 'right' }}>R{price}</td>
                      <td style={{ padding: '6px', textAlign: 'right' }}>{line.hours}</td>
                      <td style={{ padding: '6px', textAlign: 'right' }}>{line.discountPct}%</td>
                      <td style={{ padding: '6px', textAlign: 'right' }}>R{total.toFixed(0)}</td>
                    </tr>
                  )
                })}
                {(previewQuote.line_items?.extraLines ?? []).map((line: ExtraLine, i: number) => {
                  const priceMap = { Coach: previewPricing.extras.coachHourly, Balls: previewPricing.extras.balls, 'Racket Rental': previewPricing.extras.racketRental, 'Venue Hire Exclusivity': previewPricing.extras.venueHireExclusivity }
                  const total = calcLineTotal(priceMap[line.type], line.qty, line.discountPct)
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '6px' }}>{line.type}</td>
                      <td style={{ padding: '6px', textAlign: 'right' }}>R{priceMap[line.type]}</td>
                      <td style={{ padding: '6px', textAlign: 'right' }}>{line.qty}</td>
                      <td style={{ padding: '6px', textAlign: 'right' }}>{line.discountPct}%</td>
                      <td style={{ padding: '6px', textAlign: 'right' }}>R{total.toFixed(0)}</td>
                    </tr>
                  )
                })}
                {(previewQuote.line_items?.freeTextLines ?? []).map((line: FreeTextLine, i: number) => {
                  const total = calcLineTotal(line.cost, line.qty, line.discountPct)
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '6px' }}>{line.description}</td>
                      <td style={{ padding: '6px', textAlign: 'right' }}>R{line.cost}</td>
                      <td style={{ padding: '6px', textAlign: 'right' }}>{line.qty}</td>
                      <td style={{ padding: '6px', textAlign: 'right' }}>{line.discountPct}%</td>
                      <td style={{ padding: '6px', textAlign: 'right' }}>R{total.toFixed(0)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {(() => {
              const total = calcQuoteTotal(previewPricing, {
                courtLines: previewQuote.line_items?.courtLines ?? [],
                extraLines: previewQuote.line_items?.extraLines ?? [],
                freeTextLines: previewQuote.line_items?.freeTextLines ?? [],
              })
              const exclVat = total / 1.15
              const vat = total - exclVat
              return (
                <table style={{ width: '100%', fontSize: '12px', marginBottom: '20px' }}>
                  <tbody>
                    <tr><td style={{ textAlign: 'right', padding: '2px 0', color: '#888' }}>TOTAL EXCL. VAT</td><td style={{ textAlign: 'right', width: '90px' }}>R {exclVat.toFixed(2)}</td></tr>
                    <tr><td style={{ textAlign: 'right', padding: '2px 0', color: '#888' }}>VAT</td><td style={{ textAlign: 'right' }}>R {vat.toFixed(2)}</td></tr>
                    <tr><td style={{ textAlign: 'right', padding: '4px 0', fontWeight: '700' }}>TOTAL INCL. VAT</td><td style={{ textAlign: 'right', fontWeight: '700' }}>R {total.toFixed(2)}</td></tr>
                  </tbody>
                </table>
              )
            })()}

            {previewQuote.notes && (
              <>
                <p style={{ fontWeight: '700', fontSize: '11px', margin: '0 0 4px' }}>ADDITIONAL IMPORTANT NOTES:</p>
                <p style={{ fontSize: '12px', color: '#555', marginBottom: '20px' }}>{previewQuote.notes}</p>
              </>
            )}

            <div style={{ borderTop: '1px solid #ddd', paddingTop: '12px', fontSize: '11px', color: '#888' }}>
              <p style={{ fontWeight: '700', margin: '0 0 4px' }}>BANKING DETAILS:</p>
              <p style={{ margin: '2px 0' }}>{COMPANY.name}</p>
              <p style={{ margin: '2px 0' }}>{COMPANY.bank}</p>
              <p style={{ margin: '2px 0' }}>Account Number {COMPANY.accountNumber}</p>
              <p style={{ margin: '2px 0' }}>Reference: Invoice Number/Event Name &amp; Date</p>
              <p style={{ margin: '2px 0' }}>Send proof of payment to {previewPricing.popEmail}</p>
            </div>

            <button onClick={() => { setPreviewQuote(null); setPreviewPricing(null) }} style={{ ...T.btn.secondary, marginTop: '20px', color: '#1a1a1a', border: '1px solid #ddd' }}>Close Preview</button>
          </div>
        </div>
      )}
    </div>
  )
}
