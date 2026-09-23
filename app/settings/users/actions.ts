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
  return user.id
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

  const { data: assignments, error: assignmentError } = await admin
    .from('club_assignments')
    .select('user_id, clubs(name)')

  const { data: permissions, error: permissionError } = await admin
    .from('user_permissions')
    .select('user_id, permission_key')

  if (assignmentError || permissionError) throw new Error('Could not load user access. Refresh and retry.')
  return profiles.map((p) => ({
    ...p,
    clubs: assignments?.filter((a) => a.user_id === p.id).flatMap(a => {
      const clubs = a.clubs as unknown as { name: string } | { name: string }[] | null
      return Array.isArray(clubs) ? clubs.map(club => club.name) : clubs ? [clubs.name] : []
    }) ?? [],
    permissions: permissions?.filter((perm) => perm.user_id === p.id).map((perm) => perm.permission_key) ?? [],
  }))
}

export async function createManagedUser(formData: FormData) {
  await assertCallerIsHoo()
  const admin = createAdminClient()

  const fullName = String(formData.get('fullName') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (fullName.length < 2 || fullName.length > 120) throw new Error('Enter a full name between 2 and 120 characters.')
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.')
  const isHoo = formData.get('isHoo') === 'on'
  const clubIds = [...new Set(formData.getAll('clubIds').map(String))]
  const grantedPermissions = PERMISSION_KEYS.filter((k) => formData.get(`perm_${k}`) === 'on')

  if (!isHoo && !grantedPermissions.includes('all_clubs_access') && clubIds.length === 0) {
    throw new Error('Select at least one club for this user.')
  }
  if (clubIds.length) {
    const { data, error } = await admin.from('clubs').select('id').in('id', clubIds).eq('is_active', true)
    if (error || data?.length !== clubIds.length) throw new Error('One or more selected clubs are unavailable. Refresh and retry.')
  }
  if (grantedPermissions.length) {
    const { data, error } = await admin.from('permissions').select('key').in('key', grantedPermissions)
    if (error || data?.length !== grantedPermissions.length) throw new Error('Permission setup is incomplete. Apply the permission catalog migration before inviting this role.')
  }

  // 1. Create the auth user, send them an invite email to set their own password
  const { data: created, error: createError } = await admin.auth.admin.inviteUserByEmail(email)
  if (createError) throw createError

  const newUserId = created.user.id

  const { error: setupError } = await admin.rpc('configure_managed_user', {
    p_user_id: newUserId, p_full_name: fullName, p_email: email, p_is_hoo: isHoo,
    p_club_ids: clubIds, p_permissions: grantedPermissions,
  })
  if (setupError) {
    // Auth invitations and SQL cannot share a transaction. Remove only the new
    // identity from this request if configuration fails, so no partial access remains.
    const { error: rollbackError } = await admin.auth.admin.deleteUser(newUserId)
    if (rollbackError) throw new Error(`Invitation created but access setup failed for ${email}. Account cleanup also failed; contact the administrator before retrying.`)
    throw new Error('Access setup failed and the new account was removed. An invitation email may already have been sent; it should not be used. Check database migrations before retrying.')
  }

  revalidatePath('/settings/users')
}

export async function deleteManagedUser(userId: string) {
  const callerId = await assertCallerIsHoo()
  if (callerId === userId) throw new Error('You cannot remove your own account.')
  const admin = createAdminClient()
  const { data: target, error: targetError } = await admin.from('profiles').select('is_hoo').eq('id', userId).single()
  if (targetError || !target) throw new Error('User not found. Refresh the list.')
  if (target.is_hoo) throw new Error('Head of Operations accounts cannot be removed here.')
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) throw error
  // profiles/club_assignments/user_permissions rows cascade-delete automatically
  revalidatePath('/settings/users')
}


export async function submitManagedUser(form: FormData) {
  try { await createManagedUser(form); return {} }
  catch (error) { return { error: error instanceof Error ? error.message : 'Could not create the user. Refresh the list before retrying.' } }
}

export async function submitRemoveUser(userId: string) {
  try { await deleteManagedUser(userId); return {} }
  catch (error) { return { error: error instanceof Error ? error.message : 'Could not remove this user. They may have linked records.' } }
}
