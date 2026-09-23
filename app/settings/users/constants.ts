export const PERMISSION_KEYS = [
  'all_clubs_access',
  'manage_finance',
  'manage_hr', // Legacy permission retained for existing accounts.
  'manage_hr_finance',
  'manage_infrastructure',
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
    label: 'HR & Staff Finance',
    permissions: ['manage_hr_finance', 'all_clubs_access'],
    description: 'Staff records, leave, incidents and staff compensation across all clubs.',
  },
  infrastructure: {
    label: 'Infrastructure',
    permissions: ['manage_infrastructure', 'all_clubs_access'],
    description: 'Maintenance requests and club upgrades across all clubs.',
  },
  finance: {
    label: 'Finance',
    permissions: ['manage_finance', 'all_clubs_access'],
    description: 'Revenue targets, court pricing, financial reports across all clubs.',
  },
  utilisation: {
    label: 'Head of Utilisation',
    permissions: ['manage_utilisation', 'approve_discounts', 'all_clubs_access'],
    description: 'Occupancy/utilisation reports and discount approval across all clubs.',
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
  for (const preset of Object.values(ROLE_PRESETS)) {
    if ([...preset.permissions].sort().join(',') === sorted) {
      return preset.label
    }
  }
  return permissions.length === 0 ? 'Manager' : 'Custom'
}
