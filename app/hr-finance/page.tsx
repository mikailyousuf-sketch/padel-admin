import { requirePermission } from '@/lib/auth/guards'
import HrFinanceClient from './HrFinanceClient'

// Backend dashboard — Jade (manage_hr_finance) and HOO only.
// A club manager hitting this URL directly gets redirected before any of
// this page's data (including compensation) ever reaches the browser.
export default async function HrFinancePage() {
  await requirePermission('manage_hr_finance', '/hr')
  return <HrFinanceClient />
}