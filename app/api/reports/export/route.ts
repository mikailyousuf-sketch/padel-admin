import { NextRequest } from 'next/server'
import { loadReporting } from '@/app/reports/data-actions'
import { reportWorkbook } from '@/lib/reporting/workbook'

export async function GET(request: NextRequest) {
  try {
    const scope = request.nextUrl.searchParams.get('scope') ?? ''
    const from = request.nextUrl.searchParams.get('from') ?? ''
    const to = request.nextUrl.searchParams.get('to') ?? ''
    const { clubs, reports } = await loadReporting(scope, from, to)
    const workbook = await reportWorkbook(clubs, reports, from, to)
    return new Response(new Uint8Array(workbook), { headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Occupancy_${from}_${to}.xlsx"`,
      'Cache-Control': 'private, no-store',
    } })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Export failed.' }, { status: 400 })
  }
}
