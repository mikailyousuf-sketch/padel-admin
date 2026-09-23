'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getClubAccess } from '@/lib/auth/club-access'
import { COMPANY_SCOPE, SCOPE_COOKIE } from './constants'

/**
 * Sets the person's chosen scope (a specific club_id, or the company-wide
 * sentinel) and sends them into the app. Called from the club map when
 * someone clicks a pin or "Entire Company."
 *
 * NOTE: this only stores the choice. Wiring existing pages (Home, Reports,
 * etc.) to actually read this cookie and scope their queries by it is a
 * separate follow-up — right now RLS still does the real access control,
 * this cookie is purely "what does this person want to look at right now."
 */
export async function selectScope(value: string) {
  const { client, global, clubIds } = await getClubAccess()
  if (value === COMPANY_SCOPE) {
    if (!global) throw new Error('Company-wide access is not enabled for your account.')
  } else {
    if (!global && !clubIds.includes(value)) throw new Error('This club is not assigned to you.')
    const { data, error } = await client.from('clubs').select('id').eq('id', value).eq('is_active', true).single()
    if (error || !data) throw new Error('This club is unavailable.')
  }
  const cookieStore = await cookies()
  cookieStore.set(SCOPE_COOKIE, value, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  })
  redirect('/')
}

/** Read the current scope server-side. Returns null if nothing chosen yet. */
export async function getSelectedScope(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(SCOPE_COOKIE)?.value ?? null
}
