import { getClubAccess } from '@/lib/auth/club-access'
import { listAccessibleClubsWithLocation } from './actions'
import SelectClubClient from './SelectClubClient'

export default async function SelectClubPage() {
  const [clubs, access] = await Promise.all([listAccessibleClubsWithLocation(), getClubAccess()])
  return <SelectClubClient clubs={clubs} canViewCompany={access.global} />
}
