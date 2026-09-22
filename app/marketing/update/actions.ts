'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function listActiveClubs() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('clubs').select('id, name').eq('is_active', true).order('name')
  if (error) throw error
  return data
}

export async function listFlyerCounts() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('marketing_flyers').select('club_id, update_needed').eq('status', 'live')
  if (error) throw error
  return data
}

export async function listFlyersForClub(clubId: string) {
  const supabase = await createClient()
  const { data: flyers, error } = await supabase
    .from('marketing_flyers')
    .select('*')
    .eq('club_id', clubId)
    .eq('status', 'live')
    .order('created_at', { ascending: false })
  if (error) throw error

  const flyerIds = (flyers ?? []).map(f => f.id)
  const { data: notes } = await supabase
    .from('marketing_flyer_notes')
    .select('*')
    .in('flyer_id', flyerIds.length > 0 ? flyerIds : ['00000000-0000-0000-0000-000000000000'])
    .order('created_at')

  return (flyers ?? []).map(f => ({
    ...f,
    messages: (notes ?? []).filter(n => n.flyer_id === f.id),
  }))
}

export async function updateFlyerDraftField(flyerId: string, field: string, value: string) {
  const supabase = await createClient()

  const { data: flyer } = await supabase.from('marketing_flyers').select('*').eq('id', flyerId).single()
  if (!flyer) throw new Error('Flyer not found')

  const updated = { ...flyer, [field]: value }
  const isChanged =
    updated.event_name !== updated.live_event_name ||
    updated.event_date !== updated.live_event_date ||
    updated.event_time !== updated.live_event_time ||
    updated.price !== updated.live_price ||
    updated.location !== updated.live_location

  const { error } = await supabase
    .from('marketing_flyers')
    .update({ [field]: value, update_needed: isChanged })
    .eq('id', flyerId)
  if (error) throw error
  revalidatePath('/marketing/update')
}

export async function resubmitFlyer(flyerId: string, newImageName: string) {
  const supabase = await createClient()
  const { data: flyer } = await supabase.from('marketing_flyers').select('*').eq('id', flyerId).single()
  if (!flyer) throw new Error('Flyer not found')

  const { error } = await supabase
    .from('marketing_flyers')
    .update({
      image_url: newImageName,
      live_event_name: flyer.event_name,
      live_event_date: flyer.event_date,
      live_event_time: flyer.event_time,
      live_price: flyer.price,
      live_location: flyer.location,
      update_needed: false,
    })
    .eq('id', flyerId)
  if (error) throw error
  revalidatePath('/marketing/update')
}

export async function revertFlyer(flyerId: string) {
  const supabase = await createClient()
  const { data: flyer } = await supabase.from('marketing_flyers').select('*').eq('id', flyerId).single()
  if (!flyer) throw new Error('Flyer not found')

  const { error } = await supabase
    .from('marketing_flyers')
    .update({
      event_name: flyer.live_event_name,
      event_date: flyer.live_event_date,
      event_time: flyer.live_event_time,
      price: flyer.live_price,
      location: flyer.live_location,
      update_needed: false,
    })
    .eq('id', flyerId)
  if (error) throw error
  revalidatePath('/marketing/update')
}

export async function sendFlyerMessage(flyerId: string, text: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let authorName = 'You'
  let role: 'manager' | 'design_team' = 'manager'
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    authorName = profile?.full_name ?? 'You'
    const { data: hasMarketing } = await supabase.rpc('has_permission', { p_user_id: user.id, p_key: 'manage_marketing' })
    if (hasMarketing) role = 'design_team'
  }

  const { error } = await supabase.from('marketing_flyer_notes').insert({
    flyer_id: flyerId,
    author_id: user?.id,
    author_name: authorName,
    role,
    note: text,
  })
  if (error) throw error
  revalidatePath('/marketing/update')
}