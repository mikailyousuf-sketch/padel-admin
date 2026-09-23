import ExcelJS from 'exceljs'
import { generateOccupancyExcel } from '../../app/lib/exportExcel'
import { BRAND } from '../config/brand'
import { datesInRange } from './dates'
import { summarise, type DailyReport, type ReportClub } from './model'

async function detailWorkbook(clubs: ReportClub[], reports: DailyReport[], from: string, to: string) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = BRAND.name
  const sheet = workbook.addWorksheet('Daily reports')
  sheet.addRow(['Club', 'Date (SAST)', 'Data status', 'Available hours', 'Booked hours', 'Occupancy', 'Peak occupancy', 'Off-peak occupancy', 'Net booking revenue (ZAR)', 'Games', 'Player visits', 'Revision'])
  const index = new Map(reports.map(r => [`${r.club_id}:${r.report_date}`, r]))
  for (const club of clubs) for (const date of datesInRange(from, to)) {
    const report = index.get(`${club.id}:${date}`)
    if (!report) { sheet.addRow([club.name, date, 'Not imported']); continue }
    const s = summarise(report.courts)
    const row = sheet.addRow([club.name, date, s.availableMinutes === 0 ? 'Closed' : 'Imported', s.availableMinutes / 60, s.bookedMinutes / 60, s.occupancy === null ? null : s.occupancy / 100, s.peakOccupancy === null ? null : s.peakOccupancy / 100, s.offPeakOccupancy === null ? null : s.offPeakOccupancy / 100, s.netRevenueCents / 100, s.games, s.playerVisits, report.import_id])
    for (const col of [6, 7, 8]) row.getCell(col).numFmt = '0.0%'
    for (const col of [4, 5, 9]) row.getCell(col).numFmt = '#,##0.00'
  }
  sheet.views = [{ state: 'frozen', ySplit: 1 }]
  sheet.autoFilter = { from: 'A1', to: 'L1' }
  sheet.columns.forEach((col, i) => { col.width = i === 11 ? 40 : i === 0 ? 24 : 22 })
  sheet.getRow(1).eachCell(cell => { cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + BRAND.primaryColor.slice(1).toUpperCase() } }; cell.alignment = { wrapText: true } })
  sheet.getRow(1).height = 32
  const notes = workbook.addWorksheet('Definitions')
  for (const line of [
    'All dates are calendar dates in Africa/Johannesburg.',
    'Occupancy = total booked minutes / total available court minutes. Aggregates are weighted by capacity.',
    'Available minutes exclude closures and maintenance. Do not subtract time occupied by bookings.',
    'Peak + off-peak capacity equals total capacity. Closed days have blank occupancy, not 0%.',
    'Missing dates mean not imported, not zero trade. Totals cover imported data only.',
    'Revenue is net booking revenue allocated to the play date: after refunds, including VAT where applicable. It is not bank settlement or total company revenue.',
    'Games and player visits are summed. Visits are not unique players and are not staff KPI counts.',
    'This workbook contains historical manual figures, if present. No Playtomic connection is active.',
    'Target values and pickleball results are unavailable in this data contract and remain blank.',
    'Monthly club tabs retain the full calendar layout; only dates within the selected range contain supplied figures.',
  ]) notes.addRow([line])
  notes.getColumn(1).width = 125
  return Buffer.from(await workbook.xlsx.writeBuffer())
}

// Preserve the established occupancy workbook and append traceable daily detail.
export async function reportWorkbook(clubs: ReportClub[], reports: DailyReport[], from: string, to: string) {
  const dates = datesInRange(from, to)
  const months = [...new Set(dates.map(date => date.slice(0, 7)))]
  const workbook = new ExcelJS.Workbook()
  workbook.creator = BRAND.name
  const copySheet = (source: ExcelJS.Worksheet, name: string) => {
    let uniqueName = name
    let suffix = 2
    while (workbook.getWorksheet(uniqueName)) uniqueName = name.slice(0, 26) + `_${suffix++}`
    const target = workbook.addWorksheet(uniqueName)
    target.model = { ...source.model, id: target.id, name: uniqueName }
  }
  for (const month of months) {
    const [year, monthNumber] = month.split('-').map(Number)
    const monthDates = dates.filter(date => date.startsWith(month))
    const localDate = (date: string) => { const [y, m, d] = date.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)) }
    const data: Parameters<typeof generateOccupancyExcel>[2] = {}
    const configs = clubs.map(club => {
      const rows = reports.filter(report => report.club_id === club.id && monthDates.includes(report.report_date))
      data[club.name.toUpperCase()] = rows.map(report => {
        const summary = summarise(report.courts)
        return { date: localDate(report.report_date), occupancy: summary.occupancy,
          availableMinutes: summary.availableMinutes, revenue: summary.netRevenueCents / 100,
          comments: 'Historical manual data; Playtomic not connected' }
      })
      return { name: club.name, courts: club.court_count ?? rows[0]?.courts.length ?? 0, pickle: club.pickleball_court_count ?? 0 }
    })
    const blob = await generateOccupancyExcel(monthNumber - 1, year, data, configs, localDate(monthDates[monthDates.length - 1]))
    const monthly = new ExcelJS.Workbook()
    await monthly.xlsx.load(await blob.arrayBuffer())
    monthly.eachSheet(sheet => {
      const name = months.length === 1 ? sheet.name : `${sheet.name.slice(0, 21)}_${month}`
      copySheet(sheet, name)
    })
  }
  const details = new ExcelJS.Workbook()
  await details.xlsx.load(new Uint8Array(await detailWorkbook(clubs, reports, from, to)).buffer)
  details.eachSheet(sheet => copySheet(sheet, sheet.name))
  return Buffer.from(await workbook.xlsx.writeBuffer())
}
