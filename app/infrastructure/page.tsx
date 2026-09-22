import { requirePermission } from '@/lib/auth/guards'
import InfrastructureClient from './InfrastructureClient'

// Backend dashboard — Sim (manage_infrastructure) and HOO only.
// A club manager hitting this URL directly gets redirected before
// any of this page's data or markup ever reaches the browser.
export default async function InfrastructurePage() {
  await requirePermission('manage_infrastructure', '/maintenance')
  return <InfrastructureClient />
}