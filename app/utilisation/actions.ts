'use server'
import { createClient } from '@/lib/supabase/server'
import { loadReporting } from '@/app/reports/data-actions'
import { COMPANY_SCOPE } from '@/lib/scope/constants'
import { businessDate, datesInRange } from '@/lib/reporting/dates'
import { demoData, type UtilisationClub } from '@/lib/utilisation/model'

export async function loadUtilisation(mode: string, from: string, to: string, clubId?: string) {
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) throw new Error('Please sign in again.')
  const { data: allowed, error } = await client.rpc('has_permission', { p_user_id: user.id, p_key: 'manage_utilisation' })
  if (error || !allowed) throw new Error('Utilisation access is required.')
  if (!['demo', 'stored'].includes(mode)) throw new Error('Choose a valid data mode.')
  if (datesInRange(from, to).length > 62 || to > businessDate()) throw new Error('Choose up to 62 days ending today or earlier.')
  const result = mode === 'demo' ? demoData(from, to) : await loadReporting(COMPANY_SCOPE, from, to)
  const clubs = result.clubs.filter(club => !clubId || club.id === clubId).map(club => ({ ...club, dailyTargetCents: 'dailyTargetCents' in club ? club.dailyTargetCents : null })) as UtilisationClub[]
  if (clubId && clubs.length === 0) throw new Error('Club unavailable in this data mode or access denied.')
  return { clubs, reports: result.reports.filter(report => clubs.some(club => club.id === report.club_id)), mode }
}
