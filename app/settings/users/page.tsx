import { ActionForm } from './action-form'
import { listClubs, listUsers, submitManagedUser, submitRemoveUser } from './actions'
import { matchRolePreset } from './constants'
import { RoleSelector } from './role-selector'
import { theme } from '../../components/theme'
import { Shield, Trash2, UserPlus, Building2 } from 'lucide-react'

const T = theme

export default async function UsersAdminPage() {
  const [clubs, users] = await Promise.all([listClubs(), listUsers()])

  return (
    <div style={{ minHeight: '100vh', background: T.colors.bg }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 36px' }}>

        {/* ── Page header ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.colors.red, boxShadow: T.shadow.redGlowSm }} />
            <span style={{ fontSize: '11px', color: T.colors.red, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Settings</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: T.colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>User Management</h1>
          <p style={{ fontSize: '13px', color: T.colors.textSecondary, marginTop: '5px' }}>
            Invite managers, assign clubs and set access permissions · {users.length} user{users.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            CREATE USER FORM
        ══════════════════════════════════════════════════════════════ */}
        <ActionForm
          action={submitManagedUser}
          successMessage="Invitation sent and access configured."
          style={{
            ...T.card,
            marginBottom: '32px',
            border: `1px solid rgba(224,10,9,0.2)`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <UserPlus size={15} color={T.colors.red} />
            <span style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary }}>Add a New User</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
            <div>
              <label style={fieldLabel}>Full Name</label>
              <input name="fullName" placeholder="e.g. Sarah Bennett" required style={T.input} />
            </div>
            <div>
              <label style={fieldLabel}>Email</label>
              <input name="email" type="email" placeholder="name@virginactivepadelclub.co.za" required style={T.input} />
            </div>
          </div>

          {/* HOO toggle */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 16px', borderRadius: T.radius.md,
            background: T.colors.redGlow, border: `1px solid rgba(224,10,9,0.2)`,
            cursor: 'pointer', marginBottom: '20px',
          }}>
            <input type="checkbox" name="isHoo" style={{ width: '15px', height: '15px', accentColor: T.colors.red, flexShrink: 0 }} />
            <div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: T.colors.red, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={13} /> Head Office (HOO)
              </span>
              <span style={{ fontSize: '11px', color: T.colors.textMuted, display: 'block', marginTop: '2px' }}>
                Full access to every club, bypasses all club assignments and permissions below.
              </span>
            </div>
          </label>

          {/* Club assignments */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ ...fieldLabel, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={11} /> Club Assignments
            </label>
            <p style={{ fontSize: '11px', color: T.colors.textMuted, margin: '0 0 12px' }}>
              Select clubs for managers. Head Office and roles with all-clubs access can access every club.
            </p>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '8px',
              padding: '14px', background: T.colors.surfaceRaised,
              border: `1px solid ${T.colors.border}`, borderRadius: T.radius.md,
            }}>
              {clubs.map((club) => (
                <label key={club.id} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '12px', color: T.colors.textSecondary,
                  padding: '6px 12px', borderRadius: '999px',
                  background: T.colors.surface, border: `1px solid ${T.colors.border}`,
                  cursor: 'pointer',
                }}>
                  <input type="checkbox" name="clubIds" value={club.id} style={{ accentColor: T.colors.red, width: '13px', height: '13px' }} />
                  {club.name}
                </label>
              ))}
            </div>
          </div>

          {/* Role/permissions selector — external component, styled wrapper only */}
          <div style={{ marginBottom: '24px' }}>
            <label style={fieldLabel}>Permissions</label>
            <RoleSelector />
          </div>

          <button type="submit" style={{
            ...T.btn.primary,
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: T.shadow.redGlowSm,
          }}>
            <UserPlus size={14} /> Send Invite
          </button>
        </ActionForm>

        {/* ══════════════════════════════════════════════════════════════
            EXISTING USERS
        ══════════════════════════════════════════════════════════════ */}
        <p style={{ fontSize: '11px', fontWeight: '700', color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
          Existing Users
        </p>

        {users.length === 0 ? (
          <div style={{ ...T.card, textAlign: 'center', padding: '40px', color: T.colors.textMuted }}>
            No users added yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {users.map((u) => (
              <div key={u.id} style={{ ...T.card, marginBottom: 0, padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: T.colors.textPrimary, margin: 0 }}>{u.full_name}</p>
                      {u.is_hoo && (
                        <span style={{
                          fontSize: '9px', fontWeight: '700', padding: '2px 7px', borderRadius: '999px',
                          textTransform: 'uppercase', letterSpacing: '0.04em',
                          background: T.colors.redGlow, color: T.colors.red, border: `1px solid rgba(224,10,9,0.2)`,
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                        }}>
                          <Shield size={9} /> HOO
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: 0 }}>{u.email}</p>
                  </div>

                  <div style={{ flexShrink: 0, textAlign: 'right', minWidth: '160px' }}>
                    <p style={{ fontSize: '11px', color: T.colors.textSecondary, margin: '0 0 3px' }}>
                      {u.is_hoo ? 'All clubs' : (u.clubs.join(', ') || '—')}
                    </p>
                    <p style={{ fontSize: '10px', color: T.colors.textMuted, fontFamily: "'SF Mono', monospace", margin: 0 }}>
                      {matchRolePreset(u.permissions)}
                    </p>
                  </div>

                  <ActionForm action={submitRemoveUser.bind(null, u.id)} confirmation={`Remove ${u.full_name || u.email}? This permanently deletes their login.`} successMessage="User removed." style={{ flexShrink: 0 }}>
                    <button type="submit" style={{
                      ...T.btn.ghost,
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '6px 12px', fontSize: '11px',
                      color: T.colors.red, border: `1px solid rgba(224,10,9,0.2)`,
                    }}>
                      <Trash2 size={11} /> Remove
                    </button>
                  </ActionForm>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

const fieldLabel: React.CSSProperties = {
  fontSize: '11px', fontWeight: '600', color: T.colors.textSecondary,
  textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '7px',
}
