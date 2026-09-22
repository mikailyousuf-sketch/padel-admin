'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function assertMarketingOrHoo() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: profile } = await supabase.from('profiles').select('is_hoo').eq('id', user.id).single()
  if (profile?.is_hoo) return
  const { data: hasPerm } = await supabase.rpc('has_permission', { p_user_id: user.id, p_key: 'manage_marketing' })
  if (!hasPerm) throw new Error('Marketing team access required')
}

export async function listAllBriefs() {
  await assertMarketingOrHoo()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('marketing_briefs')
    .select('*, clubs(name)')
    .neq('status', 'completed')
    .order('due_date', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data
}

export async function updateBriefStatus(briefId: string, status: string) {
  await assertMarketingOrHoo()
  const supabase = await createClient()
  const { error } = await supabase.from('marketing_briefs').update({ status }).eq('id', briefId)
  if (error) throw error
  revalidatePath('/marketing/team')
}

export async function publishFlyer(formData: FormData) {
  await assertMarketingOrHoo()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const briefId = formData.get('briefId') as string
  const clubId = formData.get('clubId') as string
  const fields = {
    club_id: clubId,
    event_name: formData.get('eventName') as string,
    event_date: formData.get('eventDate') || null,
    event_time: formData.get('eventTime') || null,
    price: formData.get('price') as string,
    location: formData.get('location') as string,
    image_url: formData.get('imageName') as string,
    created_by: user?.id,
  }

  // Create the flyer with live_* mirroring the initial published values
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

  // Mark the brief as completed
  const { error: briefError } = await supabase
    .from('marketing_briefs')
    .update({ status: 'completed' })
    .eq('id', briefId)
  if (briefError) throw briefError

  revalidatePath('/marketing/team')
  revalidatePath('/marketing/update')
}