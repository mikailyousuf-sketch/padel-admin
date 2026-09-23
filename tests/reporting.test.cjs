const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const ts = require('typescript')
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename)
const { parseDailyCsv, parseCsv, CSV_HEADERS, summarise } = require('../lib/reporting/model.ts')
const { businessDate, monthRange, currentMonthRange, datesInRange } = require('../lib/reporting/dates.ts')
const { reportWorkbook } = require('../lib/reporting/workbook.ts')
const ExcelJS = require('exceljs')
const csv = (rows) => [CSV_HEADERS.join(','), ...rows].join('\r\n')
const row = '2026-09-01,1,600,300,300,200,1200.50,4,16'

test('calendar ranges stay correct in South Africa and UTC', () => {
  for (const timezone of ['Africa/Johannesburg', 'UTC', 'America/Los_Angeles']) {
    process.env.TZ = timezone
    assert.deepEqual(monthRange(2026, 8), { from: '2026-09-01', to: '2026-09-30' })
    assert.deepEqual(currentMonthRange(new Date('2026-08-31T22:30:00Z')), { from: '2026-09-01', to: '2026-09-30' })
    assert.equal(businessDate(new Date('2026-08-31T22:30:00Z')), '2026-09-01')
  }
  assert.equal(monthRange(2024, 1).to, '2024-02-29')
  assert.throws(() => datesInRange('2026-02-30', '2026-03-02'))
  assert.throws(() => datesInRange('2024-01-01', '2026-01-01'))
})

test('CSV adapter handles BOM, quotes, CRLF and money in cents', () => {
  const [result] = parseDailyCsv('\uFEFF' + csv([row]), 1, '2026-09-22')
  assert.equal(result.net_revenue_cents, 120050)
  assert.deepEqual(parseCsv('"a,b","a""b"\r\n'), [['a,b', 'a"b']])
  assert.throws(() => parseCsv('"unterminated'))
  assert.throws(() => parseCsv('"a"broken,b'))
  assert.equal(parseDailyCsv(csv([row.replace('1200.50', '-12.25')]), 1, '2026-09-22')[0].net_revenue_cents, -1225)
})

test('rejects duplicates, missing courts, impossible capacity, bad dates and blank figures', () => {
  assert.throws(() => parseDailyCsv(csv([row, row]), 1, '2026-09-22'), /Duplicate/)
  assert.throws(() => parseDailyCsv(csv([row]), 2, '2026-09-22'), /include all/)
  assert.throws(() => parseDailyCsv(csv([row.replace(',600,300,', ',600,601,')]), 1, '2026-09-22'), /capacity/)
  assert.throws(() => parseDailyCsv(csv([row.replace(',300,200,', ',590,0,')]), 1, '2026-09-22'), /capacity/)
  assert.throws(() => parseDailyCsv(csv([row.replace('2026-09-01', '2026-09-30')]), 1, '2026-09-22'), /valid date/)
  assert.throws(() => parseDailyCsv(csv(['2026-09-01,1,,,,,,,']), 1, '2026-09-22'), /whole number/)
  assert.throws(() => parseDailyCsv(csv([row.replace('1200.50', 'NaN')]), 1, '2026-09-22'), /rand and cents/)
})

test('occupancy is capacity-weighted; closed days are not zero occupancy', () => {
  const rows = parseDailyCsv(csv([row, '2026-09-01,2,1200,300,600,100,0,2,8']), 2, '2026-09-22')
  const result = summarise(rows)
  assert.equal(result.occupancy, 600 / 1800 * 100)
  assert.equal(result.peakOccupancy, 300 / 900 * 100)
  assert.equal(result.netRevenueCents, 120050)
  assert.equal(result.playerVisits, 24)
  assert.equal(summarise([]).occupancy, null)
})

test('Excel preserves actual dates, club isolation and missing data', async () => {
  const courts = parseDailyCsv(csv([row]), 1, '2026-09-22')
  const buffer = await reportWorkbook([{ id: 'a', name: 'Club A' }, { id: 'b', name: 'Club B' }], [{ club_id: 'a', report_date: '2026-09-01', import_id: 'revision-1', courts, updated_at: '' }], '2026-09-01', '2026-09-02')
  const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(buffer)
  assert.equal(workbook.worksheets[0].name, 'DAILY SUMMARY')
  const summary = workbook.getWorksheet('DAILY SUMMARY')
  assert.equal(summary.getCell('A1').fill.fgColor.argb, 'FFE00A09')
  assert.equal(summary.getCell('A2').value, 'CLUB A')
  assert.equal(summary.getCell('B2').value.getUTCDate(), 2)
  assert.equal(summary.getCell('D2').value, null)
  assert.equal(workbook.getWorksheet('CLUB A_SEPTEMBER').getCell('D2').value, 1200.5)
  assert.equal(workbook.getWorksheet('BALLITO_SEPTEMBER'), undefined)
  const sheet = workbook.getWorksheet('Daily reports')
  assert.equal(sheet.getRow(2).getCell(2).value, '2026-09-01')
  assert.equal(sheet.getRow(2).getCell(6).value, 0.5)
  assert.equal(sheet.getRow(2).getCell(9).value, 1200.5)
  assert.equal(sheet.getRow(3).getCell(3).value, 'Not imported')
  assert.equal(sheet.getRow(4).getCell(1).value, 'Club B')
  assert.equal(sheet.getRow(4).getCell(9).value, null)
})
