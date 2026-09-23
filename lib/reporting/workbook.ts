import ExcelJS from 'exceljs'
import { datesInRange } from './dates'
import { summarise, type DailyReport, type ReportClub } from './model'

export async function reportWorkbook(clubs: ReportClub[], reports: DailyReport[], from: string, to: string) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Padel Admin'
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
  sheet.getRow(1).eachCell(cell => { cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB91C1C' } }; cell.alignment = { wrapText: true } })
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
    'This workbook contains stored imported figures. No Playtomic connection is active.',
  ]) notes.addRow([line])
  notes.getColumn(1).width = 125
  return Buffer.from(await workbook.xlsx.writeBuffer())
}
