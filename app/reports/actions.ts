'use server'
import { createClient } from '@/lib/supabase/server'
import { COMPANY_SCOPE } from '@/lib/scope/constants'

// ── Event P&L ─────────────────────────────────────────────────────────────────

export interface ReportEventRow {
  id: string
  club_id: string
  name: string
  event_type: string
  event_date: string
  cost_per_person: number
  players: number
  courts_used: number
  duration: number
  court_rate: number
  royalty_rate: number
  drinks: { name: string; qty: number; unitPrice: number }[]
  balls: { name: string; qty: number; unitPrice: number }[]
  adhoc: { description: string; amount: number }[]
  sponsors: { name: string; amount: number; invoiced: boolean; paid: boolean }[]
  clubs?: { name: string }
}

export async function listEventsForScope(scope: string, monthStart: string, monthEnd: string) {
  const supabase = await createClient()
  let query = supabase
    .from('club_events')
    .select('*, clubs(name)')
    .gte('event_date', monthStart)
    .lte('event_date', monthEnd)
    .order('event_date')

  if (scope !== COMPANY_SCOPE) {
    query = query.eq('club_id', scope)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as ReportEventRow[]
}

// ── Player Tracker ────────────────────────────────────────────────────────────
// Only 'staff' and 'ambassador' carry KPI targets — matches the categories
// tracked on the Player KPI Targets settings page. VAPC Members/VIP are
// customer benefit tiers, not staff/ambassador performance categories, and
// have no games-played tracking in the schema.

export interface ReportPlayerRow {
  id: string
  name: string
  category: 'staff' | 'ambassador'
  club_id: string
  club_name: string
  monthly_open_games: number
  monthly_private_games: number
  status: string
}

export interface KpiTargetRow {
  category: string
  open_game_target: number
  private_game_target: number
}

export async function listPlayersForScope(scope: string) {
  const supabase = await createClient()
  let query = supabase
    .from('players')
    .select('id, name, category, club_id, monthly_open_games, monthly_private_games, status, clubs(name)')
    .in('category', ['staff', 'ambassador'])

  if (scope !== COMPANY_SCOPE) {
    query = query.eq('club_id', scope)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    club_id: row.club_id,
    club_name: row.clubs?.name ?? '',
    monthly_open_games: row.monthly_open_games ?? 0,
    monthly_private_games: row.monthly_private_games ?? 0,
    status: row.status,
  })) as ReportPlayerRow[]
}

export async function listKpiTargets() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('kpi_targets')
    .select('category, open_game_target, private_game_target')
  if (error) throw error
  return (data ?? []) as KpiTargetRow[]
}

// ── Peak/off-peak window for the Occupancy header ────────────────────────────
// This replaces the old localStorage('padel_clubs') read — that was never
// real data, just whatever got cached in the browser. This is a live query,
// scoped the same way as Home.

export async function getClubConfigForScope(scope: string) {
  const supabase = await createClient()
  let query = supabase
    .from('club_config')
    .select('peak_morning_start, peak_morning_end, peak_evening_start, peak_evening_end, clubs(name)')

  const { data, error } = scope !== COMPANY_SCOPE
    ? await query.eq('club_id', scope).limit(1)
    : await query.order('clubs(name)').limit(1)

  if (error) throw error
  return data?.[0] ?? null
}