'use server'
import { getClubAccess } from '@/lib/auth/club-access'

export interface AccessibleClub { id: string; name: string }

// The directory's RLS permits all authenticated readers, so explicitly scope it.
export async function loadClubPicker() {
  const { client, global, clubIds } = await getClubAccess()
  if (!global && clubIds.length === 0) return { clubs: [] as AccessibleClub[], canViewCompany: false }
  let query = client.from('clubs').select('id, name').eq('is_active', true).order('name')
  if (!global) query = query.in('id', clubIds)
  const { data, error } = await query
  if (error) throw new Error('Could not load your clubs. Please refresh and retry.')
  return { clubs: (data ?? []) as AccessibleClub[], canViewCompany: global }
}
