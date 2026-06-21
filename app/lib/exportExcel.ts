import ExcelJS from 'exceljs'

const clubs = [
  { name: 'BALLITO', courts: 3, pickle: 0 },
  { name: 'BEDFORDVIEW', courts: 3, pickle: 0 },
  { name: 'CENTURION', courts: 4, pickle: 0 },
  { name: 'DURBANVILLE', courts: 3, pickle: 0 },
  { name: 'EPICENTRE', courts: 5, pickle: 0 },
  { name: 'GATEWAY', courts: 6, pickle: 0 },
  { name: 'GEORGE', courts: 3, pickle: 0 },
  { name: 'GLEN', courts: 3, pickle: 3 },
  { name: 'GROENKLOOF', courts: 5, pickle: 0 },
  { name: 'HUDDLE', courts: 6, pickle: 0 },
  { name: 'LORRAINE', courts: 2, pickle: 0 },
  { name: 'LOURENSFORD', courts: 4, pickle: 2 },
  { name: 'LONEHILL', courts: 4, pickle: 0 },
  { name: 'OLD EDS', courts: 4, pickle: 0 },
  { name: 'POINT', courts: 4, pickle: 3 },
  { name: 'RANDPARK', courts: 4, pickle: 0 },
  { name: 'WOODSTOCK', courts: 3, pickle: 0 },
]

const VAT = 1.15
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const RED = 'FFE00A09'
const DARK = 'FF1A1A1A'
const LIGHT_GRAY = 'FFF4F4F4'
const WHITE = 'FFFFFFFF'
const GREEN = 'FF16A34A'

function getDayOfWeek(date: Date): string {
  return DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1]
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = []
  const d = new Date(year, month, 1)
  while (d.getMonth() === month) {
    days.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return days
}

function styleHeader(cell: ExcelJS.Cell, bg = RED, color = WHITE) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
  cell.font = { bold: true, color: { argb: color }, size: 10 }
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  cell.border = {
    top: { style: 'thin' }, bottom: { style: 'thin' },
    left: { style: 'thin' }, right: { style: 'thin' }
  }
}

function styleCell(cell: ExcelJS.Cell, bg = WHITE, bold = false, align: ExcelJS.Alignment['horizontal'] = 'center') {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
  cell.font = { bold, size: 10 }
  cell.alignment = { horizontal: align, vertical: 'middle' }
  cell.border = {
    top: { style: 'thin' }, bottom: { style: 'thin' },
    left: { style: 'thin' }, right: { style: 'thin' }
  }
}

interface DayData {
  date: Date
  occupancy: number | null
  revenue: number | null
  pickleOccupancy?: number | null
  comments?: string
}

interface ClubConfig {
  name: string
  courts: number
  pickle: number
  weekdayOpen?: string
  weekdayClose?: string
  weekendOpen?: string
  weekendClose?: string
  dailyTarget?: number
}

// ── Updated EventExpenses to match new page interface ──
interface DrinkEntry { drinkName: string; qty: number; unitPrice: number }
interface BallEntry { ballName: string; qty: number; unitPrice: number }
interface AdhocEntry { description: string; amount: number }
interface SponsorEntry {
  name: string
  amount: number
  invoiced: boolean
  paid: boolean
  popFile: File | null
  popFileName: string
}
interface EventExpenses {
  drinks: DrinkEntry[]
  balls: BallEntry[]
  adhoc: AdhocEntry[]
  sponsors: SponsorEntry[]
}

