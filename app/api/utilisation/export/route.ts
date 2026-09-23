import { NextRequest } from 'next/server'
import ExcelJS from 'exceljs'
import { loadUtilisation } from '@/app/utilisation/actions'
import { reportWorkbook } from '@/lib/reporting/workbook'
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const mode = params.get('mode') ?? 'stored', from = params.get('from') ?? '', to = params.get('to') ?? ''
    const { clubs, reports } = await loadUtilisation(mode, from, to, params.get('club') || undefined)
    let bytes = await reportWorkbook(clubs, reports, from, to)
    if (mode === 'demo') {
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(new Uint8Array(bytes).buffer)
      workbook.creator = 'DEMO — fictional club data'
      workbook.eachSheet(sheet => {
        sheet.getCell('A1').value = `DEMO — ${String(sheet.getCell('A1').value ?? '')}`
        sheet.eachRow(row => row.eachCell(cell => {
          if (typeof cell.value === 'string') cell.value = cell.value
            .replaceAll('Historical manual data; Playtomic not connected', 'Fictional demo data')
            .replaceAll('Imported', 'Demo').replaceAll('Not imported', 'No demo data')
            .replace('This workbook contains historical manual figures, if present. No Playtomic connection is active.', 'All figures in this workbook are fictional demonstration data. No Playtomic connection is active.')
        }))
      })
      bytes = Buffer.from(await workbook.xlsx.writeBuffer())
    }
    return new Response(new Uint8Array(bytes), { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${mode === 'demo' ? 'DEMO_' : ''}Utilisation_${from}_${to}.xlsx"`, 'Cache-Control': 'private, no-store' } })
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Export failed.' }, { status: 400 }) }
}
