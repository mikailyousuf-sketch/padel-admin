'use server'
import { createClient } from '@/lib/supabase/server'
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
  const firstRow: any = data?.[0]
  return {
    courtRates,
    extras: firstRow?.extras ?? { coachHourly: 600, balls: 169, racketRental: 60, venueHireExclusivity: 750 },
    popEmail: firstRow?.pop_email ?? 'accounts@virginactivepadelclub.co.za',
  }
}

export async function markInvoiced(quoteId: string) {
  const supabase = await createClient()
  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`
  const { error } = await supabase
    .from('event_quotes')
    .update({ status: 'invoiced', invoice_number: invoiceNumber })
    .eq('id', quoteId)
  if (error) throw error
  revalidatePath('/assistant/invoices')
}

export async function sendToClient(quoteId: string, clientEmail: string) {
  const supabase = await createClient()
  const { data: current } = await supabase.from('event_quotes').select('email_log').eq('id', quoteId).single()
  const nextLog = [...(current?.email_log ?? []), { type: 'Invoice Sent to Client', to: clientEmail, timestamp: new Date().toISOString() }]

  const { error } = await supabase
    .from('event_quotes')
    .update({ status: 'sent', email_log: nextLog })
    .eq('id', quoteId)
  if (error) throw error
  revalidatePath('/assistant/invoices')
}

export async function uploadPop(quoteId: string, fileName: string, popEmail: string) {
  const supabase = await createClient()
  const { data: current } = await supabase.from('event_quotes').select('email_log').eq('id', quoteId).single()
  const nextLog = [...(current?.email_log ?? []), { type: 'POP Forwarded to HO', to: popEmail, timestamp: new Date().toISOString() }]

  const { error } = await supabase
    .from('event_quotes')
    .update({ status: 'closed', pop_url: fileName, pop_uploaded_at: new Date().toISOString(), email_log: nextLog })
    .eq('id', quoteId)
  if (error) throw error
  revalidatePath('/assistant/invoices')
}