export async function generateOccupancyExcel(
  month: number,
  year: number,
  clubData: { [clubName: string]: DayData[] },
  clubConfigs: ClubConfig[]
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Padel Admin'
  workbook.created = new Date()

  const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long' }).toUpperCase()
  const days = getDaysInMonth(year, month)

  const summary = workbook.addWorksheet('DAILY SUMMARY', {
    pageSetup: { orientation: 'landscape', fitToPage: true }
  })

  summary.getRow(1).height = 40

  const summaryHeaders = [
    'Club', 'Date Used Formula', '*Time Based Occupancy %',
    'Daily Revenue incl VAT', 'Daily Revenue TARGET Incl VAT',
    'Daily Revenue excl VAT', 'Pickle Occupancy', 'COMMENTS', '', '', '', 'Courts'
  ]

  summaryHeaders.forEach((h, i) => {
    const cell = summary.getCell(1, i + 1)
    cell.value = h
    styleHeader(cell, h === '' ? WHITE : RED)
  })

  summary.columns = [
    { key: 'club', width: 16 },
    { key: 'date', width: 14 },
    { key: 'occupancy', width: 20 },
    { key: 'revIncVat', width: 22 },
    { key: 'target', width: 24 },
    { key: 'revExcVat', width: 22 },
    { key: 'pickle', width: 18 },
    { key: 'comments', width: 16 },
    { key: 'c1', width: 6 },
    { key: 'c2', width: 6 },
    { key: 'c3', width: 6 },
    { key: 'courts', width: 8 },
  ]

  const today = new Date(year, month, new Date().getDate())
  let totalRevenue = 0
  let totalTarget = 0
  let weightedOccupancyNumerator = 0
  let totalCourts = 0
  let pickleOccupancyValues: number[] = []

  clubs.forEach((club, idx) => {
    const row = summary.getRow(idx + 2)
    const config = clubConfigs.find(c => c.name.toUpperCase() === club.name) || {}
    const data = clubData[club.name]
    const todayData = data?.find(d =>
      d.date.getDate() === today.getDate() &&
      d.date.getMonth() === today.getMonth()
    )

    const revInc = todayData?.revenue ?? null
    const target = (config as ClubConfig).dailyTarget ?? null
    const revExc = revInc ? Math.round(revInc / VAT) : null
    const occ = todayData?.occupancy ?? null
    const pickle = todayData?.pickleOccupancy ?? null

    row.getCell(1).value = club.name
    row.getCell(2).value = today
    row.getCell(2).numFmt = 'dd/mm/yyyy'
    row.getCell(3).value = occ !== null ? occ : null
    row.getCell(4).value = revInc
    row.getCell(5).value = target
    row.getCell(6).value = revExc
    row.getCell(7).value = club.pickle > 0 ? (pickle ?? null) : null
    row.getCell(8).value = todayData?.comments ?? ''
    row.getCell(12).value = club.courts

    if (revInc) totalRevenue += revInc
    if (target) totalTarget += target
    if (occ !== null) {
      weightedOccupancyNumerator += occ * club.courts
      totalCourts += club.courts
    }
    if (pickle !== null && club.pickle > 0) pickleOccupancyValues.push(pickle)

    const bg = idx % 2 === 0 ? WHITE : LIGHT_GRAY
    for (let c = 1; c <= 12; c++) {
      styleCell(row.getCell(c), bg, c === 1, c === 1 ? 'left' : 'center')
    }
    row.getCell(1).font = { bold: true, size: 10 }
  })

  const totalRow = summary.getRow(clubs.length + 2)
  totalRow.getCell(1).value = 'AVE DAILY OCCUPANCY | Total Revenue'
  totalRow.getCell(2).value = today
  totalRow.getCell(2).numFmt = 'dd/mm/yyyy'
  totalRow.getCell(3).value = totalCourts > 0 ? Math.round(weightedOccupancyNumerator / totalCourts) : null
  totalRow.getCell(4).value = totalRevenue
  totalRow.getCell(5).value = totalTarget
  totalRow.getCell(6).value = Math.round(totalRevenue / VAT)
  totalRow.getCell(7).value = pickleOccupancyValues.length > 0
    ? Math.round(pickleOccupancyValues.reduce((a, b) => a + b, 0) / pickleOccupancyValues.length)
    : null

  for (let c = 1; c <= 12; c++) {
    styleHeader(totalRow.getCell(c), DARK)
  }

  const noteRow = summary.getRow(clubs.length + 4)
  noteRow.getCell(1).value = '* Playtomic formula being Booked Hours / Club Opening Hours * Number of Courts'
  noteRow.getCell(1).font = { italic: true, size: 9 }

  const weightedRow = summary.getRow(clubs.length + 5)
  weightedRow.getCell(11).value = 'WEIGHTED OCCUPANCY (# Courts)'
  weightedRow.getCell(12).value = totalCourts > 0 ? Math.round(weightedOccupancyNumerator / totalCourts) : null
  weightedRow.getCell(11).font = { bold: true, size: 9 }

  clubs.forEach(club => {
    const ws = workbook.addWorksheet(`${club.name}_${monthName}`, {
      pageSetup: { orientation: 'landscape', fitToPage: true }
    })

    const hasPickle = club.pickle > 0
    const data = clubData[club.name] || []
    const config = clubConfigs.find(c => c.name.toUpperCase() === club.name)

    const headers = ['', 'Date', 'Percentage', 'Daily Revenue',
      'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays']

    if (hasPickle) {
      headers.push('Percentage 2', 'Mondays 2', 'Tuesdays 2', 'Wednesdays 2',
        'Thursdays 2', 'Fridays 2', 'Saturdays 2', 'Sundays 2')
    }

    headers.forEach((h, i) => {
      const cell = ws.getCell(1, i + 1)
      cell.value = h === '' ? club.name : h
      styleHeader(cell)
    })

    ws.columns = [
      { key: 'day', width: 12 },
      { key: 'date', width: 14 },
      { key: 'pct', width: 12 },
      { key: 'rev', width: 16 },
      { key: 'mon', width: 10 }, { key: 'tue', width: 10 },
      { key: 'wed', width: 10 }, { key: 'thu', width: 10 },
      { key: 'fri', width: 10 }, { key: 'sat', width: 10 },
      { key: 'sun', width: 10 },
      ...(hasPickle ? [
        { key: 'ppct', width: 12 },
        { key: 'pmon', width: 10 }, { key: 'ptue', width: 10 },
        { key: 'pwed', width: 10 }, { key: 'pthu', width: 10 },
        { key: 'pfri', width: 10 }, { key: 'psat', width: 10 },
        { key: 'psun', width: 10 },
      ] : []),
    ]

    const dayColMap: { [key: string]: number } = {
      Monday: 5, Tuesday: 6, Wednesday: 7, Thursday: 8,
      Friday: 9, Saturday: 10, Sunday: 11
    }

    days.forEach((date, idx) => {
      const dayName = getDayOfWeek(date)
      const rowData = data.find(d => d.date.getDate() === date.getDate())
      const row = ws.getRow(idx + 2)
      const bg = idx % 2 === 0 ? WHITE : LIGHT_GRAY

      row.getCell(1).value = dayName
      row.getCell(2).value = date
      row.getCell(2).numFmt = 'dd/mm/yyyy'
      row.getCell(3).value = rowData?.occupancy ?? null
      row.getCell(4).value = rowData?.revenue ?? null

      if (rowData?.occupancy !== null && rowData?.occupancy !== undefined) {
        row.getCell(dayColMap[dayName]).value = rowData.occupancy
      }

      if (hasPickle && rowData?.pickleOccupancy !== null && rowData?.pickleOccupancy !== undefined) {
        row.getCell(12).value = rowData.pickleOccupancy
        row.getCell(dayColMap[dayName] + 8).value = rowData.pickleOccupancy
      }

      const colCount = hasPickle ? 19 : 11
      for (let c = 1; c <= colCount; c++) {
        styleCell(row.getCell(c), bg, false, c <= 2 ? 'left' : 'center')
      }
      row.getCell(4).numFmt = '#,##0.00'
    })

    const overallRowIdx = days.length + 2
    const overallRow = ws.getRow(overallRowIdx)
    const validData = data.filter(d => d.occupancy !== null)
    const avgOccupancy = validData.length > 0
      ? validData.reduce((a, d) => a + (d.occupancy ?? 0), 0) / validData.length
      : 0
    const totalRev = data.reduce((a, d) => a + (d.revenue ?? 0), 0)

    overallRow.getCell(1).value = 'Overall'
    overallRow.getCell(2).value = ''
    overallRow.getCell(3).value = Math.round(avgOccupancy * 100) / 100
    overallRow.getCell(4).value = totalRev

    DAYS.forEach((day, i) => {
      const dayData = data.filter(d => getDayOfWeek(d.date) === day && d.occupancy !== null)
      if (dayData.length > 0) {
        const avg = dayData.reduce((a, d) => a + (d.occupancy ?? 0), 0) / dayData.length
        overallRow.getCell(5 + i).value = Math.round(avg * 100) / 100
      }
    })

    for (let c = 1; c <= (hasPickle ? 19 : 11); c++) {
      styleHeader(overallRow.getCell(c), DARK)
    }

    const targetRowIdx = overallRowIdx + 1
    const targetRow = ws.getRow(targetRowIdx)
    const target = config?.dailyTarget
    const monthlyTarget = target ? target * days.length : null
    targetRow.getCell(1).value = `${monthName} Target`
    targetRow.getCell(3).value = monthlyTarget
    targetRow.getCell(4).value = monthlyTarget ? Math.round(monthlyTarget * VAT) : null
    for (let c = 1; c <= 4; c++) {
      styleHeader(targetRow.getCell(c), RED)
    }

    const rrrRowIdx = targetRowIdx + 1
    const rrrRow = ws.getRow(rrrRowIdx)
    rrrRow.getCell(3).value = '% Days'
    rrrRow.getCell(4).value = '% Achieved'
    rrrRow.getCell(5).value = 'Still required'
    rrrRow.getCell(6).value = 'Days left'
    rrrRow.getCell(7).value = 'RRR (Run Rate Required)'
    for (let c = 3; c <= 7; c++) {
      styleHeader(rrrRow.getCell(c), DARK)
    }

    const today2 = new Date()
    const daysElapsed = today2.getMonth() === month && today2.getFullYear() === year
      ? today2.getDate()
      : days.length
    const daysLeft = days.length - daysElapsed
    const pctDays = daysElapsed / days.length
    const pctAchieved = monthlyTarget ? totalRev / monthlyTarget : null
    const stillRequired = monthlyTarget ? monthlyTarget - totalRev : null
    const rrr = daysLeft > 0 && stillRequired ? stillRequired / daysLeft : 0

    const rrrDataRow = ws.getRow(rrrRowIdx + 1)
    rrrDataRow.getCell(3).value = Math.round(pctDays * 100) / 100
    rrrDataRow.getCell(4).value = pctAchieved ? Math.round(pctAchieved * 10000) / 10000 : null
    rrrDataRow.getCell(5).value = stillRequired ? Math.round(stillRequired) : null
    rrrDataRow.getCell(6).value = daysLeft
    rrrDataRow.getCell(7).value = rrr ? Math.round(rrr) : null

    const dowStartRow = rrrRowIdx + 3
    ws.getCell(dowStartRow, 10).value = 'Day of the week'
    ws.getCell(dowStartRow, 11).value = 'Occupancy'
    styleHeader(ws.getCell(dowStartRow, 10), DARK)
    styleHeader(ws.getCell(dowStartRow, 11), DARK)

    DAYS.forEach((day, i) => {
      const dayData = data.filter(d => getDayOfWeek(d.date) === day && d.occupancy !== null)
      const avg = dayData.length > 0
        ? dayData.reduce((a, d) => a + (d.occupancy ?? 0), 0) / dayData.length
        : null

      ws.getCell(dowStartRow + 1 + i, 10).value = day
      ws.getCell(dowStartRow + 1 + i, 11).value = avg ? Math.round(avg * 100) / 100 : null
      styleCell(ws.getCell(dowStartRow + 1 + i, 10), WHITE, false, 'left')
      styleCell(ws.getCell(dowStartRow + 1 + i, 11))
    })

    ws.getCell(dowStartRow + 8, 10).value = 'Overall'
    ws.getCell(dowStartRow + 8, 11).value = Math.round(avgOccupancy * 100) / 100
    styleHeader(ws.getCell(dowStartRow + 8, 10), DARK)
    styleHeader(ws.getCell(dowStartRow + 8, 11), DARK)
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
}

export async function generateEventsExcel(
  club: string,
  month: string,
  year: number,
  events: {
    id: number
    week: number
    type: string
    name: string
    date: string
    costPerPerson: number
    players: number
    courtsUsed: number
    duration: number
    courtRate: number
  }[],
  expenses: Record<number, EventExpenses>
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Padel Admin'
  workbook.created = new Date()

  const calcRevenue = (e: typeof events[0]) => e.costPerPerson * e.players
  const calcCourtExp = (e: typeof events[0]) => e.courtsUsed * e.duration * e.courtRate

  const defaultExp = (): EventExpenses => ({
    drinks: [], balls: [], adhoc: [], sponsors: []
  })

  const getExp = (id: number): EventExpenses => expenses[id] ?? defaultExp()

  const calcDrinkTotal = (id: number) =>
    getExp(id).drinks.reduce((s, d) => s + d.qty * d.unitPrice, 0)
  const calcBallTotal = (id: number) =>
    getExp(id).balls.reduce((s, b) => s + b.qty * b.unitPrice, 0)
  const calcAdhocTotal = (id: number) =>
    getExp(id).adhoc.reduce((s, a) => s + a.amount, 0)
  const calcSponsorTotal = (id: number) =>
    getExp(id).sponsors.reduce((s, sp) => s + sp.amount, 0)
  const calcTotalExp = (e: typeof events[0]) =>
    calcCourtExp(e) + calcDrinkTotal(e.id) + calcBallTotal(e.id) + calcAdhocTotal(e.id)
  const calcPL = (e: typeof events[0]) =>
    calcRevenue(e) - calcTotalExp(e) + calcSponsorTotal(e.id)
  const calcRoyalty = (e: typeof events[0]) => calcRevenue(e) * 0.06
  const calcNet = (e: typeof events[0]) => calcPL(e) - calcRoyalty(e)

  const weeks = [...new Set(events.map(e => e.week))].sort()

  // Helper to flatten multi-row adhoc and sponsors for Excel display
  const getAdhocStr = (id: number) => {
    const rows = getExp(id).adhoc.filter(a => a.amount > 0)
    return rows.length > 0 ? rows.map(a => `${a.description || 'Adhoc'} (R${a.amount})`).join(', ') : '-'
  }
  const getSponsorStr = (id: number) => {
    const rows = getExp(id).sponsors.filter(s => s.name)
    return rows.length > 0 ? rows.map(s => s.name).join(', ') : '-'
  }
  const getSponsorInvoiced = (id: number) => {
    const rows = getExp(id).sponsors
    if (rows.length === 0) return '-'
    return rows.every(s => s.invoiced) ? 'Yes' : rows.some(s => s.invoiced) ? 'Partial' : 'No'
  }
  const getSponsorPaid = (id: number) => {
    const rows = getExp(id).sponsors
    if (rows.length === 0) return '-'
    return rows.every(s => s.paid) ? 'Yes' : rows.some(s => s.paid) ? 'Partial' : 'No'
  }
  const getPOPStatus = (id: number) => {
    const rows = getExp(id).sponsors
    if (rows.length === 0) return '-'
    const uploaded = rows.filter(s => s.popFileName).length
    return uploaded > 0 ? `${uploaded}/${rows.length} uploaded` : 'None'
  }

  const headers = [
    'EVENT TYPE', 'DATE', 'EVENT NAME',
    'COST/PERSON', '# PLAYERS', 'TOTAL REVENUE',
    '# COURTS', 'DURATION', 'COURT RATE', 'TOTAL COURT EXP',
    'DRINK TYPE', '# DRINKS', 'COST PRICE', 'DRINK TOTAL',
    'BALLS BRAND', '# CANS', 'COST PRICE', 'BALLS TOTAL',
    'ADHOC EXPENSES', 'TOTAL ADHOC',
    'TOTAL EXPENSE',
    'SPONSOR(S)', 'SPONSOR TOTAL', 'INVOICED', 'PAID', 'POP STATUS',
    'PROFIT / LOSS', 'LESS 6% ROYALTY', 'NET PROFIT', 'PROFIT MARGIN',
  ]

  const colWidths = [
    18, 10, 28, 12, 10, 14,
    10, 10, 12, 16,
    20, 10, 12, 12,
    20, 10, 12, 12,
    28, 12,
    14,
    24, 14, 10, 10, 14,
    14, 16, 14, 14,
  ]

  const buildSheet = (ws: ExcelJS.Worksheet, titleText: string) => {
    ws.mergeCells('A1:AD1')
    const titleCell = ws.getCell('A1')
    titleCell.value = titleText
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RED } }
    titleCell.font = { bold: true, color: { argb: WHITE }, size: 12 }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(1).height = 32

    headers.forEach((h, i) => {
      const cell = ws.getCell(2, i + 1)
      cell.value = h
      styleHeader(cell, DARK)
      ws.getColumn(i + 1).width = colWidths[i]
    })
    ws.getRow(2).height = 36

    let currentRow = 3

    weeks.forEach(week => {
      const weekEvents = events.filter(e => e.week === week)

      const whCell = ws.getCell(currentRow, 1)
      ws.mergeCells(currentRow, 1, currentRow, headers.length)
      whCell.value = `WEEK ${week}`
      whCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RED } }
      whCell.font = { bold: true, color: { argb: WHITE }, size: 10 }
      whCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
      ws.getRow(currentRow).height = 24
      currentRow++

      weekEvents.forEach((ev, idx) => {
        const exp = getExp(ev.id)
        const row = ws.getRow(currentRow)
        const bg = idx % 2 === 0 ? WHITE : LIGHT_GRAY
        const revenue = calcRevenue(ev)
        const courtExp = calcCourtExp(ev)
        const drinkTotal = calcDrinkTotal(ev.id)
        const ballTotal = calcBallTotal(ev.id)
        const adhocTotal = calcAdhocTotal(ev.id)
        const sponsorTotal = calcSponsorTotal(ev.id)
        const totalExp = calcTotalExp(ev)
        const pl = calcPL(ev)
        const royalty = calcRoyalty(ev)
        const net = calcNet(ev)
        const margin = revenue > 0 ? net / revenue : 0

        const drinkStr = exp.drinks.filter(d => d.drinkName).map(d => `${d.drinkName} (${d.qty})`).join(', ') || '-'
        const drinkQty = exp.drinks.reduce((s, d) => s + d.qty, 0)
        const drinkCost = exp.drinks[0]?.unitPrice ?? 0
        const ballStr = exp.balls.filter(b => b.ballName).map(b => b.ballName).join(', ') || '-'
        const ballQty = exp.balls.reduce((s, b) => s + b.qty, 0)
        const ballCost = exp.balls[0]?.unitPrice ?? 0

        const values = [
          ev.type, ev.date, ev.name,
          ev.costPerPerson, ev.players, revenue,
          ev.courtsUsed, ev.duration, ev.courtRate, courtExp,
          drinkStr, drinkQty, drinkCost, drinkTotal,
          ballStr, ballQty, ballCost, ballTotal,
          getAdhocStr(ev.id), adhocTotal,
          totalExp,
          getSponsorStr(ev.id), sponsorTotal,
          getSponsorInvoiced(ev.id), getSponsorPaid(ev.id), getPOPStatus(ev.id),
          pl, royalty, net,
          `${(margin * 100).toFixed(1)}%`,
        ]

        values.forEach((v, i) => {
          const cell = row.getCell(i + 1)
          cell.value = v
          styleCell(cell, bg, false, i < 2 ? 'left' : 'center')
          if (i === 26) cell.font = { bold: true, color: { argb: pl >= 0 ? GREEN : 'FFFF0000' }, size: 10 }
          if (i === 28) cell.font = { bold: true, color: { argb: net >= 0 ? GREEN : 'FFFF0000' }, size: 10 }
          if ([3, 5, 8, 9, 12, 13, 16, 17, 19, 20, 22, 26, 27, 28].includes(i)) {
            cell.numFmt = 'R #,##0.00'
          }
        })

        row.height = 20
        currentRow++
      })

      // Week totals
      const wRev = weekEvents.reduce((s, e) => s + calcRevenue(e), 0)
      const wExp = weekEvents.reduce((s, e) => s + calcTotalExp(e), 0)
      const wPL = weekEvents.reduce((s, e) => s + calcPL(e), 0)
      const wRoyalty = weekEvents.reduce((s, e) => s + calcRoyalty(e), 0)
      const wNet = wPL - wRoyalty

      const totalsRow = ws.getRow(currentRow)
      const totalsValues = Array(headers.length).fill('')
      totalsValues[0] = 'TOTALS'
      totalsValues[5] = wRev
      totalsValues[9] = wExp
      totalsValues[26] = wPL
      totalsValues[27] = wRoyalty
      totalsValues[28] = wNet

      totalsValues.forEach((v, i) => {
        const cell = totalsRow.getCell(i + 1)
        cell.value = v
        styleHeader(cell, DARK)
        if ([5, 9, 26, 27, 28].includes(i) && typeof v === 'number') cell.numFmt = 'R #,##0.00'
        if (i === 26) cell.font = { bold: true, color: { argb: wPL >= 0 ? 'FF4ADE80' : 'FFf87171' }, size: 10 }
        if (i === 28) cell.font = { bold: true, color: { argb: wNet >= 0 ? 'FF4ADE80' : 'FFf87171' }, size: 10 }
      })
      totalsRow.height = 24
      currentRow += 2
    })

    // Grand totals
    const allRev = events.reduce((s, e) => s + calcRevenue(e), 0)
    const allExp = events.reduce((s, e) => s + calcTotalExp(e), 0)
    const allPL = events.reduce((s, e) => s + calcPL(e), 0)
    const allRoyalty = events.reduce((s, e) => s + calcRoyalty(e), 0)
    const allNet = allPL - allRoyalty

    const grandRow = ws.getRow(currentRow)
    ws.mergeCells(currentRow, 1, currentRow, 5)
    grandRow.getCell(1).value = `MONTH TOTAL — ${month.toUpperCase()} ${year}`
    grandRow.getCell(6).value = allRev
    grandRow.getCell(10).value = allExp
    grandRow.getCell(27).value = allPL
    grandRow.getCell(28).value = allRoyalty
    grandRow.getCell(29).value = allNet

    for (let c = 1; c <= headers.length; c++) {
      const cell = grandRow.getCell(c)
      styleHeader(cell, RED)
      if ([6, 10, 27, 28, 29].includes(c)) cell.numFmt = 'R #,##0.00'
    }
    grandRow.height = 28
  }

  // Build both sheets using the same helper
  const summary = workbook.addWorksheet('SUMMARY', {
    pageSetup: { orientation: 'landscape', fitToPage: true }
  })
  buildSheet(summary, `VIRGIN ACTIVE PADEL — EVENT P&L REPORT · ${club} · ${month} ${year}`)

  const clubSheet = workbook.addWorksheet(`${club} - ${month}`, {
    pageSetup: { orientation: 'landscape', fitToPage: true }
  })
  buildSheet(clubSheet, `${club} · EVENT P&L · ${month} ${year}`)

  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
}

