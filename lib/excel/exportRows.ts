import ExcelJS from 'exceljs'
import { BRAND } from '@/lib/config/brand'

// Same visual language as app/lib/exportExcel.ts (Event P&L reports) —
// reusing these constants and helper functions means every export in the
// app looks like it came from the same tool, not a patchwork of one-off
// scripts per page.
const RED = 'FF' + BRAND.primaryColor.replace('#', '').toUpperCase()
const DARK = 'FF1A1A1A'
const LIGHT_GRAY = 'FFF4F4F4'
const WHITE = 'FFFFFFFF'

function styleHeader(cell: ExcelJS.Cell, bg = RED, color = WHITE) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
  cell.font = { bold: true, color: { argb: color }, size: 10 }
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  cell.border = {
    top: { style: 'thin' }, bottom: { style: 'thin' },
    left: { style: 'thin' }, right: { style: 'thin' },
  }
}

function styleCell(cell: ExcelJS.Cell, bg = WHITE, bold = false, align: ExcelJS.Alignment['horizontal'] = 'center') {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
  cell.font = { bold, size: 10 }
  cell.alignment = { horizontal: align, vertical: 'middle' }
  cell.border = {
    top: { style: 'thin' }, bottom: { style: 'thin' },
    left: { style: 'thin' }, right: { style: 'thin' },
  }
}

export interface ExcelColumn {
  key: string
  header: string
  width?: number
  /** e.g. 'R #,##0.00' for currency, 'dd/mm/yyyy' for dates */
  numFmt?: string
}

export interface ExportRowsOptions {
  /** Banner title across the top of the sheet, e.g. "MAINTENANCE REQUESTS — HUDDLE PARK" */
  title: string
  /** Optional smaller line under the title, e.g. "Generated from live data, 10 clubs" */
  subtitle?: string
  sheetName?: string
  columns: ExcelColumn[]
  rows: Record<string, any>[]
}

/**
 * Generic "export this list to Excel" utility. Any page with tabular data —
 * maintenance requests, HR incidents, leave requests, audit log entries,
 * upgrade proposals, whatever comes next — can call this with its own
 * column definitions and rows and get back a file styled consistently with
 * the rest of the app's exports.
 *
 * This is the foundation piece for "everything is documented and can be
 * pulled into a file": every module plugs into the same utility instead of
 * each page reinventing its own export logic.
 *
 * Usage:
 *   const blob = await exportRowsToExcel({
 *     title: 'MAINTENANCE REQUESTS — HUDDLE PARK',
 *     columns: [
 *       { key: 'title', header: 'Title', width: 28 },
 *       { key: 'status', header: 'Status', width: 16 },
 *       { key: 'cost', header: 'Est. Cost', width: 14, numFmt: 'R #,##0.00' },
 *     ],
 *     rows: requests.map(r => ({ title: r.title, status: r.status, cost: r.estimated_cost })),
 *   })
 *   downloadBlob(blob, 'maintenance-requests.xlsx')
 */
export async function exportRowsToExcel(opts: ExportRowsOptions): Promise<Blob> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = BRAND.name
  workbook.created = new Date()

  const ws = workbook.addWorksheet(opts.sheetName ?? 'Export', {
    pageSetup: { orientation: 'landscape', fitToPage: true },
  })

  const colCount = opts.columns.length

  // Title banner
  ws.mergeCells(1, 1, 1, colCount)
  const titleCell = ws.getCell(1, 1)
  titleCell.value = opts.title
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RED } }
  titleCell.font = { bold: true, color: { argb: WHITE }, size: 12 }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 32

  let headerRowIdx = 2
  if (opts.subtitle) {
    ws.mergeCells(2, 1, 2, colCount)
    const subCell = ws.getCell(2, 1)
    subCell.value = opts.subtitle
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK } }
    subCell.font = { italic: true, color: { argb: 'FFAAAAAA' }, size: 9 }
    subCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(2).height = 20
    headerRowIdx = 3
  }

  // Column headers
  opts.columns.forEach((col, i) => {
    const cell = ws.getCell(headerRowIdx, i + 1)
    cell.value = col.header
    styleHeader(cell, DARK)
    ws.getColumn(i + 1).width = col.width ?? 18
  })
  ws.getRow(headerRowIdx).height = 28

  // Data rows
  opts.rows.forEach((row, idx) => {
    const rowIdx = headerRowIdx + 1 + idx
    const bg = idx % 2 === 0 ? WHITE : LIGHT_GRAY
    opts.columns.forEach((col, i) => {
      const cell = ws.getCell(rowIdx, i + 1)
      const value = row[col.key]
      cell.value = value === undefined || value === null ? '' : value
      styleCell(cell, bg, false, i === 0 ? 'left' : 'center')
      if (col.numFmt) cell.numFmt = col.numFmt
    })
    ws.getRow(rowIdx).height = 20
  })

  // Footer note — who/when, for the "traceable" part of this
  const footerRowIdx = headerRowIdx + opts.rows.length + 2
  ws.getCell(footerRowIdx, 1).value = `Generated ${new Date().toLocaleDateString('en-ZA')} at ${new Date().toLocaleTimeString('en-ZA')} · ${BRAND.name}`
  ws.getCell(footerRowIdx, 1).font = { italic: true, size: 9, color: { argb: 'FF888888' } }

  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

/** Triggers a browser download for a Blob. Pair with exportRowsToExcel(). */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}