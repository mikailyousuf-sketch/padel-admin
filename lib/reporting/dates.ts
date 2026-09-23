export const REPORT_TIMEZONE = 'Africa/Johannesburg'

export function businessDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: REPORT_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now)
}

export function monthRange(year: number, monthIndex: number) {
  const from = new Date(Date.UTC(year, monthIndex, 1)).toISOString().slice(0, 10)
  const to = new Date(Date.UTC(year, monthIndex + 1, 0)).toISOString().slice(0, 10)
  return { from, to }
}

export function currentMonthRange(now = new Date()) {
  const [year, month] = businessDate(now).split('-').map(Number)
  return monthRange(year, month - 1)
}

export function isDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
}

export function datesInRange(from: string, to: string): string[] {
  if (!isDate(from) || !isDate(to) || from > to) throw new Error('Choose a valid date range.')
  const count = (Date.parse(to) - Date.parse(from)) / 86400000 + 1
  if (count > 366) throw new Error('Choose no more than 366 days.')
  return Array.from({ length: count }, (_, i) => new Date(Date.parse(from) + i * 86400000).toISOString().slice(0, 10))
}
