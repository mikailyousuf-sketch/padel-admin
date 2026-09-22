import { requirePermission } from '@/lib/auth/guards'
import ClubHrFinanceClient from './ClubHrFinanceClient'

export default async function ClubHrFinancePage({ params }: { params: Promise<{ clubId: string }> }) {
  await requirePermission('manage_hr_finance', '/hr')
  const { clubId } = await params
  return <ClubHrFinanceClient clubId={clubId} />
}