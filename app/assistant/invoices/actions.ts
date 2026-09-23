'use server'
import { createClient } from '@/lib/supabase/server'
import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'

export async function listInvoiceableQuotes() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('event_quotes')
    .select('*, clubs(name)')
    .neq('status', 'draft')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getClubPricingForPreview(clubId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('court_pricing')
    .select('court_number, peak_rate, offpeak_rate, extras, pop_email')
    .eq('club_id', clubId)
    .order('court_number')
  if (error) throw error
  const courtRates = (data ?? []).map(r => ({ peak: r.peak_rate, offPeak: r.offpeak_rate }))
  const firstRow = data?.[0]
  return {
    courtRates,
    extras: firstRow?.extras ?? { coachHourly: 600, balls: 169, racketRental: 60, venueHireExclusivity: 750 },
    popEmail: firstRow?.pop_email ?? 'accounts@virginactivepadelclub.co.za',
  }
}

async function accessibleQuote(quoteId: string) {
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) throw new Error('Please sign in again.')
  const { data: quote, error } = await client.from('event_quotes').select('id, club_id, status, email_log, client_email, invoice_number, pop_url').eq('id', quoteId).single()
  if (error || !quote) throw new Error('Invoice unavailable or access denied.')
  const { data: allowed } = await client.rpc('can_access_reporting_club', { p_club_id: quote.club_id })
  if (!allowed) throw new Error('Club access denied or database setup pending.')
  return { client, quote }
}

export async function markInvoiced(quoteId: string) {
  const { client, quote } = await accessibleQuote(quoteId)
  if (quote.status !== 'approved') throw new Error('Head Office must approve the quote first.')
  const invoiceNumber = quote.invoice_number ?? `INV-${randomUUID().toUpperCase()}`
  const { data, error } = await client.from('event_quotes').update({ status: 'invoiced', invoice_number: invoiceNumber }).eq('id', quoteId).eq('status', 'approved').select('id').single()
  if (error || !data) throw new Error('Invoice changed or could not be saved. Refresh and retry.')
  revalidatePath('/assistant/invoices')
}

// This is an explicit manual acknowledgement, never an email-delivery claim.
export async function recordInvoiceSent(quoteId: string) {
  const { client, quote } = await accessibleQuote(quoteId)
  if (quote.status !== 'invoiced') throw new Error('Only an invoiced quote can be recorded as sent.')
  const nextLog = [...(quote.email_log ?? []), { type: 'User confirmed invoice sent outside platform', to: quote.client_email, timestamp: new Date().toISOString() }]
  const { error } = await client.from('event_quotes').update({ status: 'sent', email_log: nextLog }).eq('id', quoteId).eq('status', 'invoiced').select('id').single()
  if (error) throw new Error('Could not record the update. Refresh and retry.')
  revalidatePath('/assistant/invoices')
}

export async function uploadPop(form: FormData) {
  const quoteId = String(form.get('quoteId') ?? '')
  const { client, quote } = await accessibleQuote(quoteId)
  if (!['sent', 'paid', 'closed'].includes(quote.status)) throw new Error('Send the invoice before attaching proof of payment.')
  const file = form.get('file')
  if (!(file instanceof File) || file.size < 1 || file.size > 5 * 1024 * 1024) throw new Error('Choose a PDF, JPEG or PNG smaller than 5 MB.')
  const buffer = Buffer.from(await file.arrayBuffer())
  const type = buffer.subarray(0, 5).toString() === '%PDF-' ? ['pdf', 'application/pdf']
    : buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? ['png', 'image/png']
    : buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255 ? ['jpg', 'image/jpeg'] : null
  if (!type) throw new Error('The file must be a PDF, JPEG or PNG.')
  const path = `${quote.club_id}/${quoteId}/${randomUUID()}.${type[0]}`
  const { error: uploadError } = await client.storage.from('invoice-proofs').upload(path, buffer, { contentType: type[1], upsert: false })
  if (uploadError) throw new Error('File upload failed. Check the invoice-proofs bucket setup.')
  const nextLog = [...(quote.email_log ?? []), { type: 'Proof of payment uploaded; payment verification pending', timestamp: new Date().toISOString() }]
  const { error } = await client.from('event_quotes').update({ pop_url: path, pop_uploaded_at: new Date().toISOString(), email_log: nextLog }).eq('id', quoteId).eq('status', quote.status).select('id').single()
  if (error) {
    await client.storage.from('invoice-proofs').remove([path])
    throw new Error('Could not attach proof of payment. Refresh and retry.')
  }
  // Receiving a document is not confirmation that money has cleared.
  revalidatePath('/assistant/invoices')
}

export async function downloadPop(quoteId: string) {
  const { client, quote } = await accessibleQuote(quoteId)
  if (!quote.pop_url || !quote.pop_url.startsWith(`${quote.club_id}/${quoteId}/`)) throw new Error('No stored document found. Older filename-only records need to be uploaded again.')
  const { data, error } = await client.storage.from('invoice-proofs').createSignedUrl(quote.pop_url, 60, { download: true })
  if (error || !data) throw new Error('Unable to download proof of payment.')
  return data.signedUrl
}
