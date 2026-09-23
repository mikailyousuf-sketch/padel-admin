'use server'

import { createHash, randomUUID } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { COMPANY_SCOPE } from '@/lib/scope/constants'
import { businessDate, datesInRange } from '@/lib/reporting/dates'
import { parseDailyCsv, type DailyReport, type ReportClub } from '@/lib/reporting/model'
import { reportWorkbook } from '@/lib/reporting/workbook'

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

export async function importDailyReport(form: FormData): Promise<{ ok: true; days: number } | { ok: false; error: string }> {
  try {
    const clubId = String(form.get('clubId') ?? '')
    if (!UUID.test(clubId)) throw new Error('Select one club to import its data.')
    const file = form.get('file')
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith('.csv') || file.size > 2 * 1024 * 1024 || file.size === 0) throw new Error('Choose a non-empty CSV file smaller than 2 MB.')
    const client = await authenticated()
    const { data: allowed, error: accessError } = await client.rpc('can_access_reporting_club', { p_club_id: clubId })
    if (accessError) databaseError(accessError.code)
    if (!allowed) throw new Error('You do not have access to this club.')
    const { data: club, error: clubError } = await client.from('clubs').select('id, name').eq('id', clubId).single()
    if (clubError) databaseError(clubError.code)
    const { data: config, error: configError } = await client.from('club_config').select('court_count').eq('club_id', clubId).single()
    if (configError) databaseError(configError.code)
    const source = await file.text()
    const rows = parseDailyCsv(source, config.court_count, businessDate())
    const dates = [...new Set(rows.map(r => r.report_date))]
    const { data: existing, error: existingError } = await client.from('reporting_daily').select('report_date, import_id').eq('club_id', clubId).in('report_date', dates)
    if (existingError) databaseError(existingError.code)
    const replace = form.get('replace') === 'on'
    if (existing.length && !replace) throw new Error('Some dates already have reports. Tick “Replace existing dates” to save a correction; the previous version stays archived.')
    const expected = Object.fromEntries(existing.map(r => [r.report_date, r.import_id]))
    const id = randomUUID(), path = `${clubId}/${id}.xlsx`
    const reports = dates.map(date => ({ club_id: clubId, report_date: date, import_id: id, courts: rows.filter(r => r.report_date === date), updated_at: new Date().toISOString() }))
    const workbook = await reportWorkbook([club], reports, dates[0], dates[dates.length - 1])
    const { error: uploadError } = await client.storage.from('report-archive').upload(path, workbook, { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', upsert: false })
    if (uploadError) throw new Error('Could not archive the workbook. No reporting figures were changed. Check the report-archive bucket and its policies.')
    const { error: saveError } = await client.rpc('save_reporting_import', { p_id: id, p_club_id: clubId, p_source_name: file.name.slice(0, 200), p_sha256: createHash('sha256').update(source).digest('hex'), p_rows: rows, p_expected: expected, p_replace: replace })
    if (saveError) {
      await client.storage.from('report-archive').remove([path])
      if (saveError.message.includes('Reports changed')) throw new Error('Another import changed these dates during upload. Refresh and retry.')
      databaseError(saveError.code)
    }
    return { ok: true, days: dates.length }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Import failed.' }
  }
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

export async function getImportTemplate(clubId: string) {
  if (!UUID.test(clubId)) throw new Error('Select a club first.')
  const client = await authenticated()
  const { data: allowed } = await client.rpc('can_access_reporting_club', { p_club_id: clubId })
  if (!allowed) throw new Error('Club access denied or reporting setup pending.')
  const { data, error } = await client.from('club_config').select('court_count').eq('club_id', clubId).single()
  if (error || !data || data.court_count < 1) throw new Error('Configure courts for this club first.')
  const { CSV_HEADERS } = await import('@/lib/reporting/model')
  const date = businessDate(new Date(Date.now() - 86400000))
  // Empty cells are intentional: a blank template must not import as zero trade.
  return [CSV_HEADERS.join(','), ...Array.from({ length: data.court_count }, (_, i) => `${date},${i + 1},,,,,,,`)].join('\r\n')
}
