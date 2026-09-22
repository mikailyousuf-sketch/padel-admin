'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface StaffMemberRow {
  id: string
  club_id: string | null
  full_name: string
  role_title: string
  employment_type: string
  profile_id: string | null
  status: string
  start_date: string | null
  end_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  clubs?: { name: string }
}

export interface LeaveRequestRow {
  id: string
  staff_id: string
  club_id: string
  leave_type: string
  start_date: string
  end_date: string
  reason: string | null
  status: string
  submitted_by: string
  decided_by: string | null
  decision_note: string | null
  created_at: string
  updated_at: string
  staff_members?: { full_name: string; role_title: string }
  clubs?: { name: string }
}

export interface HrIncidentRow {
  id: string
  staff_id: string
  club_id: string
  category: string
  description: string
  status: string
  logged_by: string
  resolution_note: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
  staff_members?: { full_name: string; role_title: string }
  clubs?: { name: string }
}

export interface StaffCompensationRow {
  id: string
  staff_id: string
  monthly_rate: number | null
  pay_frequency: string
  updated_at: string
  staff_members?: { full_name: string; role_title: string; club_id: string | null }
}

// ── Reads (RLS scopes all of these automatically) ───────────────────────────

export async function listStaffForClub() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('staff_members')
    .select('*, clubs(name)')
    .order('full_name')
  if (error) throw error
  return data as StaffMemberRow[]
}

export async function listLeaveRequests() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*, staff_members(full_name, role_title), clubs(name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as LeaveRequestRow[]
}

export async function listHrIncidents() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hr_incidents')
    .select('*, staff_members(full_name, role_title), clubs(name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as HrIncidentRow[]
}

// HR/HOO only — RLS will simply return nothing for anyone else, but this
// should only ever be called from the /hr-finance backend, never /hr.
export async function listStaffCompensation() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('staff_compensation')
    .select('*, staff_members(full_name, role_title, club_id)')
  if (error) throw error
  return data as StaffCompensationRow[]
}

// ── Leave requests ────────────────────────────────────────────────────────────

export async function createLeaveRequest(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('leave_requests').insert({
    staff_id: formData.get('staffId') as string,
    club_id: formData.get('clubId') as string,
    leave_type: formData.get('leaveType') as string,
    start_date: formData.get('startDate') as string,
    end_date: formData.get('endDate') as string,
    reason: (formData.get('reason') as string) || null,
    status: 'submitted',
    submitted_by: user?.id,
  })
  if (error) throw error
  revalidatePath('/hr')
  revalidatePath('/hr-finance')
}

export async function decideLeaveRequest(id: string, status: 'approved' | 'rejected', note?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('leave_requests')
    .update({ status, decided_by: user?.id, decision_note: note ?? null })
    .eq('id', id)
  if (error) throw error
  revalidatePath('/hr')
  revalidatePath('/hr-finance')
}

// ── HR incidents ──────────────────────────────────────────────────────────────

export async function createHrIncident(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('hr_incidents').insert({
    staff_id: formData.get('staffId') as string,
    club_id: formData.get('clubId') as string,
    category: formData.get('category') as string,
    description: formData.get('description') as string,
    status: 'open',
    logged_by: user?.id,
  })
  if (error) throw error
  revalidatePath('/hr')
  revalidatePath('/hr-finance')
}

export async function updateIncidentStatus(id: string, status: string, resolutionNote?: string) {
  const supabase = await createClient()
  const update: Record<string, any> = { status }
  if (resolutionNote !== undefined) update.resolution_note = resolutionNote
  if (status === 'resolved') update.resolved_at = new Date().toISOString()

  const { error } = await supabase.from('hr_incidents').update(update).eq('id', id)
  if (error) throw error
  revalidatePath('/hr')
  revalidatePath('/hr-finance')
}

// ── Compensation (HR/HOO only — never called from /hr) ───────────────────────

export async function upsertStaffCompensation(staffId: string, monthlyRate: number, payFrequency: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('staff_compensation')
    .upsert(
      { staff_id: staffId, monthly_rate: monthlyRate, pay_frequency: payFrequency, updated_by: user?.id, updated_at: new Date().toISOString() },
      { onConflict: 'staff_id' }
    )
  if (error) throw error
  revalidatePath('/hr-finance')
}

// ── Roster management (HR/HOO only — never called from /hr) ──────────────────

export async function createStaffMember(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.from('staff_members').insert({
    club_id: (formData.get('clubId') as string) || null,
    full_name: formData.get('fullName') as string,
    role_title: formData.get('roleTitle') as string,
    employment_type: (formData.get('employmentType') as string) || 'full_time',
    start_date: (formData.get('startDate') as string) || null,
    notes: (formData.get('notes') as string) || null,
  })
  if (error) throw error
  revalidatePath('/hr-finance')
}

export async function updateStaffStatus(id: string, status: string) {
  const supabase = await createClient()
  const update: Record<string, any> = { status }
  if (status === 'terminated') update.end_date = new Date().toISOString().slice(0, 10)

  const { error } = await supabase.from('staff_members').update(update).eq('id', id)
  if (error) throw error
  revalidatePath('/hr')
  revalidatePath('/hr-finance')
}