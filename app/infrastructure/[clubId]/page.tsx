import { requirePermission } from '@/lib/auth/guards'
import ClubInfrastructureClient from './ClubInfrastructureClient'

export default async function ClubInfrastructurePage({ params }: { params: Promise<{ clubId: string }> }) {
  await requirePermission('manage_infrastructure', '/maintenance')
  const { clubId } = await params
  return <ClubInfrastructureClient clubId={clubId} />
}