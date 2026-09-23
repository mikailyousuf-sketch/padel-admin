import { requirePermission } from '@/lib/auth/guards'
import UtilisationClient from '../UtilisationClient'
export default async function ClubUtilisationPage({ params, searchParams }: { params: Promise<{ clubId: string }>; searchParams: Promise<{ mode?: string; from?: string; to?: string }> }) {
  await requirePermission('manage_utilisation')
  const { clubId } = await params
  const query = await searchParams
  return <UtilisationClient clubId={clubId} initialMode={query.mode} initialFrom={query.from} initialTo={query.to} />
}
