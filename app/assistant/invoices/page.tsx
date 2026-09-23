'use client'

import { useState, useEffect } from 'react'
import { Send, Upload, CheckCircle2, Eye, ChevronDown, ChevronUp, Mail, Receipt } from 'lucide-react'
import { theme } from '../../components/theme'
import { listInvoiceableQuotes, getClubPricingForPreview, markInvoiced, recordInvoiceSent, uploadPop, downloadPop } from './actions'

const T = theme

const COMPANY = {
  name: 'FI OPERATIONS (PTY) LTD',
  addressLines: ['Leinster Hall', '7 Weltevreden Street', 'Gardens', 'Western Cape', '8001'],
  regNo: '1965/010057/07',
  vat: '4230154066',
  bank: 'First National Bank',
  accountNumber: '630 5620 8995',
}

interface InvoiceQuote {
  id: string; club_id: string; status: string; total: number | null
  client_name: string; client_email: string; client_phone: string | null
  event_type: string; event_date: string; event_time: string | null
  created_at: string; invoice_number: string | null; pop_url: string | null
  invoicing_company: string | null; invoicing_vat: string | null
  clubs: { name: string } | null
  email_log: { type: string; to?: string; timestamp: string }[] | null
}
type InvoicePricing = Awaited<ReturnType<typeof getClubPricingForPreview>>

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const hrs = Math.floor(diff / (1000 * 60 * 60))
  if (hrs < 1) return 'Just now'
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const STAGE_META: Record<string, { label: string; color: string; bg: string }> = {
  pending_approval:      { label: 'Pending Approval',      color: T.colors.amber, bg: T.colors.amberGlow },
  sent_back_for_changes: { label: 'Sent Back for Changes', color: T.colors.red, bg: T.colors.redGlow },
  approved:              { label: 'Approved',              color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
  invoiced:              { label: 'Invoiced',               color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
  sent:                  { label: 'Sent to Client',         color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  closed:                { label: 'Closed',                 color: T.colors.green, bg: T.colors.greenGlow },
  paid:                  { label: 'Paid',                   color: T.colors.green, bg: T.colors.greenGlow },
}

export default function FinalInvoicePage() {
  const [quotes, setQuotes] = useState<InvoiceQuote[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [previewQuote, setPreviewQuote] = useState<InvoiceQuote | null>(null)
  const [previewPricing, setPreviewPricing] = useState<InvoicePricing | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)

  async function run(task: () => Promise<void>) {
    setBusy(true); setActionError('')
    try { await task() } catch (error) { setActionError(error instanceof Error ? error.message : 'Operation failed.') } finally { setBusy(false) }
  }

  async function reload() {
    setQuotes(await listInvoiceableQuotes() as unknown as InvoiceQuote[])
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false
    listInvoiceableQuotes().then(data => { if (!cancelled) setQuotes(data as unknown as InvoiceQuote[]) })
      .catch(() => { if (!cancelled) setActionError('Unable to load invoices.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  async function handleMarkInvoiced(id: string) {
    await markInvoiced(id)
    await reload()
  }

  async function handleSendToClient(id: string) {
    if (!window.confirm('Have you already sent this invoice to the client outside the platform? This records your confirmation; it does not send an email.')) return
    await recordInvoiceSent(id)
    await reload()
  }

  async function handleUploadPop(id: string, file: File) {
    const form = new FormData(); form.set('quoteId', id); form.set('file', file)
    await uploadPop(form)
    await reload()
  }

  async function openPreview(quote: InvoiceQuote) {
    const pricing = await getClubPricingForPreview(quote.club_id)
    setPreviewPricing(pricing)
    setPreviewQuote(quote)
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', background: T.colors.bg, padding: '32px 36px', color: T.colors.textSecondary }}>Loading...</div>
  }

  return (
    <div style={{ minHeight: '100vh', background: T.colors.bg }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 36px' }}>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 10px rgba(59,130,246,0.4)' }} />
            <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI Assistant</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: T.colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>Final Invoices</h1>
          <p style={{ fontSize: '13px', color: T.colors.textSecondary, marginTop: '5px' }}>
            Head Office approved quotes · record delivery and store proof of payment
          </p>
        </div>

        <div style={{ ...T.card, marginBottom: '20px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Receipt size={16} color={T.colors.textMuted} />
          <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: 0 }}>
            Email delivery is not connected. Send the invoice separately, then record that it was sent. Uploaded proof of payment is stored privately; it does not confirm payment or notify Head Office automatically.
          </p>
        </div>

        {actionError && <p role="alert" style={{ color: T.colors.red }}>{actionError}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {quotes.length === 0 && (
            <div style={{ ...T.card, textAlign: 'center', padding: '40px', color: T.colors.textMuted }}>
              No quotes awaiting invoicing yet. Quotes appear here once submitted to Head Office from the Quote Requests page.
            </div>
          )}

          {quotes.map((quote) => {
            const isOpen = expandedId === quote.id
            const total = quote.total ?? 0
            const meta = STAGE_META[quote.status] ?? { label: quote.status, color: T.colors.textSecondary, bg: T.colors.surfaceRaised }
            const emailLog = quote.email_log ?? []

            return (
              <div key={quote.id} style={{
                background: T.colors.surface, borderRadius: T.radius.lg,
                border: `1px solid ${isOpen ? '#3b82f6' : T.colors.border}`,
                boxShadow: isOpen ? '0 0 14px rgba(59,130,246,0.15)' : T.shadow.card,
                overflow: 'hidden',
              }}>
                <div onClick={() => setExpandedId(isOpen ? null : quote.id)} style={{
                  display: 'grid', gridTemplateColumns: '110px 1fr 140px 100px 24px',
                  alignItems: 'center', padding: '14px 18px', cursor: 'pointer', gap: '14px',
                }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: T.colors.textSecondary, fontFamily: "'SF Mono', monospace" }}>{quote.clubs?.name ?? ''}</span>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary, margin: 0 }}>{quote.client_name}</p>
                    <p style={{ fontSize: '11px', color: T.colors.textMuted, margin: '3px 0 0', fontFamily: "'SF Mono', monospace" }}>
                      {quote.invoice_number ? `${quote.invoice_number} · ` : ''}R {total.toFixed(0)}
                    </p>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: '600', padding: '4px 10px', borderRadius: '999px', textAlign: 'center', color: meta.color, background: meta.bg }}>{meta.label}</span>
                  <span style={{ fontSize: '11px', color: T.colors.textMuted, textAlign: 'right', fontFamily: "'SF Mono', monospace" }}>{timeAgo(quote.created_at)}</span>
                  {isOpen ? <ChevronUp size={14} color={T.colors.textMuted} /> : <ChevronDown size={14} color={T.colors.textMuted} />}
                </div>

                {isOpen && (
                  <div style={{ borderTop: `1px solid ${T.colors.border}`, padding: '20px', background: T.colors.bg }}>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
                      <div>
                        <p style={{ fontSize: '10px', fontWeight: '700', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Client</p>
                        <p style={{ fontSize: '13px', color: T.colors.textPrimary, margin: '0 0 3px' }}>{quote.client_email}</p>
                        <p style={{ fontSize: '13px', color: T.colors.textSecondary, margin: 0 }}>{quote.client_phone}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '10px', fontWeight: '700', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Event</p>
                        <p style={{ fontSize: '13px', color: T.colors.textPrimary, margin: '0 0 3px' }}>{quote.event_type || '—'}</p>
                        <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: 0, fontFamily: "'SF Mono', monospace" }}>
                          {quote.event_date} {quote.event_time && `· ${quote.event_time}`}
                        </p>
                      </div>
                    </div>

                    <button onClick={() => run(() => openPreview(quote))} style={{ ...T.btn.secondary, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginBottom: '16px' }}>
                      <Eye size={12} /> Preview Invoice
                    </button>

                    {emailLog.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <p style={{ fontSize: '10px', fontWeight: '700', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Activity Log</p>
                        {emailLog.map((log, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: T.colors.textMuted, marginBottom: '4px' }}>
                            <Mail size={11} /> <span style={{ color: T.colors.textSecondary }}>{log.type}</span> → {log.to} · {timeAgo(log.timestamp)}
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ borderTop: `1px solid ${T.colors.border}`, paddingTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {(quote.status === 'approved') && (
                        <button disabled={busy} onClick={() => run(() => handleMarkInvoiced(quote.id))} style={{ ...T.btn.primary, background: '#a855f7', boxShadow: '0 0 10px rgba(168,85,247,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Receipt size={13} /> Mark Invoiced by HO
                        </button>
                      )}
                      {quote.status === 'invoiced' && (
                        <button disabled={busy} onClick={() => run(() => handleSendToClient(quote.id))} style={{ ...T.btn.primary, background: '#3b82f6', boxShadow: '0 0 10px rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Send size={13} /> Record invoice sent
                        </button>
                      )}
                      {['sent', 'closed', 'paid'].includes(quote.status) && (
                        <label style={{ ...T.btn.primary, background: T.colors.amber, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <Upload size={13} /> Upload proof of payment
                          <input disabled={busy} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) run(() => handleUploadPop(quote.id, f)) }} />
                        </label>
                      )}
                      {quote.pop_url && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: T.colors.greenGlow, border: '1px solid rgba(34,197,94,0.2)', borderRadius: T.radius.sm }}>
                          <CheckCircle2 size={13} color={T.colors.green} />
                          <button disabled={busy} onClick={() => run(async () => { window.location.assign(await downloadPop(quote.id)) })}>Download proof of payment</button>
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
                <p style={{ fontWeight: '700', fontSize: '16px', margin: 0 }}>{(previewQuote.clubs?.name ?? '').toUpperCase()} - INVOICE</p>
                {previewQuote.invoice_number && <p style={{ fontSize: '12px', margin: '4px 0', fontWeight: '600' }}>{previewQuote.invoice_number}</p>}
                <p style={{ fontSize: '11px', color: '#888', margin: '8px 0 0' }}>DATE: {new Date(previewQuote.created_at).toLocaleDateString('en-ZA')}</p>
              </div>
            </div>

            <p style={{ fontWeight: '700', fontSize: '12px', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '8px' }}>BILLED TO</p>
            <table style={{ width: '100%', fontSize: '12px', marginBottom: '20px' }}>
              <tbody>
                <tr><td style={{ padding: '2px 0', color: '#888' }}>NAME</td><td>{previewQuote.client_name}</td></tr>
                <tr><td style={{ padding: '2px 0', color: '#888' }}>EMAIL</td><td>{previewQuote.client_email}</td></tr>
                <tr><td style={{ padding: '2px 0', color: '#888' }}>EVENT</td><td>{previewQuote.event_type} — {previewQuote.event_date} {previewQuote.event_time}</td></tr>
                {previewQuote.invoicing_company && <tr><td style={{ padding: '2px 0', color: '#888' }}>COMPANY</td><td>{previewQuote.invoicing_company} ({previewQuote.invoicing_vat})</td></tr>}
              </tbody>
            </table>

            {(() => {
              // Invoice totals are the saved quote amount, never today's court prices.
              const total = previewQuote.total ?? 0
              const exclVat = total / 1.15
              const vat = total - exclVat
              return (
                <table style={{ width: '100%', fontSize: '12px', marginBottom: '20px' }}>
                  <tbody>
                    <tr><td style={{ textAlign: 'right', padding: '2px 0', color: '#888' }}>TOTAL EXCL. VAT</td><td style={{ textAlign: 'right', width: '90px' }}>R {exclVat.toFixed(2)}</td></tr>
                    <tr><td style={{ textAlign: 'right', padding: '2px 0', color: '#888' }}>VAT</td><td style={{ textAlign: 'right' }}>R {vat.toFixed(2)}</td></tr>
                    <tr><td style={{ textAlign: 'right', padding: '4px 0', fontWeight: '700', fontSize: '14px' }}>TOTAL DUE</td><td style={{ textAlign: 'right', fontWeight: '700', fontSize: '14px' }}>R {total.toFixed(2)}</td></tr>
                  </tbody>
                </table>
              )
            })()}

            <div style={{ borderTop: '1px solid #ddd', paddingTop: '12px', fontSize: '11px', color: '#888' }}>
              <p style={{ fontWeight: '700', margin: '0 0 4px' }}>BANKING DETAILS:</p>
              <p style={{ margin: '2px 0' }}>{COMPANY.name}</p>
              <p style={{ margin: '2px 0' }}>{COMPANY.bank}</p>
              <p style={{ margin: '2px 0' }}>Account Number {COMPANY.accountNumber}</p>
              <p style={{ margin: '2px 0' }}>Reference: {previewQuote.invoice_number ?? 'Invoice Number'}/Event Name &amp; Date</p>
              <p style={{ margin: '2px 0' }}>Send proof of payment to {previewPricing.popEmail}</p>
            </div>

            <button onClick={() => { setPreviewQuote(null); setPreviewPricing(null) }} style={{ ...T.btn.secondary, marginTop: '20px', color: '#1a1a1a', border: '1px solid #ddd' }}>Close Preview</button>
          </div>
        </div>
      )}
    </div>
  )
}
