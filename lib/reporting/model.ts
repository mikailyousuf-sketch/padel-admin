import { isDate } from './dates'

// Provider-neutral contract. CSV is the first adapter; Playtomic must map into
// this format after its authorised response schema has been verified.
export interface CourtDay {
  report_date: string
  court_number: number
  available_minutes: number
  booked_minutes: number
  peak_available_minutes: number
  peak_booked_minutes: number
  net_revenue_cents: number
  games: number
  player_visits: number
}

export interface DailyReport {
  club_id: string
  report_date: string
  import_id: string
  courts: CourtDay[]
  updated_at: string
}

export interface ReportClub { id: string; name: string }

export function summarise(courts: CourtDay[]) {
  const sum = (key: keyof CourtDay) => courts.reduce((total, row) => total + Number(row[key]), 0)
  const available = sum('available_minutes'), booked = sum('booked_minutes')
  const peakAvailable = sum('peak_available_minutes'), peakBooked = sum('peak_booked_minutes')
  return {
    occupancy: available > 0 ? booked / available * 100 : null,
    peakOccupancy: peakAvailable > 0 ? peakBooked / peakAvailable * 100 : null,
    offPeakOccupancy: available > peakAvailable ? (booked - peakBooked) / (available - peakAvailable) * 100 : null,
    availableMinutes: available, bookedMinutes: booked,
    netRevenueCents: sum('net_revenue_cents'), games: sum('games'), playerVisits: sum('player_visits'),
  }
}

export const CSV_HEADERS = ['report_date', 'court_number', 'available_minutes', 'booked_minutes', 'peak_available_minutes', 'peak_booked_minutes', 'net_revenue', 'games', 'player_visits'] as const

// RFC-style CSV with quoted cells, CRLF and escaped quotes. Invalid quoting is
// rejected rather than silently shifting columns in financial data.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [], row: string[] = []
  let field = '', quoted = false, closedQuote = false
  const input = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const cell = () => { row.push(field.trim()); field = ''; closedQuote = false }
  const line = () => { cell(); if (row.some(Boolean)) rows.push([...row]); row.length = 0 }
  for (let i = 0; i < input.length; i++) {
    const c = input[i]
    if (quoted) {
      if (c === '"') {
        if (input[i + 1] === '"') { field += '"'; i++ } else { quoted = false; closedQuote = true }
      } else field += c
    } else if (c === ',') cell()
    else if (c === '\n') line()
    else if (c === '"' && field.length === 0 && !closedQuote) quoted = true
    else if (c === '"' || (closedQuote && c.trim() !== '')) throw new Error('Invalid CSV quoting.')
    else if (!closedQuote) field += c
  }
  if (quoted) throw new Error('Unclosed CSV quote.')
  line()
  return rows
}

export function parseDailyCsv(text: string, courtCount: number, today: string): CourtDay[] {
  if (!Number.isSafeInteger(courtCount) || courtCount < 1 || courtCount > 100) throw new Error('Set a valid court count in Club Configuration first.')
  const [headers, ...rows] = parseCsv(text)
  if (!headers || headers.length !== CSV_HEADERS.length || CSV_HEADERS.some((h, i) => headers[i] !== h)) throw new Error('Use the supplied CSV template and keep its column headings in order.')
  if (!rows.length || rows.length > 3100) throw new Error('Import between 1 and 3,100 court-day rows.')
  const seen = new Set<string>(), counts = new Map<string, number>()
  const parsed = rows.map((cells, index): CourtDay => {
    const fail = (message: string): never => { throw new Error(`Row ${index + 2}: ${message}`) }
    if (cells.length !== headers.length) fail('Incorrect column count.')
    const date = cells[0]
    if (!isDate(date) || date > today || date < '2000-01-01') fail('Use a valid date from 2000 onwards, no later than today.')
    const integer = (i: number, max: number) => {
      if (!/^\d+$/.test(cells[i])) fail(`${headers[i]} must be a whole number, including 0 where appropriate.`)
      const n = Number(cells[i])
      if (!Number.isSafeInteger(n) || n > max) fail(`${headers[i]} is out of range.`)
      return n
    }
    const court = integer(1, courtCount)
    if (court < 1) fail('Court numbers start at 1.')
    const key = `${date}:${court}`
    if (seen.has(key)) fail('Duplicate date and court.')
    seen.add(key); counts.set(date, (counts.get(date) ?? 0) + 1)
    const available = integer(2, 1440), booked = integer(3, 1440)
    const peakAvailable = integer(4, 1440), peakBooked = integer(5, 1440)
    if (booked > available || peakAvailable > available || peakBooked > peakAvailable || peakBooked > booked || booked - peakBooked > available - peakAvailable) fail('Booked and peak minutes exceed their available capacity.')
    if (!/^-?\d+(\.\d{1,2})?$/.test(cells[6])) fail('net_revenue must be rand and cents without a currency symbol or thousands separators.')
    const cents = Math.round(Number(cells[6]) * 100)
    if (!Number.isSafeInteger(cents) || Math.abs(cents) > 1000000000) fail('Revenue is out of range.')
    return { report_date: date, court_number: court, available_minutes: available, booked_minutes: booked, peak_available_minutes: peakAvailable, peak_booked_minutes: peakBooked, net_revenue_cents: cents, games: integer(7, 10000), player_visits: integer(8, 100000) }
  })
  if (counts.size > 31) throw new Error('Import at most 31 distinct dates at a time.')
  for (const [date, count] of counts) if (count !== courtCount) throw new Error(`${date}: include all ${courtCount} courts, including closed courts with zero minutes.`)
  return parsed.sort((a, b) => a.report_date.localeCompare(b.report_date) || a.court_number - b.court_number)
}
