'use client'

import { useState } from 'react'
import { FileText, Plus, Send, CheckCircle2, XCircle, Upload, Mail, Clock, ChevronDown, ChevronUp, AlertCircle, X, Percent } from 'lucide-react'
import { theme } from '../../components/theme'

const T = theme

const CLUB_NAMES = ['BALLITO','BEDFORDVIEW','CENTURION','DURBANVILLE','EPICENTRE','GATEWAY','GEORGE','GLEN','GROENKLOOF','HUDDLE','LORRAINE','LOURENSFORD','LONEHILL','OLD EDS','POINT','RANDPARK','WOODSTOCK']

// ── Pipeline stages ──────────────────────────────────────────────────────────
type QuoteStage = 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Invoiced' | 'Awaiting POP' | 'Closed'

const STAGE_COLORS: Record<QuoteStage, { color: string; bg: string; border: string }> = {
  Draft:             { color: T.colors.textSecondary, bg: T.colors.surfaceRaised, border: T.colors.border },
  'Pending Approval':{ color: T.colors.amber, bg: T.colors.amberGlow, border: 'rgba(245,158,11,0.2)' },
  Approved:          { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
  Rejected:          { color: T.colors.red, bg: T.colors.redGlow, border: 'rgba(224,10,9,0.2)' },
  Invoiced:          { color: '#a855f7', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.2)' },
  'Awaiting POP':     { color: T.colors.amber, bg: T.colors.amberGlow, border: 'rgba(245,158,11,0.2)' },
  Closed:            { color: T.colors.green, bg: T.colors.greenGlow, border: 'rgba(34,197,94,0.2)' },
}

const STAGE_ORDER: QuoteStage[] = ['Draft', 'Pending Approval', 'Approved', 'Rejected', 'Invoiced', 'Awaiting POP', 'Closed']

interface QuoteItem {
  description: string
  quantity: number
  unitPrice: number
}

interface Quote {
  id: number
  club: string
  customerName: string
  customerEmail: string
  customerPhone: string
  eventDate: string
  items: QuoteItem[]
  discountPct: number
  discountReason: string
  notes: string
  stage: QuoteStage
  createdDate: string
  popFileName: string | null
  emailLog: { type: string; to: string; timestamp: string }[]
  clickupTaskId?: string // placeholder seam for future automation reference
}

const defaultItem = (): QuoteItem => ({ description: '', quantity: 1, unitPrice: 0 })

const MOCK_QUOTES: Quote[] = [
  {
    id: 1, club: 'WOODSTOCK', customerName: 'Sarah Bennett', customerEmail: 'sarah.b@email.com', customerPhone: '082 555 1234',
    eventDate: '2026-07-12',
    items: [{ description: 'Court hire — 3 courts × 2hrs', quantity: 1, unitPrice: 3000 }, { description: 'Catering — light snacks (20 ppl)', quantity: 1, unitPrice: 2500 }],
    discountPct: 10, discountReason: 'Repeat corporate client',
    notes: 'Birthday tournament booking, 20 players expected.',
    stage: 'Pending Approval', createdDate: '2026-06-17', popFileName: null,
    emailLog: [{ type: 'Approval Request', to: 'headoffice@virginactive.co.za', timestamp: '2026-06-17T14:22:00' }],
  },
  {
    id: 2, club: 'CENTURION', customerName: 'Liam Coetzee', customerEmail: 'liam.c@email.com', customerPhone: '083 444 5678',
    eventDate: '2026-06-28',
    items: [{ description: 'Court hire — 4 courts × 3hrs', quantity: 1, unitPrice: 6000 }],
    discountPct: 0, discountReason: '',
    notes: 'Corporate tournament, full day booking.',
    stage: 'Invoiced', createdDate: '2026-06-10', popFileName: null,
    emailLog: [
      { type: 'Approval Request', to: 'headoffice@virginactive.co.za', timestamp: '2026-06-10T09:15:00' },
      { type: 'Invoice Sent', to: 'liam.c@email.com', timestamp: '2026-06-11T10:00:00' },
    ],
  },
  {
    id: 3, club: 'WOODSTOCK', customerName: 'Priya Naidoo', customerEmail: 'priya.n@email.com', customerPhone: '084 222 9988',
    eventDate: '2026-06-05',
    items: [{ description: 'Court hire — 2 courts × 1.5hrs', quantity: 1, unitPrice: 1500 }],
    discountPct: 0, discountReason: '',
    notes: '',
    stage: 'Closed', createdDate: '2026-05-28', popFileName: 'pop_priya_naidoo.pdf',
    emailLog: [
      { type: 'Approval Request', to: 'headoffice@virginactive.co.za', timestamp: '2026-05-28T11:00:00' },
      { type: 'Invoice Sent', to: 'priya.n@email.com', timestamp: '2026-05-28T15:30:00' },
      { type: 'POP Forwarded', to: 'headoffice@virginactive.co.za', timestamp: '2026-06-01T08:45:00' },
    ],
  },
]

function calcSubtotal(items: QuoteItem[]) {
  return items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
}
function calcTotal(quote: Quote) {
  const sub = calcSubtotal(quote.items)
  return sub - sub * (quote.discountPct / 100)
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const hrs = Math.floor(diff / (1000 * 60 * 60))
  if (hrs < 1) return 'Just now'
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const fieldLabel: React.CSSProperties = {
  fontSize: '11px', fontWeight: '600', color: T.colors.textSecondary,
  textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '7px',
}

export default function QuoteGeneratorPage() {
  const [quotes, setQuotes] = useState<Quote[]>(MOCK_QUOTES)
  const [showForm, setShowForm] = useState(false)
  const [filterStage, setFilterStage] = useState<QuoteStage | 'All'>('All')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // Form state
  const [club, setClub]           = useState('WOODSTOCK')
  const [customerName, setCustomerName]   = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [items, setItems]         = useState<QuoteItem[]>([defaultItem()])
  const [discountPct, setDiscountPct] = useState(0)
  const [discountReason, setDiscountReason] = useState('')
  const [notes, setNotes]         = useState('')

  const resetForm = () => {
    setClub('WOODSTOCK'); setCustomerName(''); setCustomerEmail(''); setCustomerPhone('')
    setEventDate(''); setItems([defaultItem()]); setDiscountPct(0); setDiscountReason(''); setNotes('')
  }

  const updateItem = (idx: number, field: keyof QuoteItem, value: string | number) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it))
  }
  const addItem = () => setItems(prev => [...prev, defaultItem()])
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx))

  const subtotal = calcSubtotal(items)
  const total = subtotal - subtotal * (discountPct / 100)

  const submitForApproval = () => {
    if (!customerName || !customerEmail || items.every(i => !i.description)) return
    const newQuote: Quote = {
      id: Date.now(), club, customerName, customerEmail, customerPhone, eventDate,
      items: items.filter(i => i.description), discountPct, discountReason, notes,
      stage: 'Pending Approval', createdDate: new Date().toISOString().split('T')[0],
      popFileName: null,
      emailLog: [{ type: 'Approval Request', to: 'headoffice@virginactive.co.za', timestamp: new Date().toISOString() }],
    }
    setQuotes(prev => [newQuote, ...prev])
    resetForm()
    setShowForm(false)
  }

  // ── Stage transitions ──────────────────────────────────────────────────────
  const markApproved = (id: number) => {
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, stage: 'Approved' } : q))
  }
  const markRejected = (id: number) => {
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, stage: 'Rejected' } : q))
  }
  const sendInvoice = (id: number) => {
    setQuotes(prev => prev.map(q => q.id === id
      ? { ...q, stage: 'Invoiced', emailLog: [...q.emailLog, { type: 'Invoice Sent', to: q.customerEmail, timestamp: new Date().toISOString() }] }
      : q))
  }
  const uploadPOP = (id: number, fileName: string) => {
    setQuotes(prev => prev.map(q => q.id === id
      ? {
          ...q, stage: 'Closed', popFileName: fileName,
          emailLog: [...q.emailLog, { type: 'POP Forwarded', to: 'headoffice@virginactive.co.za', timestamp: new Date().toISOString() }],
        }
      : q))
    // Integration seam: this is where a real email API call (e.g. Resend/SendGrid)
    // would fire, attaching the POP file and notifying HO automatically.
  }

  const filteredQuotes = filterStage === 'All' ? quotes : quotes.filter(q => q.stage === filterStage)

  return (
    <div style={{ minHeight: '100vh', background: T.colors.bg }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 36px' }}>

        {/* ── Page header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 10px rgba(168,85,247,0.4)' }} />
              <span style={{ fontSize: '11px', color: '#a855f7', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI Assistant</span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: T.colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>Quote Generator</h1>
            <p style={{ fontSize: '13px', color: T.colors.textSecondary, marginTop: '5px' }}>
              Build, approve and invoice customer quotes · {quotes.length} total
            </p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{
            ...T.btn.primary, display: 'flex', alignItems: 'center', gap: '8px',
            background: showForm ? '#8b3fd6' : '#a855f7',
            boxShadow: '0 0 16px rgba(168,85,247,0.3)',
          }}>
            <Plus size={14} /> New Quote
          </button>
        </div>

        {/* ── Email automation notice ── */}
        <div style={{ ...T.card, marginBottom: '20px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Mail size={16} color={T.colors.textMuted} />
          <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: 0 }}>
            Email automation not yet connected — submitting for approval and forwarding POP will trigger real emails to Head Office once connected. For now, approval/rejection is marked manually after HO replies.
          </p>
        </div>

        {/* ── New Quote Form ── */}
        {showForm && (
          <div style={{ ...T.card, marginBottom: '20px', border: `1px solid rgba(168,85,247,0.3)`, boxShadow: '0 0 16px rgba(168,85,247,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary }}>New Quote</span>
              <button onClick={() => { setShowForm(false); resetForm() }} style={{ background: 'none', border: 'none', color: T.colors.textMuted, cursor: 'pointer', fontSize: '18px', padding: 0 }}>×</button>
            </div>

            {/* Club + customer details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={fieldLabel}>Club</label>
                <select value={club} onChange={e => setClub(e.target.value)} style={{ ...T.input, cursor: 'pointer' }}>
                  {CLUB_NAMES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={fieldLabel}>Customer Name</label>
                <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Full name" style={T.input} />
              </div>
              <div>
                <label style={fieldLabel}>Event Date</label>
                <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} style={T.input} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={fieldLabel}>Customer Email</label>
                <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="customer@email.com" style={T.input} />
              </div>
              <div>
                <label style={fieldLabel}>Customer Phone</label>
                <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="082 000 0000" style={T.input} />
              </div>
            </div>

            {/* Line items */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ ...fieldLabel, marginBottom: 0 }}>Quote Items</label>
                <button onClick={addItem} style={{ fontSize: '12px', color: '#a855f7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit', padding: 0 }}>+ Add item</button>
              </div>
              {items.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 100px 24px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="e.g. Court hire — 3 courts × 2hrs" style={{ ...T.input, padding: '8px 10px', fontSize: '13px' }} />
                  <input type="number" min={1} value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} style={{ ...T.input, padding: '8px 10px', fontSize: '13px', textAlign: 'center' }} />
                  <input type="number" min={0} value={item.unitPrice || ''} onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))} placeholder="R 0" style={{ ...T.input, padding: '8px 10px', fontSize: '13px' }} />
                  <button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: T.colors.textMuted, cursor: 'pointer', fontSize: '16px', padding: 0 }}>×</button>
                </div>
              ))}
            </div>

            {/* Discount */}
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '14px', marginBottom: '14px', alignItems: 'start' }}>
              <div>
                <label style={fieldLabel}>Discount %</label>
                <div style={{ position: 'relative' }}>
                  <input type="number" min={0} max={100} value={discountPct || ''} onChange={e => setDiscountPct(Number(e.target.value))} placeholder="0" style={T.input} />
                  <Percent size={13} color={T.colors.textMuted} style={{ position: 'absolute', right: '12px', top: '12px' }} />
                </div>
              </div>
              <div>
                <label style={fieldLabel}>Discount Reason {discountPct > 0 && <span style={{ color: T.colors.amber }}>(required for HO approval)</span>}</label>
                <input value={discountReason} onChange={e => setDiscountReason(e.target.value)} placeholder="e.g. Repeat corporate client" style={T.input} disabled={discountPct === 0} />
              </div>
            </div>

            {discountPct > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: T.colors.amberGlow, border: '1px solid rgba(245,158,11,0.2)', borderRadius: T.radius.sm, marginBottom: '14px' }}>
                <AlertCircle size={13} color={T.colors.amber} />
                <span style={{ fontSize: '12px', color: T.colors.amber }}>Discounts require Head Office approval before this quote can be invoiced.</span>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={fieldLabel}>Notes (internal)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Anything HO should know..." style={{ ...T.input, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>

            {/* Live total preview */}
            <div style={{ padding: '14px 18px', background: T.colors.surfaceRaised, border: `1px solid ${T.colors.borderBright}`, borderRadius: T.radius.md, marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Subtotal</p>
                <p style={{ fontSize: '14px', color: T.colors.textSecondary, margin: 0, fontFamily: "'SF Mono', monospace" }}>R {subtotal.toLocaleString()}</p>
              </div>
              {discountPct > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '10px', color: T.colors.amber, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Discount</p>
                  <p style={{ fontSize: '14px', color: T.colors.amber, margin: 0, fontFamily: "'SF Mono', monospace" }}>-{discountPct}%</p>
                </div>
              )}
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '10px', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Total</p>
                <p style={{ fontSize: '20px', fontWeight: '700', color: T.colors.textPrimary, margin: 0, fontFamily: "'SF Mono', monospace" }}>R {total.toLocaleString()}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={submitForApproval}
                disabled={!customerName || !customerEmail || items.every(i => !i.description)}
                style={{
                  ...T.btn.primary, background: '#a855f7', boxShadow: '0 0 12px rgba(168,85,247,0.3)',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  opacity: (!customerName || !customerEmail || items.every(i => !i.description)) ? 0.4 : 1,
                  cursor: (!customerName || !customerEmail || items.every(i => !i.description)) ? 'not-allowed' : 'pointer',
                }}
              >
                <Send size={13} /> Submit for HO Approval
              </button>
              <button onClick={() => { setShowForm(false); resetForm() }} style={T.btn.secondary}>Cancel</button>
            </div>
          </div>
        )}

        {/* ── Stage filter pills ── */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button onClick={() => setFilterStage('All')} style={{ ...T.periodBtn(filterStage === 'All'), fontSize: '12px', padding: '7px 14px' }}>All</button>
          {STAGE_ORDER.map(s => {
            const count = quotes.filter(q => q.stage === s).length
            if (count === 0 && filterStage !== s) return null
            return (
              <button key={s} onClick={() => setFilterStage(s)} style={{
                ...T.periodBtn(filterStage === s), fontSize: '12px', padding: '7px 14px',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                {s}
                <span style={{ fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '999px', background: filterStage === s ? 'rgba(255,255,255,0.2)' : T.colors.surfaceRaised, color: filterStage === s ? '#fff' : T.colors.textMuted }}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* ── Quotes list ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredQuotes.length === 0 && (
            <div style={{ ...T.card, textAlign: 'center', padding: '40px', color: T.colors.textMuted }}>No quotes in this stage yet.</div>
          )}

          {filteredQuotes.map(quote => {
            const isOpen = expandedId === quote.id
            const sc = STAGE_COLORS[quote.stage]
            const total = calcTotal(quote)

            return (
              <div key={quote.id} style={{
                background: T.colors.surface, borderRadius: T.radius.lg,
                border: `1px solid ${isOpen ? '#a855f7' : T.colors.border}`,
                boxShadow: isOpen ? '0 0 14px rgba(168,85,247,0.15)' : T.shadow.card,
                overflow: 'hidden', transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}>

                <div onClick={() => setExpandedId(isOpen ? null : quote.id)} style={{
                  display: 'grid', gridTemplateColumns: '110px 1fr 130px 130px 24px',
                  alignItems: 'center', padding: '14px 18px', cursor: 'pointer', gap: '14px',
                }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: T.colors.textSecondary, fontFamily: "'SF Mono', monospace" }}>{quote.club}</span>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary, margin: 0 }}>{quote.customerName}</p>
                    <p style={{ fontSize: '11px', color: T.colors.textMuted, margin: '3px 0 0', fontFamily: "'SF Mono', monospace" }}>
                      {quote.eventDate ? new Date(quote.eventDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) : 'No date'} · R {total.toLocaleString()}
                    </p>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: '600', padding: '4px 10px', borderRadius: '999px', textAlign: 'center', ...sc }}>{quote.stage}</span>
                  <span style={{ fontSize: '11px', color: T.colors.textMuted, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>{timeAgo(quote.createdDate)}</span>
                  {isOpen ? <ChevronUp size={14} color={T.colors.textMuted} /> : <ChevronDown size={14} color={T.colors.textMuted} />}
                </div>

                {isOpen && (
                  <div style={{ borderTop: `1px solid ${T.colors.border}`, padding: '20px', background: T.colors.bg }}>

                    {/* Customer + items */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '18px' }}>
                      <div>
                        <p style={{ fontSize: '10px', fontWeight: '700', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Customer</p>
                        <p style={{ fontSize: '13px', color: T.colors.textPrimary, margin: '0 0 3px' }}>{quote.customerEmail}</p>
                        <p style={{ fontSize: '13px', color: T.colors.textSecondary, margin: 0 }}>{quote.customerPhone}</p>
                      </div>
                      {quote.discountPct > 0 && (
                        <div>
                          <p style={{ fontSize: '10px', fontWeight: '700', color: T.colors.amber, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Discount Applied</p>
                          <p style={{ fontSize: '13px', color: T.colors.textPrimary, margin: '0 0 3px' }}>{quote.discountPct}% off</p>
                          <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: 0 }}>{quote.discountReason}</p>
                        </div>
                      )}
                    </div>

                    {/* Items table */}
                    <div style={{ marginBottom: '16px' }}>
                      {quote.items.map((item, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 110px', padding: '8px 12px', background: i % 2 === 0 ? T.colors.surfaceRaised : T.colors.surface, borderRadius: T.radius.sm, marginBottom: '3px', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: T.colors.textSecondary }}>{item.description}</span>
                          <span style={{ fontSize: '12px', color: T.colors.textMuted, textAlign: 'center', fontFamily: "'SF Mono', monospace" }}>×{item.quantity}</span>
                          <span style={{ fontSize: '12px', color: T.colors.textPrimary, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>R {(item.quantity * item.unitPrice).toLocaleString()}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px', padding: '10px 12px' }}>
                        {quote.discountPct > 0 && <span style={{ fontSize: '12px', color: T.colors.amber }}>-{quote.discountPct}%</span>}
                        <span style={{ fontSize: '14px', fontWeight: '700', color: T.colors.textPrimary, fontFamily: "'SF Mono', monospace" }}>Total: R {total.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Email log */}
                    {quote.emailLog.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <p style={{ fontSize: '10px', fontWeight: '700', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Email Log</p>
                        {quote.emailLog.map((log, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: T.colors.textMuted, marginBottom: '4px' }}>
                            <Mail size={11} /> <span style={{ color: T.colors.textSecondary }}>{log.type}</span> → {log.to} · {timeAgo(log.timestamp)}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Stage actions */}
                    <div style={{ borderTop: `1px solid ${T.colors.border}`, paddingTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {quote.stage === 'Pending Approval' && (
                        <>
                          <button onClick={() => markApproved(quote.id)} style={{ ...T.btn.primary, background: T.colors.green, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CheckCircle2 size={13} /> Mark Approved by HO
                          </button>
                          <button onClick={() => markRejected(quote.id)} style={{ ...T.btn.danger, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <XCircle size={13} /> Mark Rejected
                          </button>
                        </>
                      )}
                      {quote.stage === 'Approved' && (
                        <button onClick={() => sendInvoice(quote.id)} style={{ ...T.btn.primary, background: '#a855f7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Send size={13} /> Send Invoice to Customer
                        </button>
                      )}
                      {quote.stage === 'Invoiced' && (
                        <label style={{ ...T.btn.primary, background: T.colors.amber, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <Upload size={13} /> Upload POP &amp; Notify HO
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadPOP(quote.id, f.name) }} />
                        </label>
                      )}
                      {quote.stage === 'Closed' && quote.popFileName && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: T.colors.greenGlow, border: '1px solid rgba(34,197,94,0.2)', borderRadius: T.radius.sm }}>
                          <CheckCircle2 size={13} color={T.colors.green} />
                          <span style={{ fontSize: '12px', color: T.colors.green }}>Closed — POP: {quote.popFileName}</span>
                        </div>
                      )}
                      {quote.stage === 'Rejected' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: T.colors.redGlow, border: '1px solid rgba(224,10,9,0.2)', borderRadius: T.radius.sm }}>
                          <XCircle size={13} color={T.colors.red} />
                          <span style={{ fontSize: '12px', color: T.colors.red }}>Rejected by Head Office — edit and resubmit</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}