export async function generateAllClubsEventsExcel(
  month: string,
  year: number,
  clubSummaries: {
    name: string
    eventCount: number
    revenue: number
    expenses: number
    pl: number
    net: number
    margin: number
  }[]
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Padel Admin'
  workbook.created = new Date()

  const ws = workbook.addWorksheet('ALL CLUBS SUMMARY', {
    pageSetup: { orientation: 'landscape', fitToPage: true }
  })

  const headers = [
    'CLUB', 'EVENTS', 'REVENUE', 'EXPENSES',
    'PROFIT / LOSS', 'NET PROFIT (AFTER 6%)', 'MARGIN %',
  ]
  const colWidths = [22, 12, 18, 18, 18, 20, 14]

  // ── Title banner ──
  ws.mergeCells(1, 1, 1, headers.length)
  const titleCell = ws.getCell('A1')
  titleCell.value = `VIRGIN ACTIVE PADEL — ALL CLUBS EVENT P&L SUMMARY · ${month.toUpperCase()} ${year}`
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RED } }
  titleCell.font = { bold: true, color: { argb: WHITE }, size: 12 }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 32

  // ── Subtitle ──
  ws.mergeCells(2, 1, 2, headers.length)
  const subCell = ws.getCell('A2')
  subCell.value = 'Head Office Overview — Generated from Event P&L data across all 17 clubs'
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK } }
  subCell.font = { italic: true, color: { argb: 'FFAAAAAA' }, size: 9 }
  subCell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(2).height = 20

  // ── Column headers ──
  headers.forEach((h, i) => {
    const cell = ws.getCell(3, i + 1)
    cell.value = h
    styleHeader(cell, DARK)
    ws.getColumn(i + 1).width = colWidths[i]
  })
  ws.getRow(3).height = 28

  // ── Sort by revenue descending for the export, matching the on-screen default ──
  const sorted = [...clubSummaries].sort((a, b) => b.revenue - a.revenue)

  let currentRow = 4
  sorted.forEach((c, idx) => {
    const row = ws.getRow(currentRow)
    const bg = idx % 2 === 0 ? WHITE : LIGHT_GRAY

    const values = [
      c.name,
      c.eventCount,
      c.revenue,
      c.expenses,
      c.pl,
      c.net,
      `${(c.margin * 100).toFixed(1)}%`,
    ]

    values.forEach((v, i) => {
      const cell = row.getCell(i + 1)
      cell.value = v
      styleCell(cell, bg, i === 0, i === 0 ? 'left' : 'center')
      if ([2, 3, 4, 5].includes(i)) cell.numFmt = 'R #,##0.00'
      if (i === 4) cell.font = { bold: true, color: { argb: c.pl >= 0 ? GREEN : 'FFFF0000' }, size: 10 }
      if (i === 5) cell.font = { bold: true, color: { argb: c.net >= 0 ? GREEN : 'FFFF0000' }, size: 10 }
    })

    row.height = 20
    currentRow++
  })

  // ── Grand totals row ──
  const grandEvents   = sorted.reduce((s, c) => s + c.eventCount, 0)
  const grandRevenue  = sorted.reduce((s, c) => s + c.revenue, 0)
  const grandExpenses = sorted.reduce((s, c) => s + c.expenses, 0)
  const grandPL       = sorted.reduce((s, c) => s + c.pl, 0)
  const grandNet      = sorted.reduce((s, c) => s + c.net, 0)
  const grandMargin   = grandRevenue > 0 ? (grandNet / grandRevenue) * 100 : 0

  const totalsRow = ws.getRow(currentRow)
  const totalsValues = [
    'ALL CLUBS TOTAL', grandEvents, grandRevenue, grandExpenses,
    grandPL, grandNet, `${grandMargin.toFixed(1)}%`,
  ]

  totalsValues.forEach((v, i) => {
    const cell = totalsRow.getCell(i + 1)
    cell.value = v
    styleHeader(cell, RED)
    if ([2, 3, 4, 5].includes(i)) cell.numFmt = 'R #,##0.00'
    if (i === 4) cell.font = { bold: true, color: { argb: grandPL >= 0 ? 'FF4ADE80' : 'FFf87171' }, size: 11 }
    if (i === 5) cell.font = { bold: true, color: { argb: grandNet >= 0 ? 'FF4ADE80' : 'FFf87171' }, size: 11 }
  })
  totalsRow.height = 28

  // ── Footer note ──
  const noteRow = currentRow + 2
  ws.getCell(noteRow, 1).value = `Generated ${new Date().toLocaleDateString('en-ZA')} · Royalty deducted at 6% of gross revenue`
  ws.getCell(noteRow, 1).font = { italic: true, size: 9, color: { argb: 'FF888888' } }

  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
}