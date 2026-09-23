import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// SERVER-ONLY. Never import this file into a 'use client' component.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
