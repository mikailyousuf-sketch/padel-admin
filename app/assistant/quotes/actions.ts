'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ClubPricingRow {
  club_id: string
  courtRates: { peak: number; offPeak: number }[]
  extras: { coachHourly: number; balls: number; racketRental: number; venueHireExclusivity: number }
  popEmail: string
}

export async function listActiveClubs() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('clubs').select('id, name').eq('is_active', true).order('name')
  if (error) throw error
  return data
}

// Pulls real pricing from court_pricing for a given club — replaces the old
// localStorage-based getPricing() lookup.
export async function getClubPricing(clubId: string): Promise<ClubPricingRow> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('court_pricing')
    .select('court_number, peak_rate, offpeak_rate, extras, pop_email')
    .eq('club_id', clubId)
    .order('court_number')
  if (error) throw error

  const courtRates = (data ?? []).map(r => ({ peak: r.peak_rate, offPeak: r.offpeak_rate }))
  const firstRow: any = data?.[0]
  const extras = firstRow?.extras ?? { coachHourly: 600, balls: 169, racketRental: 60, venueHireExclusivity: 750 }
  const popEmail = firstRow?.pop_email ?? 'accounts@virginactivepadelclub.co.za'

  return { club_id: clubId, courtRates, extras, popEmail }
}

export async function listQuotesForClub(clubId?: string) {
  const supabase = await createClient()
  let query = supabase.from('event_quotes').select('*, clubs(name)').order('created_at', { ascending: false })
  if (clubId) query = query.eq('club_id', clubId)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createQuote(payload: {
  clubId: string
  customerName: string
  customerPhone: string
  customerEmail: string
  eventType: string
  eventDate: string
  eventTime: string
  pax: number
  invoicingCompany: string
  invoicingAddress: string
  invoicingVat: string
  courtLines: any[]
  extraLines: any[]
  freeTextLines: any[]
  notes: string
  subtotal: number
  status: 'draft' | 'pending_approval'
  popEmail: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const emailLog = payload.status === 'pending_approval'
    ? [{ type: 'Quote Submitted for Approval', to: payload.popEmail, timestamp: new Date().toISOString() }]
    : []

  const { error } = await supabase.from('event_quotes').insert({
    club_id: payload.clubId,
    created_by: user?.id,
    client_name: payload.customerName,
    client_phone: payload.customerPhone,
    client_email: payload.customerEmail,
    event_type: payload.eventType,
    event_date: payload.eventDate || null,
    event_time: payload.eventTime || null,
    pax: payload.pax,
    invoicing_company: payload.invoicingCompany,
    invoicing_address: payload.invoicingAddress,
    invoicing_vat: payload.invoicingVat,
    line_items: { courtLines: payload.courtLines, extraLines: payload.extraLines, freeTextLines: payload.freeTextLines },
    subtotal: payload.subtotal,
    total: payload.subtotal,
    status: payload.status,
    email_log: emailLog,
    notes: payload.notes,
  })
  if (error) throw error
  revalidatePath('/assistant/quotes')
}

export async function listProShopRequests(clubId?: string) {
  const supabase = await createClient()
  let query = supabase.from('proshop_discount_requests').select('*, clubs(name)').order('created_at', { ascending: false })
  if (clubId) query = query.eq('club_id', clubId)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createProShopRequest(payload: {
  clubId: string
  personName: string
  personType: 'staff' | 'ambassador'
  itemType: string
  itemName: string
  price: number
  iluNumber: string
  details: string
  popEmail: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('proshop_discount_requests').insert({
    club_id: payload.clubId,
    created_by: user?.id,
    person_name: payload.personName,
    person_type: payload.personType,
    item_type: payload.itemType,
    item_name: payload.itemName,
    price: payload.price,
    ilu_number: payload.iluNumber,
    status: 'pending_approval',
    email_log: [{ type: 'Discount Request Submitted', to: payload.popEmail, timestamp: new Date().toISOString() }],
  })
  if (error) throw error
  revalidatePath('/assistant/quotes')
}