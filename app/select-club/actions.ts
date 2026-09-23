'use server'
import { getClubAccess } from '@/lib/auth/club-access'

export interface ClubLocation {
  id: string
  name: string
  latitude: number | null
  longitude: number | null
}

// Filter explicitly because the directory itself is visible to authenticated users.
export async function listAccessibleClubsWithLocation(): Promise<ClubLocation[]> {
  const { client, global, clubIds } = await getClubAccess()
  if (!global && clubIds.length === 0) return []
  let query = client
    .from('clubs')
    .select('id, name, latitude, longitude')
    .eq('is_active', true)
    .order('name')
  if (!global) query = query.in('id', clubIds)
  const { data, error } = await query
  if (error) throw error
  return data as ClubLocation[]
}
