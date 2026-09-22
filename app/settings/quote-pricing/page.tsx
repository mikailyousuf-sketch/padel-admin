import { requirePermission } from '@/lib/auth/guards'
import QuotePricingClient from './QuotePricingClient'

// Financial config — Finance (manage_finance) and HOO only. Same table
// category as Revenue & Targets: feeds the Quote Generator directly.
export default async function QuotePricingPage() {
  await requirePermission('manage_finance', '/')
  return <QuotePricingClient />
}