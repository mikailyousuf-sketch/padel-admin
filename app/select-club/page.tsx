import { loadClubPicker } from './actions'
import SelectClubClient from './SelectClubClient'

export default async function SelectClubPage() {
  const { clubs, canViewCompany } = await loadClubPicker()
  return <SelectClubClient clubs={clubs} canViewCompany={canViewCompany} />
}
