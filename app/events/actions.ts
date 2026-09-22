'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ClubEventRow {
  id: string
  club_id: string
  event_type: string
  name: string
  event_date: string
  cost_per_person: number
  players: number
  courts_used: number
  duration: number
  court_rate: number
  royalty_rate: number
  drinks: { name: string; qty: number; unitPrice: number }[]
  balls: { name: string; qty: number; unitPrice: number }[]
  adhoc: { description: string; amount: number }[]
  sponsors: { name: string; amount: number; invoiced: boolean; paid: boolean; popFileName: string }[]
}

export async function listEventsForClub(clubId: string, monthStart: string, monthEnd: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('club_events')
    .select('*')
    .eq('club_id', clubId)
    .gte('event_date', monthStart)
    .lte('event_date', monthEnd)
    .order('event_date')
  if (error) throw error
  return data as ClubEventRow[]
}

export async function listAllClubsForMonth(monthStart: string, monthEnd: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('club_events')
    .select('*, clubs!inner(name, is_active)')
    .eq('clubs.is_active', true)
    .gte('event_date', monthStart)
    .lte('event_date', monthEnd)
  if (error) throw error
  return data as (ClubEventRow & { clubs: { name: string } })[]
}

export async function listActiveClubs() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clubs')
    .select('id, name')
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return data
}

export async function createEvent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const clubId = formData.get('clubId') as string

  // Pull the real court rate and royalty rate from Revenue & Targets
  // (HOO/Finance-set), not manual entry. Both snapshot onto the event at
  // creation time — later changes on the settings page won't retroactively
  // alter events that already happened.
  const { data: revenueRow } = await supabase
    .from('revenue_targets')
    .select('court_rate, royalty_rate')
    .eq('club_id', clubId)
    .single()

  const { error } = await supabase.from('club_events').insert({
    club_id: clubId,
    event_type: formData.get('eventType') as string,
    name: formData.get('name') as string,
    event_date: formData.get('eventDate') as string,
    cost_per_person: parseFloat(formData.get('costPerPerson') as string) || 0,
    players: parseInt(formData.get('players') as string) || 0,
    courts_used: parseInt(formData.get('courtsUsed') as string) || 1,
    duration: parseFloat(formData.get('duration') as string) || 1.5,
    court_rate: revenueRow?.court_rate ?? 500, // snapshot at time of creation, not editable after
    royalty_rate: revenueRow?.royalty_rate ?? 0.06, // snapshot at time of creation, not editable after
    created_by: user?.id,
  })
  if (error) throw error
  revalidatePath('/events')
}

export async function updateEventField(eventId: string, field: string, value: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('club_events').update({ [field]: value }).eq('id', eventId)
  if (error) throw error
  revalidatePath('/events')
}

export async function deleteEvent(eventId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('club_events').delete().eq('id', eventId)
  if (error) throw error
  revalidatePath('/events')
}