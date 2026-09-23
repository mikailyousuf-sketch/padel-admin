'use server'

import { createClient } from '@/lib/supabase/server'
import { COMPANY_SCOPE } from '@/lib/scope/constants'
import { datesInRange } from '@/lib/reporting/dates'
import { type DailyReport, type ReportClub } from '@/lib/reporting/model'

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i

async function authenticated() {
  const client = await createClient()
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) throw new Error('Please sign in again.')
  return client
}

function databaseError(code?: string): never {
  if (code === '42P01' || code === 'PGRST205' || code === '42883' || code === 'PGRST202') throw new Error('Reporting setup is pending. Ask your administrator to apply the reporting database migration.')
  throw new Error('Unable to load or save reporting data. Please retry or contact your administrator.')
}

export async function loadReporting(scope: string, from: string, to: string) {
  datesInRange(from, to)
  if (scope !== COMPANY_SCOPE && !UUID.test(scope)) throw new Error('Choose a club first.')
  const client = await authenticated()
  const { data: accessibleClubs, error: clubError } = await client.rpc('list_reporting_clubs')
  if (clubError) databaseError(clubError.code)
  const clubs = ((accessibleClubs ?? []) as ReportClub[]).filter(club => scope === COMPANY_SCOPE || club.id === scope)
  if (scope !== COMPANY_SCOPE && !clubs.length) throw new Error('Club unavailable or access denied.')
  if (clubs.length) {
    const { data: configs, error: configError } = await client.from('club_config').select('club_id, court_count, pickleball_court_count').in('club_id', clubs.map(club => club.id))
    if (configError) databaseError(configError.code)
    for (const club of clubs) {
      const config = configs?.find(row => row.club_id === club.id)
      if (config) Object.assign(club, { court_count: config.court_count, pickleball_court_count: config.pickleball_court_count })
    }
  }
  const reports: DailyReport[] = []
  // Supabase defaults to 1,000 rows. Page explicitly so company totals do not
  // silently truncate a year of daily reports.
  for (let offset = 0; ; offset += 500) {
    let query = client.from('reporting_daily').select('*').gte('report_date', from).lte('report_date', to).order('report_date').order('club_id').range(offset, offset + 499)
    if (scope !== COMPANY_SCOPE) query = query.eq('club_id', scope)
    const { data, error } = await query
    if (error) databaseError(error.code)
    reports.push(...(data as DailyReport[]))
    if (data.length < 500) break
  }
  let archivesQuery = client.from('reporting_imports').select('id, club_id, club_name, imported_at, source_name').order('imported_at', { ascending: false }).limit(30)
  if (scope !== COMPANY_SCOPE) archivesQuery = archivesQuery.eq('club_id', scope)
  const { data: archives, error } = await archivesQuery
  if (error) databaseError(error.code)
  return { clubs: (clubs ?? []) as ReportClub[], reports, archives: archives ?? [] }
}

export async function importDailyReport(): Promise<{ ok: false; error: string }> {
  return { ok: false, error: 'Manual reporting uploads are disabled. Reports will be populated through the Playtomic integration.' }
}

export async function archiveDownload(id: string) {
  if (!UUID.test(id)) throw new Error('Invalid archive.')
  const client = await authenticated()
  const { data, error } = await client.from('reporting_imports').select('workbook_path').eq('id', id).single()
  if (error) throw new Error('Archive unavailable or access denied.')
  const { data: signed, error: signingError } = await client.storage.from('report-archive').createSignedUrl(data.workbook_path, 60, { download: true })
  if (signingError || !signed) throw new Error('Unable to download this archive.')
  return signed.signedUrl
}

export async function getImportTemplate() {
  throw new Error('Manual reporting templates are no longer used.')
}
