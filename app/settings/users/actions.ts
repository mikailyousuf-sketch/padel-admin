'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

import { PERMISSION_KEYS } from './constants'

async function assertCallerIsHoo() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_hoo')
    .eq('id', user.id)
    .single()

  if (!profile?.is_hoo) throw new Error('Only HOO can manage users')
}

export async function listClubs() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('clubs').select('id, name').order('name')
  if (error) throw error
  return data
}

export async function listUsers() {
  await assertCallerIsHoo()
  const admin = createAdminClient()

  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id, full_name, email, is_hoo')
    .order('full_name')
  if (error) throw error

  const { data: assignments } = await admin
    .from('club_assignments')
    .select('user_id, clubs(name)')

  const { data: permissions } = await admin
    .from('user_permissions')
    .select('user_id, permission_key')

  return profiles.map((p) => ({
    ...p,
    clubs: assignments?.filter((a) => a.user_id === p.id).map((a: any) => a.clubs?.name) ?? [],
    permissions: permissions?.filter((perm) => perm.user_id === p.id).map((perm) => perm.permission_key) ?? [],
  }))
}

export async function createManagedUser(formData: FormData) {
  await assertCallerIsHoo()
  const admin = createAdminClient()

  const fullName = formData.get('fullName') as string
  const email = formData.get('email') as string
  const isHoo = formData.get('isHoo') === 'on'
  const clubIds = formData.getAll('clubIds') as string[]
  const grantedPermissions = PERMISSION_KEYS.filter((k) => formData.get(`perm_${k}`) === 'on')

  // 1. Create the auth user, send them an invite email to set their own password
  const { data: created, error: createError } = await admin.auth.admin.inviteUserByEmail(email)
  if (createError) throw createError

  const newUserId = created.user.id

  // 2. Profile row
  const { error: profileError } = await admin
    .from('profiles')
    .insert({ id: newUserId, full_name: fullName, email, is_hoo: isHoo })
  if (profileError) throw profileError

  // 3. Club assignments
  if (clubIds.length > 0) {
    const { error: clubError } = await admin
      .from('club_assignments')
      .insert(clubIds.map((clubId) => ({ user_id: newUserId, club_id: clubId })))
    if (clubError) throw clubError
  }

  // 4. Permissions
  if (grantedPermissions.length > 0) {
    const { error: permError } = await admin
      .from('user_permissions')
      .insert(grantedPermissions.map((key) => ({ user_id: newUserId, permission_key: key })))
    if (permError) throw permError
  }

  revalidatePath('/settings/users')
}

export async function deleteManagedUser(userId: string) {
  await assertCallerIsHoo()
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) throw error
  // profiles/club_assignments/user_permissions rows cascade-delete automatically
  revalidatePath('/settings/users')
}
