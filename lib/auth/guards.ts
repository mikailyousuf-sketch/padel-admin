import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Backend/HOO-only route guard. Use at the top of any server-component
 * page.tsx that a club manager should never be able to reach, even by
 * typing the URL directly — RLS scopes the *data*, this scopes the *page*.
 *
 * Usage:
 *   export default async function InfrastructurePage() {
 *     await requirePermission('manage_infrastructure', '/maintenance')
 *     return <InfrastructureClient />
 *   }
 */
export async function requirePermission(key: string, fallbackPath: string = '/') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: isHoo } = await supabase.rpc('is_hoo', { p_user_id: user!.id })
  if (isHoo) return

  const { data: hasPerm } = await supabase.rpc('has_permission', { p_user_id: user!.id, p_key: key })
  if (hasPerm) return

  redirect(fallbackPath)
}

/** HOO-only route guard (no permission key needed — e.g. audit_log viewers, org-wide settings). */
export async function requireHoo(fallbackPath: string = '/') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: isHoo } = await supabase.rpc('is_hoo', { p_user_id: user!.id })
  if (!isHoo) redirect(fallbackPath)
}