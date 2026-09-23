import { datesInRange } from '../reporting/dates'
import { summarise, type DailyReport, type ReportClub } from '../reporting/model'

export interface UtilisationClub extends ReportClub { dailyTargetCents: number | null }
export function demoData(from: string, to: string) {
  const clubs: UtilisationClub[] = [
    { id: 'demo-riverside', name: 'Riverside Demo Club', court_count: 4, dailyTargetCents: 1400000 },
    { id: 'demo-hillcrest', name: 'Hillcrest Demo Club', court_count: 3, dailyTargetCents: 1000000 },
    { id: 'demo-lakeside', name: 'Lakeside Demo Club', court_count: 5, dailyTargetCents: 1800000 },
  ]
  const reports: DailyReport[] = []
  for (const [index, club] of clubs.entries()) for (const date of datesInRange(from, to)) {
    const day = Math.floor(Date.parse(date) / 86400000)
    // An intentional data gap demonstrates that missing trade is never zero trade.
    if (index === 1 && day % 13 === 0) continue
    const weekend = [0, 6].includes(new Date(date).getUTCDay())
    const courts = Array.from({ length: club.court_count ?? 0 }, (_, i) => {
      const available = weekend ? 960 : 1080
      const peakAvailable = 360
      const peakBooked = 180 + ((day + i * 3 + index * 7) % 6) * 30
      const offBooked = 60 + ((day * 3 + i + index * 11) % 8) * 30
      const games = Math.floor((peakBooked + offBooked) / 90)
      return { report_date: date, court_number: i + 1, available_minutes: available, booked_minutes: peakBooked + offBooked,
        peak_available_minutes: peakAvailable, peak_booked_minutes: peakBooked,
        net_revenue_cents: Math.round(peakBooked / 60 * 50000 + offBooked / 60 * 30000), games, player_visits: games * 4 }
    })
    reports.push({ club_id: club.id, report_date: date, import_id: `demo-${club.id}-${date}`, updated_at: `${date}T21:59:00Z`, courts })
  }
  return { clubs, reports }
}
export function clubMetrics(club: UtilisationClub, reports: DailyReport[], from: string, to: string) {
  const days = datesInRange(from, to)
  const rows = reports.filter(row => row.club_id === club.id && row.report_date >= from && row.report_date <= to)
  const total = summarise(rows.flatMap(row => row.courts))
  const coverage = rows.length / days.length
  const target = club.dailyTargetCents === null ? null : club.dailyTargetCents * days.length
  const weekday = Array.from({ length: 7 }, (_, i) => {
    const day = (i + 1) % 7
    const matching = rows.filter(row => new Date(row.report_date).getUTCDay() === day)
    return { label: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][day], ...summarise(matching.flatMap(row => row.courts)) }
  })
  return { ...total, days: rows.length, missingDays: days.length - rows.length, coverage,
    targetCents: target, targetPercent: target && coverage === 1 ? total.netRevenueCents / target * 100 : null,
    lastUpdated: rows.map(row => row.updated_at).sort().at(-1) ?? null, weekday,
    daily: days.map(date => ({ date, ...summarise(rows.find(row => row.report_date === date)?.courts ?? []) })) }
}
