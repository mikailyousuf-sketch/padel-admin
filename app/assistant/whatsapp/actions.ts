'use server'
import { randomUUID } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { loadClubPicker } from '@/app/select-club/actions'
import { validateCampaign } from '@/lib/whatsapp/campaign'

export async function loadCampaigns() {
  const { clubs } = await loadClubPicker()
  if (!clubs.length) return { clubs, campaigns: [], events: [] }
  const client = await createClient()
  const [campaigns, events] = await Promise.all([
    client.from('whatsapp_campaigns').select('*').in('club_id', clubs.map(c => c.id)).order('updated_at', { ascending: false }).limit(100),
    client.from('club_events').select('id,club_id,name,event_date').in('club_id', clubs.map(c => c.id)).order('event_date', { ascending: false }).limit(200),
  ])
  if (campaigns.error) throw new Error('WhatsApp setup is pending. Apply the WhatsApp campaigns migration, then refresh.')
  if (events.error) throw new Error('Could not load events. Refresh and retry.')
  return { clubs, campaigns: campaigns.data ?? [], events: events.data ?? [] }
}

export async function saveCampaign(form: FormData): Promise<{ error?: string }> {
  try {
    const client = await createClient()
    const { data: { user } } = await client.auth.getUser()
    if (!user) throw new Error('Please sign in again.')
    const get = (key: string) => String(form.get(key) ?? '').trim()
    const clubId = get('club_id')
    const { data: allowed, error: accessError } = await client.rpc('can_access_reporting_club', { p_club_id: clubId })
    if (accessError || !allowed) throw new Error('Club access denied.')
    const times = [...new Set(get('times').split(',').map(t => t.trim()).filter(Boolean))].sort()
    const weekdays = [...new Set(form.getAll('weekdays').map(Number))]
    const kind = get('kind')
    const scheduledAt = get('scheduled_at') ? `${get('scheduled_at')}:00+02:00` : null
    validateCampaign({ title: get('title'), template: get('template'), kind, times, weekdays, scheduledAt, windowStart: get('window_start'), windowEnd: get('window_end') })
    if (!get('destination_label') || get('destination_label').length > 120) throw new Error('Enter a group name of up to 120 characters.')
    const link = get('booking_link')
    if (link && (!URL.canParse(link) || new URL(link).protocol !== 'https:')) throw new Error('Use an HTTPS booking link.')
    const eventId = kind === 'event' ? get('event_id') : null
    if (kind === 'event') {
      const { data: event, error } = await client.from('club_events').select('id,event_date').eq('id', eventId).eq('club_id', clubId).single()
      if (error || !event) throw new Error('Choose an event from this club.')
      if (scheduledAt && Date.parse(scheduledAt) >= Date.parse(`${event.event_date}T23:59:59+02:00`)) throw new Error('Schedule the message no later than the event date.')
    }
    const id = get('id') || randomUUID()
    let existing: { media_path: string | null; updated_at: string } | null = null
    if (get('id')) {
      const { data, error } = await client.from('whatsapp_campaigns').select('media_path,updated_at').eq('id', id).eq('club_id', clubId).single()
      if (error || !data) throw new Error('Campaign unavailable.')
      if (data.updated_at !== get('updated_at')) throw new Error('Someone changed this campaign. Refresh before editing.')
      existing = data
    }
    let mediaPath = form.get('remove_media') === 'on' ? null : existing?.media_path ?? null
    const file = form.get('media')
    if (file instanceof File && file.size > 0) {
      if (file.size > 5 * 1024 * 1024) throw new Error('Choose an image smaller than 5 MB.')
      const bytes = Buffer.from(await file.arrayBuffer())
      const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
      const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      if (!png && !jpg) throw new Error('Only PNG and JPEG images are supported.')
      mediaPath = `${clubId}/${randomUUID()}.${png ? 'png' : 'jpg'}`
      const { error } = await client.storage.from('whatsapp-media').upload(mediaPath, bytes, { contentType: png ? 'image/png' : 'image/jpeg' })
      if (error) throw new Error('Image upload failed. Check the media bucket setup.')
    }
    const fields = {
      title: get('title'), kind, template: get('template'), destination_label: get('destination_label'), media_path: mediaPath,
      schedule: { timezone: 'Africa/Johannesburg', times, weekdays, scheduled_at: scheduledAt, event_id: eventId,
        window_start: get('window_start'), window_end: get('window_end'), booking_link: link, minimum_minutes: Number(get('minimum_minutes')) || 60 },
    }
    if (![60,90,120].includes(fields.schedule.minimum_minutes)) throw new Error('Choose 60, 90 or 120 minute availability.')
    const query = existing
      ? client.from('whatsapp_campaigns').update(fields).eq('id', id).eq('updated_at', existing.updated_at).select('id').single()
      : client.from('whatsapp_campaigns').insert({ ...fields, id, club_id: clubId, created_by: user.id }).select('id').single()
    const { error } = await query
    if (error) throw new Error('Campaign could not be saved. Refresh before retrying.')
    return {}
  } catch (error) { return { error: error instanceof Error ? error.message : 'Could not save campaign.' } }
}

export async function previewCampaignMedia(id: string) {
  const client = await createClient()
  const { data, error } = await client.from('whatsapp_campaigns').select('media_path').eq('id', id).single()
  if (error || !data?.media_path) throw new Error('Image unavailable.')
  const result = await client.storage.from('whatsapp-media').createSignedUrl(data.media_path, 60)
  if (result.error || !result.data) throw new Error('Image unavailable.')
  return result.data.signedUrl
}
