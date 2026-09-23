import { requirePermission } from '@/lib/auth/guards'
import UtilisationClient from './UtilisationClient'
export default async function UtilisationPage({ searchParams }: { searchParams: Promise<{ mode?: string; from?: string; to?: string }> }) {
  await requirePermission('manage_utilisation')
  const query = await searchParams
  return <UtilisationClient initialMode={query.mode} initialFrom={query.from} initialTo={query.to} />
}
