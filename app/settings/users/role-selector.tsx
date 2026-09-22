'use client'
import { useState } from 'react'
import { ROLE_PRESETS, PERMISSION_KEYS } from './constants'

export function RoleSelector() {
  const [selectedRole, setSelectedRole] = useState<string>('manager')
  const activePermissions = ROLE_PRESETS[selectedRole as keyof typeof ROLE_PRESETS]?.permissions ?? []

  return (
    <div>
      <p style={{ margin: '8px 0 4px', fontSize: 13, opacity: 0.7 }}>Role</p>
      <select
        name="rolePreset"
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value)}
        style={{
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px solid #2a2a2a',
          background: '#0a0a0a',
          color: '#fff',
          width: '100%',
        }}
      >
        {Object.entries(ROLE_PRESETS).map(([key, preset]) => (
          <option key={key} value={key}>{preset.label}</option>
        ))}
      </select>
      <p style={{ fontSize: 12, opacity: 0.6, margin: '4px 0 0' }}>
        {ROLE_PRESETS[selectedRole as keyof typeof ROLE_PRESETS]?.description}
      </p>

      {/* Hidden checkboxes carry the actual permission keys to the server action,
          pre-checked based on the selected role, not individually toggled by the HOO. */}
      {PERMISSION_KEYS.map((key) => (
        <input
          key={key}
          type="checkbox"
          name={`perm_${key}`}
          checked={activePermissions.includes(key)}
          readOnly
          hidden
        />
      ))}
    </div>
  )
}