'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function listActiveClubs() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('clubs').select('id, name').eq('is_active', true).order('name')
  if (error) throw error
  return data
}

export async function listBriefsForClub(clubId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('marketing_briefs')
    .select('*')
    .eq('club_id', clubId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function listAllBriefCounts() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('marketing_briefs')
    .select('club_id, status')
    .neq('status', 'completed')
  if (error) throw error
  return data
}

export async function createBrief(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const refImageNames = (formData.getAll('refImageNames') as string[]).filter(Boolean)

  const { error } = await supabase.from('marketing_briefs').insert({
    club_id: formData.get('clubId') as string,
    created_by: user?.id,
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    assignee: (formData.get('assignee') as string) || 'Design Team',
    priority: formData.get('priority') as string,
    due_date: formData.get('dueDate') as string,
    ref_image_names: refImageNames,
  })
  if (error) throw error
  revalidatePath('/marketing/new')
}
export async function completeBrief(briefId: string, formData: FormData) {
  const supabase = await createClient()

  const clubId = formData.get('clubId') as string
  const fields = {
    club_id: clubId,
    event_name: formData.get('eventName') as string,
    event_date: formData.get('eventDate') as string,
    event_time: formData.get('eventTime') as string,
    price: formData.get('price') as string,
    location: formData.get('location') as string,
    image_url: formData.get('imageName') as string,
  }

  const { error: flyerError } = await supabase.from('marketing_flyers').insert({
    ...fields,
    live_event_name: fields.event_name,
    live_event_date: fields.event_date,
    live_event_time: fields.event_time,
    live_price: fields.price,
    live_location: fields.location,
    update_needed: false,
  })
  if (flyerError) throw flyerError

  const { error: briefError } = await supabase
    .from('marketing_briefs')
    .update({ status: 'completed' })
    .eq('id', briefId)
  if (briefError) throw briefError

  revalidatePath('/marketing/new')
  revalidatePath('/marketing/update')
}