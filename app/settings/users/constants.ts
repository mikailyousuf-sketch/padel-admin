export const PERMISSION_KEYS = [
  'all_clubs_access',
  'manage_finance',
  'manage_hr',
  'manage_marketing',
  'manage_utilisation',
  'manage_kpi_targets',
  'approve_discounts',
  'approve_quotes',
] as const

export const ROLE_PRESETS = {
  manager: {
    label: 'Manager',
    permissions: [] as string[],
    description: 'Access limited to assigned club(s) only.',
  },
  hr: {
    label: 'HR',
    permissions: ['manage_hr', 'all_clubs_access'],
    description: 'Player/staff roster access across all clubs.',
  },
  finance: {
    label: 'Finance',
    permissions: ['manage_finance', 'all_clubs_access'],
    description: 'Revenue targets, court pricing, financial reports across all clubs.',
  },
  utilisation: {
    label: 'Head of Utilisation',
    permissions: ['manage_utilisation', 'approve_discounts', 'all_clubs_access'],
    description: 'Occupancy/utilisation reports + discount & quote approval across all clubs.',
  },
  marketing: {
    label: 'Marketing',
    permissions: ['manage_marketing', 'all_clubs_access'],
    description: 'Marketing briefs and flyers across all clubs.',
  },
} as const

export type RolePresetKey = keyof typeof ROLE_PRESETS

// Reverse lookup: given a permission set, find which preset it matches (for display)
export function matchRolePreset(permissions: string[]): string {
  const sorted = [...permissions].sort().join(',')
  for (const [key, preset] of Object.entries(ROLE_PRESETS)) {
    if ([...preset.permissions].sort().join(',') === sorted) {
      return preset.label
    }
  }
  return permissions.length === 0 ? 'Manager' : 'Custom'
}