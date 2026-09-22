'use server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { SCOPE_COOKIE, COMPANY_SCOPE } from '@/lib/scope/constants'

export interface HeaderContext {
  scopeLabel: string
  userInitials: string
  userName: string
}

export async function getHeaderContext(): Promise<HeaderContext> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Same placeholder logic as /welcome — swap for a real `profiles` column
  // (e.g. full_name) if/when you confirm that field exists and is populated.
  const rawName =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email?.split('@')[0] ||
    'User'
  const userName = rawName.charAt(0).toUpperCase() + rawName.slice(1)
  const userInitials =
    userName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0]?.toUpperCase() ?? '')
      .join('') || 'U'

  const cookieStore = await cookies()
  const scopeValue = cookieStore.get(SCOPE_COOKIE)?.value

  let scopeLabel = 'Select a club'
  if (scopeValue === COMPANY_SCOPE) {
    scopeLabel = 'Entire Company'
  } else if (scopeValue) {
    const { data: club } = await supabase.from('clubs').select('name').eq('id', scopeValue).single()
    if (club?.name) scopeLabel = club.name
  }

  return { scopeLabel, userInitials, userName }
}