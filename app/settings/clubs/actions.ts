'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function assertCallerIsHoo() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_hoo')
    .eq('id', user.id)
    .single()

  if (!profile?.is_hoo) throw new Error('Only HOO can add clubs or change court counts')
}

export async function listClubsWithConfig() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('club_config')
    .select('*, clubs(name, slug, is_active)')
    .order('clubs(name)')
  if (error) throw error
  return data
}

export async function addClub(formData: FormData) {
  await assertCallerIsHoo()
  const admin = createAdminClient()

  const name = formData.get('name') as string
  const courtCount = parseInt(formData.get('courtCount') as string) || 1
  const slug = name.toLowerCase().trim().replace(/\s+/g, '-')

  // 1. clubs
  const { data: club, error: clubError } = await admin
    .from('clubs')
    .insert({ name, slug })
    .select('id')
    .single()
  if (clubError) throw clubError

  const clubId = club.id

  // 2. club_config (defaults — HOO edits hours/peak times after creation)
  const { error: configError } = await admin
    .from('club_config')
    .insert({ club_id: clubId, court_count: courtCount })
  if (configError) throw configError

  // 3. revenue_targets
  const { error: revenueError } = await admin
    .from('revenue_targets')
    .insert({ club_id: clubId })
  if (revenueError) throw revenueError

  // 4. catering_partners
  const { error: cateringError } = await admin
    .from('catering_partners')
    .insert({ club_id: clubId })
  if (cateringError) throw cateringError

  // 5. court_pricing — one default row per court
  const courtRows = Array.from({ length: courtCount }, (_, i) => ({
    club_id: clubId,
    court_number: i + 1,
    peak_rate: 550,
    offpeak_rate: 450,
    extras: { coachHourly: 600, balls: 169, racketRental: 60, venueHireExclusivity: 750 },
    pop_email: 'accounts@virginactivepadelclub.co.za',
  }))
  const { error: pricingError } = await admin.from('court_pricing').insert(courtRows)
  if (pricingError) throw pricingError

  revalidatePath('/settings/clubs')
}

export async function setClubActive(clubId: string, isActive: boolean) {
  await assertCallerIsHoo()
  const admin = createAdminClient()
  const { error } = await admin.from('clubs').update({ is_active: isActive }).eq('id', clubId)
  if (error) throw error
  revalidatePath('/settings/clubs')
}

export async function updateClubConfig(formData: FormData) {
  await assertCallerIsHoo()
  const admin = createAdminClient()

  const clubId = formData.get('clubId') as string
  const newCourtCount = parseInt(formData.get('courtCount') as string) || 1

  const update = {
    weekday_open: formData.get('weekdayOpen') as string,
    weekday_close: formData.get('weekdayClose') as string,
    weekend_open: formData.get('weekendOpen') as string,
    weekend_close: formData.get('weekendClose') as string,
    peak_morning_start: formData.get('peakMorningStart') as string,
    peak_morning_end: formData.get('peakMorningEnd') as string,
    peak_evening_start: formData.get('peakEveningStart') as string,
    peak_evening_end: formData.get('peakEveningEnd') as string,
    court_count: newCourtCount,
    pickleball_court_count: parseInt(formData.get('pickleballCourts') as string) || 0,
  }

  const { error: updateError } = await admin
    .from('club_config')
    .update(update)
    .eq('club_id', clubId)
  if (updateError) throw updateError

  // Reconcile court_pricing rows against the new court count.
  const { data: existingRows } = await admin
    .from('court_pricing')
    .select('court_number')
    .eq('club_id', clubId)

  const existingCount = existingRows?.length ?? 0

  if (newCourtCount > existingCount) {
    // Add missing courts with default pricing
    const newRows = Array.from(
      { length: newCourtCount - existingCount },
      (_, i) => ({
        club_id: clubId,
        court_number: existingCount + i + 1,
        peak_rate: 550,
        offpeak_rate: 450,
        extras: { coachHourly: 600, balls: 169, racketRental: 60, venueHireExclusivity: 750 },
        pop_email: 'accounts@virginactivepadelclub.co.za',
      })
    )
    const { error: insertError } = await admin.from('court_pricing').insert(newRows)
    if (insertError) throw insertError
  } else if (newCourtCount < existingCount) {
    // Remove courts beyond the new count, highest court_number first
    const { error: deleteError } = await admin
      .from('court_pricing')
      .delete()
      .eq('club_id', clubId)
      .gt('court_number', newCourtCount)
    if (deleteError) throw deleteError
  }

  revalidatePath('/settings/clubs')
}