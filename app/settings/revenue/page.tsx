import { requirePermission } from '@/lib/auth/guards'
import RevenueTargetsClient from './RevenueTargetsClient'

// Financial config — Finance (manage_finance) and HOO only. Uses the
// permission key that already existed in the schema (revenue_targets_write
// RLS policy), not a new one.
export default async function RevenueTargetsPage() {
  await requirePermission('manage_finance', '/')
  return <RevenueTargetsClient />
}