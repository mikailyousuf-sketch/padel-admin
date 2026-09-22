import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WelcomeClient from './WelcomeClient'

export default async function WelcomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // NOTE: using auth metadata / email rather than a guessed `profiles` column
  // name. If you store a proper display name on `profiles` (e.g. full_name),
  // swap this for a query against that table — this is a safe placeholder
  // that won't break if that column doesn't exist or isn't populated.
  const name =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email?.split('@')[0] ||
    'there'

  const displayName = name.charAt(0).toUpperCase() + name.slice(1)

  return <WelcomeClient name={displayName} />
}