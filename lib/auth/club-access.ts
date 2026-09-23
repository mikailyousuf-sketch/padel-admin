import { createClient } from '@/lib/supabase/server'

/** Explicit scope: the clubs SELECT policy exposes the whole directory. */
export async function getClubAccess() {
  const client = await createClient()
  const { data: { user }, error: authError } = await client.auth.getUser()
  if (authError || !user) throw new Error('Please sign in again.')
  const { data: global, error } = await client.rpc('has_permission', {
    p_user_id: user.id, p_key: 'all_clubs_access',
  })
  if (error) throw new Error('Could not check club access. Please retry.')
  if (global === true) return { client, global: true, clubIds: [] as string[] }
  const { data, error: assignmentError } = await client.from('club_assignments').select('club_id').eq('user_id', user.id)
  if (assignmentError) throw new Error('Could not load club assignments. Please retry.')
  return { client, global: false, clubIds: (data ?? []).map(row => row.club_id as string) }
}
