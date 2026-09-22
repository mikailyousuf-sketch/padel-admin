'use server'
import { createClient } from '@/lib/supabase/server'

export interface ClubLocation {
  id: string
  name: string
  latitude: number | null
  longitude: number | null
}

// RLS naturally scopes this: a manager gets back exactly their one club,
// a regional gets their assigned subset, HOO gets everything. The page
// doesn't need to know which of those it's talking to — it just reacts
// to how many rows come back.
export async function listAccessibleClubsWithLocation(): Promise<ClubLocation[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clubs')
    .select('id, name, latitude, longitude')
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return data as ClubLocation[]
}