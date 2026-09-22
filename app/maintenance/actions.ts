'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface MaintenanceQuote {
  id: string
  vendorName: string
  amount: number
  notes: string
  submittedAt: string
}

export interface MaintenanceRequestRow {
  id: string
  club_id: string
  category: string
  title: string
  description: string
  priority: string
  status: string
  submitted_by: string
  assigned_to: string | null
  estimated_cost: number | null
  actual_cost: number | null
  resolution_note: string | null
  quotes: MaintenanceQuote[]
  selected_quote_id: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  clubs?: { name: string }
}

export interface ClubUpgradeRow {
  id: string
  club_id: string
  title: string
  description: string
  category: string
  status: string
  proposed_by: string
  estimated_cost: number | null
  actual_cost: number | null
  target_date: string | null
  completed_at: string | null
  created_at: string
  quotes: MaintenanceQuote[]
  selected_quote_id: string | null
  clubs?: { name: string }
}

// ── Reads ─────────────────────────────────────────────────────────────────
// RLS scopes both of these automatically: club managers see only their club,
// Sim (manage_infrastructure) and HOO see everything.

export async function listMaintenanceRequests() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('maintenance_requests')
    .select('*, clubs(name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as MaintenanceRequestRow[]
}

export async function listClubUpgrades() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('club_upgrades')
    .select('*, clubs(name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as ClubUpgradeRow[]
}

export async function listActiveClubsForMaintenance() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clubs')
    .select('id, name')
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return data
}

// ── Maintenance requests ─────────────────────────────────────────────────────

export async function createMaintenanceRequest(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('maintenance_requests').insert({
    club_id: formData.get('clubId') as string,
    category: formData.get('category') as string,
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    priority: (formData.get('priority') as string) || 'medium',
    status: 'submitted',
    submitted_by: user?.id,
    estimated_cost: formData.get('estimatedCost')
      ? parseFloat(formData.get('estimatedCost') as string)
      : null,
  })
  if (error) throw error
  revalidatePath('/maintenance')
}

export async function updateMaintenanceStatus(
  id: string,
  status: string,
  extra?: { assignedTo?: string; resolutionNote?: string; actualCost?: number }
) {
  const supabase = await createClient()
  const update: Record<string, any> = { status }
  if (extra?.assignedTo) update.assigned_to = extra.assignedTo
  if (extra?.resolutionNote !== undefined) update.resolution_note = extra.resolutionNote
  if (extra?.actualCost !== undefined) update.actual_cost = extra.actualCost
  if (status === 'completed') update.completed_at = new Date().toISOString()

  const { error } = await supabase.from('maintenance_requests').update(update).eq('id', id)
  if (error) throw error
  revalidatePath('/maintenance')
}

// A manager (or Sim/HOO) attaches a vendor quote while the request is still
// open for review. Read-modify-write on the jsonb array — fine at this volume;
// revisit with a dedicated quotes table if concurrent submissions become common.
export async function addMaintenanceQuote(id: string, quote: { vendorName: string; amount: number; notes: string }) {
  const supabase = await createClient()
  const { data: existing, error: fetchError } = await supabase
    .from('maintenance_requests')
    .select('quotes')
    .eq('id', id)
    .single()
  if (fetchError) throw fetchError

  const newQuote = {
    id: crypto.randomUUID(),
    vendorName: quote.vendorName,
    amount: quote.amount,
    notes: quote.notes,
    submittedAt: new Date().toISOString(),
  }
  const updatedQuotes = [...(existing?.quotes ?? []), newQuote]

  const { error } = await supabase
    .from('maintenance_requests')
    .update({ quotes: updatedQuotes })
    .eq('id', id)
  if (error) throw error
  revalidatePath('/maintenance')
  revalidatePath('/infrastructure')
}

// Sim/HOO picks the winning quote. This both records the decision and moves
// the request to approved with the chosen amount as the estimated cost —
// one action instead of three separate clicks.
export async function selectMaintenanceQuote(id: string, quoteId: string, amount: number) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('maintenance_requests')
    .update({ selected_quote_id: quoteId, estimated_cost: amount, status: 'approved' })
    .eq('id', id)
  if (error) throw error
  revalidatePath('/maintenance')
  revalidatePath('/infrastructure')
}

export async function deleteMaintenanceRequest(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('maintenance_requests').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/maintenance')
}

// ── Club upgrades ─────────────────────────────────────────────────────────────

export async function createClubUpgrade(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('club_upgrades').insert({
    club_id: formData.get('clubId') as string,
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    category: (formData.get('category') as string) || 'other',
    status: 'proposed',
    proposed_by: user?.id,
    estimated_cost: formData.get('estimatedCost')
      ? parseFloat(formData.get('estimatedCost') as string)
      : null,
    target_date: (formData.get('targetDate') as string) || null,
  })
  if (error) throw error
  revalidatePath('/maintenance')
}

export async function addClubUpgradeQuote(id: string, quote: { vendorName: string; amount: number; notes: string }) {
  const supabase = await createClient()
  const { data: existing, error: fetchError } = await supabase
    .from('club_upgrades')
    .select('quotes')
    .eq('id', id)
    .single()
  if (fetchError) throw fetchError

  const newQuote = {
    id: crypto.randomUUID(),
    vendorName: quote.vendorName,
    amount: quote.amount,
    notes: quote.notes,
    submittedAt: new Date().toISOString(),
  }
  const updatedQuotes = [...(existing?.quotes ?? []), newQuote]

  const { error } = await supabase.from('club_upgrades').update({ quotes: updatedQuotes }).eq('id', id)
  if (error) throw error
  revalidatePath('/maintenance')
  revalidatePath('/infrastructure')
}

export async function selectUpgradeQuote(id: string, quoteId: string, amount: number) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('club_upgrades')
    .update({ selected_quote_id: quoteId, estimated_cost: amount, status: 'approved' })
    .eq('id', id)
  if (error) throw error
  revalidatePath('/maintenance')
  revalidatePath('/infrastructure')
}

export async function updateUpgradeStatus(
  id: string,
  status: string,
  extra?: { actualCost?: number }
) {
  const supabase = await createClient()
  const update: Record<string, any> = { status }
  if (extra?.actualCost !== undefined) update.actual_cost = extra.actualCost
  if (status === 'complete') update.completed_at = new Date().toISOString()

  const { error } = await supabase.from('club_upgrades').update(update).eq('id', id)
  if (error) throw error
  revalidatePath('/maintenance')
}